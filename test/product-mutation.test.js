const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {Kernel}=require('../src/kernel'),{normalize,digest,source}=require('../src/product-mutation');
const SHA='a'.repeat(40),OTHER='b'.repeat(40);
function fixture(authority){const root=fs.mkdtempSync(path.join(os.tmpdir(),'wfe-create-'));const options={root,provider:{},productAuthority:{sourceIdentity:()=>({sha:SHA,clean:true}),approvalAuthority:authority}};const kernel=new Kernel(options);return {root,options,kernel,close:()=>fs.rmSync(root,{recursive:true,force:true})};}
const request=(overrides={})=>({requestId:'request-1',projectId:'counter',name:'Counter',baseSha:SHA,...overrides});
test('valid creation, exact retry, reload, conflict and target collision',()=>{const f=fixture();try{
 const r=f.kernel.createProduct(request());assert.equal(r.receipt.result,'PASS');assert.equal(r.receipt.baseSha,SHA);assert.equal(r.receipt.policy.allowed,true);assert.equal(r.receipt.policy.approvalRequired,false);assert.equal(f.kernel.state.projects.counter.runs.length,0);
 assert.equal(r.receipt.requestDigest,digest(normalize(request())));
 const again=f.kernel.createProduct(request());assert.equal(again.deduplicated,true);assert.deepEqual(again.receipt,r.receipt);assert.equal(Object.keys(f.kernel.state.projects).length,1);
 const restored=new Kernel(f.options);assert.deepEqual(restored.state,f.kernel.state);assert.deepEqual(restored.createProduct(request()).receipt,r.receipt);
 assert.throws(()=>restored.createProduct(request({name:'Changed'})),/REQUEST_ID_CONFLICT/);
 assert.equal(restored.createProduct(request({requestId:'request-2'})).receipt.code,'TARGET_EXISTS');assert.equal(Object.keys(restored.state.projects).length,1);
 }finally{f.close();}});
test('stale SHA and dirty/unloaded identity never create a partial product',()=>{const f=fixture();try{
 assert.equal(f.kernel.createProduct(request({baseSha:OTHER})).receipt.code,'STALE_SHA');assert.equal(Object.keys(f.kernel.state.projects).length,0);
 f.kernel.productMutations.sourceIdentity=()=>({sha:SHA,clean:false});assert.equal(f.kernel.createProduct(request({requestId:'dirty'})).receipt.code,'SOURCE_NOT_CLEAN');
 f.kernel.productMutations.sourceIdentity=()=>({sha:OTHER,clean:true});assert.equal(f.kernel.createProduct(request({requestId:'unloaded',baseSha:OTHER})).receipt.code,'STALE_SHA');
 assert.equal(Object.keys(new Kernel(f.options).state.projects).length,0);
 }finally{f.close();}});
test('required approval missing/unavailable/invalid is denied before mutation',()=>{const f=fixture();try{
 const protectedRequest={protection:'WARN_BEFORE_MUTATION'};
 assert.equal(f.kernel.createProduct(request(protectedRequest)).receipt.code,'APPROVAL_REQUIRED');
 assert.equal(f.kernel.createProduct(request({...protectedRequest,requestId:'unavailable',approvalId:'a1'})).receipt.code,'APPROVAL_AUTHORITY_UNAVAILABLE');
 for(const [label,proof]of [['unverified',{verified:false}],['expired',{expiresAt:'2000-01-01T00:00:00Z'}],['wrong-sha',{baseSha:OTHER}],['wrong-target',{targetId:'other'}],['wrong-digest',{requestDigest:'bad'}],['wrong-action',{action:'work.start'}],['wrong-key',{authority:'client'}],['wrong-id',{approvalId:'other'}]]){
  f.kernel.productMutations.approvalAuthority={verify:({approvalId,requestDigest})=>({authority:'WFEKey',verified:true,approvalId,requestDigest,action:'product.create',targetId:'counter',baseSha:SHA,expiresAt:'2099-01-01T00:00:00Z',...proof})};
  assert.equal(f.kernel.createProduct(request({...protectedRequest,requestId:label,approvalId:label})).receipt.code,'APPROVAL_INVALID');
 }
 assert.equal(Object.keys(f.kernel.state.projects).length,0);assert.deepEqual(f.kernel.state.productControl.consumedApprovals,{});
 }finally{f.close();}});
test('trusted approval port is consumed once atomically with receipt; retry survives restart',()=>{let calls=0;const f=fixture({verify:({approvalId,request,requestDigest})=>{calls++;return {authority:'WFEKey',verified:true,approvalId,requestDigest,action:'product.create',targetId:request.target.projectId,baseSha:SHA,expiresAt:'2099-01-01T00:00:00Z'};}});try{
 const input=request({protection:'WARN_BEFORE_MUTATION',approvalId:'decision-1'}),r=f.kernel.createProduct(input);assert.equal(r.receipt.result,'PASS');assert.equal(calls,1);assert.equal(r.receipt.approvalId,'decision-1');
 const restored=new Kernel(f.options);assert.equal(restored.createProduct(input).deduplicated,true);assert.equal(calls,1);assert.equal(Object.keys(restored.state.productControl.consumedApprovals).length,1);
 const replay=restored.createProduct(request({requestId:'replay',projectId:'another',protection:'WARN_BEFORE_MUTATION',approvalId:'decision-1'}));assert.equal(replay.receipt.code,'APPROVAL_REPLAY');assert.equal(calls,1);assert.equal(restored.state.projects.another,undefined);
 }finally{f.close();}});
