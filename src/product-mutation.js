// The only supported mutation here is creation of an empty Project. This is
// kernel authority, never a client-selected policy or a general command broker.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const POLICY='wfe.product.create.v1',ACTION='product.create';
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const own=(x,k)=>Object.hasOwn(x,k);
const fail=code=>{throw Object.assign(Error(code),{code});};
function normalize(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['requestId','projectId','name','baseSha','protection','approvalId'].includes(k)))fail('INVALID_REQUEST');
 for(const k of ['requestId','projectId'])if(typeof input[k]!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/.test(input[k])||['__proto__','constructor','prototype'].includes(input[k]))fail('INVALID_REQUEST');
 if(typeof input.name!=='string'||input.name.length<1||input.name.length>160||input.name.trim()!==input.name||/[\x00-\x1f\x7f]/.test(input.name))fail('INVALID_REQUEST');
 if(typeof input.baseSha!=='string'||!/^([a-f0-9]{40}|[a-f0-9]{64})$/.test(input.baseSha))fail('INVALID_REQUEST');
 const protection=input.protection??'NORMAL';if(!['NORMAL','WARN_BEFORE_MUTATION'].includes(protection))fail('INVALID_REQUEST');
 if(input.approvalId!==undefined&&(typeof input.approvalId!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/.test(input.approvalId)||['__proto__','constructor','prototype'].includes(input.approvalId)))fail('INVALID_REQUEST');
 return {action:ACTION,requestId:input.requestId,target:{projectId:input.projectId,name:input.name,protection},baseSha:input.baseSha,approvalId:input.approvalId??null};
}
function source(root){
 const git=args=>execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','ignore'],windowsHide:true}).trim();
 try{return {sha:git(['rev-parse','HEAD']),clean:git(['status','--porcelain','--untracked-files=normal'])===''};}catch{return {sha:null,clean:false};}
}
// Atomic replacement stores Project + receipt + approval consumption together.
// fsync the file before rename. Temp files from interrupted writes are not state.
function atomicSave(file,state){
 const temp=file+'.'+crypto.randomUUID()+'.tmp';let fd;
 try{fd=fs.openSync(temp,'wx');fs.writeFileSync(fd,JSON.stringify(state,null,2));fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(temp,file);}catch(e){if(fd!==undefined)fs.closeSync(fd);try{fs.unlinkSync(temp);}catch{}throw e;}
}
class ProductMutation{
 constructor(kernel,{sourceIdentity=()=>source(kernel.root),approvalAuthority=null}={}){
  this.kernel=kernel;this.sourceIdentity=sourceIdentity;this.loaded=sourceIdentity();this.approvalAuthority=approvalAuthority;
 }
 execute(input){
  const request=normalize(input),requestDigest=digest(request),k=this.kernel,lock=path.join(k.base,'product-create.lock');
  // A committed terminal result is readable even if its writer died before
  // releasing the lock or returning HTTP. Never execute a second mutation.
  if(fs.existsSync(k.stateFile)){
   const persisted=JSON.parse(fs.readFileSync(k.stateFile,'utf8'));
   const receipts=persisted?.productControl?.receipts;
   if(receipts&&own(receipts,request.requestId)){
    const old=receipts[request.requestId];if(old.requestDigest!==requestDigest)fail('REQUEST_ID_CONFLICT');
    return {receipt:structuredClone(old),deduplicated:true};
   }
  }
  let fd;try{fd=fs.openSync(lock,'wx');}catch(e){if(e.code==='EEXIST')fail('MUTATION_BUSY');throw e;}
  try{
   fs.writeFileSync(fd,JSON.stringify({pid:process.pid,requestId:request.requestId}));fs.fsyncSync(fd);
   // Load strictly. Never reinterpret corrupt canonical state as an empty store.
   const next=fs.existsSync(k.stateFile)?JSON.parse(fs.readFileSync(k.stateFile,'utf8')):structuredClone(k.state);
   if(!next||!next.projects||Array.isArray(next.projects)||typeof next.projects!=='object')fail('STATE_INVALID');
   // A second stale Kernel must not overwrite an owner's live state. Existing
   // async Run/Plan closures keep their Project references in the sole owner.
   if(JSON.stringify(next)!==JSON.stringify(k.state))fail('STATE_CHANGED');
   const control=next.productControl??={schemaVersion:'wfe.product.mutations.v1',receipts:{},consumedApprovals:{}};
   if(control.schemaVersion!=='wfe.product.mutations.v1'||!control.receipts||!control.consumedApprovals)fail('STATE_INVALID');
   const old=own(control.receipts,request.requestId)?control.receipts[request.requestId]:null;
   if(old){if(old.requestDigest!==requestDigest)fail('REQUEST_ID_CONFLICT');return {receipt:structuredClone(old),deduplicated:true};}
   const current=this.sourceIdentity(),approvalRequired=request.target.protection==='WARN_BEFORE_MUTATION';
   const decision={policyId:POLICY,action:ACTION,targetId:request.target.projectId,approvalRequired,authority:approvalRequired?'WFEKey':null,reason:approvalRequired?'Protected classification requires WFEKey':'New empty NORMAL user Project only; no execution, workspace, secrets or existing-project mutation',allowed:false};
   let code='CREATED',approval=null;
   if(!current.sha||!current.clean||!this.loaded.clean)code='SOURCE_NOT_CLEAN';
   else if(request.baseSha!==current.sha||this.loaded.sha!==current.sha)code='STALE_SHA';
   else if(own(next.projects,request.target.projectId))code='TARGET_EXISTS';
   else if(approvalRequired){
    if(!request.approvalId)code='APPROVAL_REQUIRED';
    else if(own(control.consumedApprovals,request.approvalId))code='APPROVAL_REPLAY';
    else if(!this.approvalAuthority)code='APPROVAL_AUTHORITY_UNAVAILABLE';
    else{
     // Trusted synchronous server port, never an MCP approval boolean. The
     // WFEKey bridge must authenticate the decision; client data is not proof.
     try{approval=this.approvalAuthority.verify({approvalId:request.approvalId,request:structuredClone(request),requestDigest});}catch{approval=null;}
     if(!approval||approval.authority!=='WFEKey'||approval.verified!==true||approval.approvalId!==request.approvalId||approval.requestDigest!==requestDigest||approval.action!==ACTION||approval.targetId!==request.target.projectId||approval.baseSha!==request.baseSha||!Number.isFinite(Date.parse(approval.expiresAt))||Date.parse(approval.expiresAt)<=Date.now())code='APPROVAL_INVALID';
    }
   }else if(request.approvalId)code='UNEXPECTED_APPROVAL';
   decision.allowed=code==='CREATED';
   const receipt={schemaVersion:'wfe.product.receipt.v1',receiptId:'product-create-'+digest({requestId:request.requestId}),requestId:request.requestId,requestDigest,request,action:ACTION,targetId:request.target.projectId,baseSha:request.baseSha,observedSha:current.sha,policy:decision,approvalId:decision.allowed&&approvalRequired?request.approvalId:null,result:decision.allowed?'PASS':'REJECTED',code,finishedAt:new Date().toISOString()};
   if(decision.allowed){
    const metadata={lifecycle:'ACTIVE',purpose:'USER_PROJECT',protection:request.target.protection,source:'Authoritative '+POLICY};
    next.projects[request.target.projectId]={id:request.target.projectId,name:request.target.name,runs:[],createdAt:receipt.finishedAt,metadata,creationReceiptId:receipt.receiptId};
    if(approvalRequired)control.consumedApprovals[request.approvalId]={receiptId:receipt.receiptId,requestDigest};
   }
   control.receipts[request.requestId]=receipt;
   // Recheck immediately before the commit point (all work here is synchronous).
   if(decision.allowed){const final=this.sourceIdentity();if(!final.clean||final.sha!==current.sha)fail('SOURCE_CHANGED');}
   atomicSave(k.stateFile,next);
   if(decision.allowed)k.state.projects[request.target.projectId]=next.projects[request.target.projectId];
   k.state.productControl=control;
   return {receipt:structuredClone(receipt),deduplicated:false};
  }finally{fs.closeSync(fd);fs.unlinkSync(lock);}
 }
}
module.exports={ProductMutation,normalize,digest,source,atomicSave};