test('failed atomic rename leaves neither product nor approval consumption; same request can recover',()=>{const f=fixture({verify:({approvalId,request,requestDigest})=>({authority:'WFEKey',verified:true,approvalId,requestDigest,action:'product.create',targetId:request.target.projectId,baseSha:SHA,expiresAt:'2099-01-01T00:00:00Z'})});const rename=fs.renameSync;try{
 f.kernel.save();const before=fs.readFileSync(f.kernel.stateFile,'utf8'),input=request({protection:'WARN_BEFORE_MUTATION',approvalId:'decision-1'});
 fs.renameSync=()=>{throw Error('injected disk failure')};assert.throws(()=>f.kernel.createProduct(input),/injected disk failure/);fs.renameSync=rename;
 assert.equal(fs.readFileSync(f.kernel.stateFile,'utf8'),before);assert.equal(f.kernel.state.projects.counter,undefined);assert.equal(f.kernel.state.productControl,undefined);
 assert.equal(new Kernel(f.options).createProduct(input).receipt.result,'PASS');
 }finally{fs.renameSync=rename;f.close();}});
test('reload in separate process preserves receipt and one product',()=>{const f=fixture();try{
 const original=f.kernel.createProduct(request()).receipt;
 const code=`const {Kernel}=require(${JSON.stringify(path.resolve(__dirname,'../src/kernel'))});const k=new Kernel({root:process.argv[1],provider:{},productAuthority:{sourceIdentity:()=>({sha:'${SHA}',clean:true})}});console.log(JSON.stringify({count:Object.keys(k.state.projects).length,receipt:k.createProduct(${JSON.stringify(request())}).receipt}));`;
 const r=JSON.parse(execFileSync(process.execPath,['-e',code,f.root],{encoding:'utf8',windowsHide:true}));assert.equal(r.count,1);assert.deepEqual(r.receipt,original);
 }finally{f.close();}});
test('input bypasses, prototype ids, stale owner and corrupt state fail closed',()=>{const f=fixture();try{
 for(const x of [request({approved:true}),request({projectId:'__proto__'}),request({requestId:'constructor'}),request({name:'\nCounter'})])assert.throws(()=>f.kernel.createProduct(x),/INVALID_REQUEST/);
 f.kernel.save();const second=new Kernel(f.options);f.kernel.createProduct(request());assert.throws(()=>second.createProduct(request({requestId:'other',projectId:'other'})),/STATE_CHANGED/);
 fs.writeFileSync(f.kernel.stateFile,'broken');assert.throws(()=>f.kernel.createProduct(request({requestId:'corrupt'})));assert.equal(fs.readFileSync(f.kernel.stateFile,'utf8'),'broken');
 }finally{f.close();}});
test('busy lock and source drift at commit point cannot create anything',()=>{const f=fixture();try{
 const lock=path.join(f.kernel.base,'product-create.lock');fs.writeFileSync(lock,'owner');assert.throws(()=>f.kernel.createProduct(request()),/MUTATION_BUSY/);fs.unlinkSync(lock);
 let calls=0;f.kernel.productMutations.sourceIdentity=()=>({sha:++calls===1?SHA:OTHER,clean:true});assert.throws(()=>f.kernel.createProduct(request()),/SOURCE_CHANGED/);assert.equal(f.kernel.state.projects.counter,undefined);assert.equal(fs.existsSync(f.kernel.stateFile),false);
 }finally{f.close();}});
test('lost acknowledgement and leftover lock after commit cannot duplicate the product',()=>{const f=fixture();try{
 const first=f.kernel.createProduct(request());fs.writeFileSync(path.join(f.kernel.base,'product-create.lock'),JSON.stringify({pid:999999999,requestId:'request-1'}));
 const restored=new Kernel(f.options),retry=restored.createProduct(request());assert.equal(retry.deduplicated,true);assert.deepEqual(retry.receipt,first.receipt);assert.equal(Object.keys(restored.state.projects).length,1);
 assert.throws(()=>restored.createProduct(request({requestId:'new',projectId:'new'})),/MUTATION_BUSY/);
 }finally{f.close();}});
test('real git source binding detects dirty tree, new commit and old loaded kernel',()=>{const root=fs.mkdtempSync(path.join(os.tmpdir(),'wfe-create-git-'));const git=args=>execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe'],windowsHide:true}).trim();try{
 git(['init']);fs.writeFileSync(path.join(root,'.gitignore'),'.wfe-next/\n');fs.writeFileSync(path.join(root,'source.txt'),'one');git(['add','.']);git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','one']);const first=source(root).sha,k=new Kernel({root,provider:{}});
 fs.writeFileSync(path.join(root,'source.txt'),'two');assert.equal(k.createProduct(request({baseSha:first})).receipt.code,'SOURCE_NOT_CLEAN');git(['add','.']);git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','two']);const next=source(root).sha;
 assert.equal(k.createProduct(request({requestId:'stale',baseSha:next})).receipt.code,'STALE_SHA');assert.equal(new Kernel({root,provider:{}}).createProduct(request({requestId:'fresh',baseSha:next})).receipt.result,'PASS');
 }finally{fs.rmSync(root,{recursive:true,force:true});}});
