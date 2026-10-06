const fs=require("fs"),path=require("path"),http=require("http"),https=require("https"),{spawn,execFileSync}=require("child_process");
const {assign:runtime,bind,preflight,ownsEndpoint,parseEvidence}=require('./browser-runtime');
const {validateMetadata,mutationAllowed}=require('./project-status');
const {normalizeProcedure}=require('./browser-procedure');
class Kernel{
 constructor({root,provider,productAuthority}){this.root=root;this.provider=provider;this.base=path.join(root,".wfe-next");this.stateFile=path.join(this.base,"state.json");fs.mkdirSync(path.join(this.base,"workspaces"),{recursive:true});this.state=this.load();this.productMutations=new (require("./product-mutation").ProductMutation)(this,productAuthority)}
 load(){try{return JSON.parse(fs.readFileSync(this.stateFile,"utf8"))}catch{return{projects:{}}}}save(){require("./product-mutation").atomicSave(this.stateFile,this.state)}project(id="playground"){return this.state.projects[id]??={id,name:"Playground",runs:[]}}
 projectWorkspace(id){const p=this.project(id);return p.workspace||p.runs.filter(r=>r.status==="DONE"&&r.workspace).at(-1)?.workspace||null}
 beginContinuation({projectId,goal,plan}){const p=this.project(projectId),w=this.projectWorkspace(projectId);if(!w||!fs.existsSync(w))throw new Error("accepted project workspace unavailable");p.workspace=w;const previous=p.runs.filter(r=>r.status==="DONE").at(-1);const run={id:`run-${Date.now()}`,goal,plan,workspace:w,runtime:previous?.runtime,continuation:true,status:"EVOLVING",steps:[],decisions:[],diagnostics:[],artifacts:[],checks:[],behavior:[],verifier:null,startedAt:new Date().toISOString()};p.runs.push(run);this.save();return run}
 finishContinuation(run,{pass,evidence,blocker}){run.status=pass?"DONE":"BLOCKED";run.continuationEvidence=evidence||null;run.blocker=pass?null:blocker||"continuation acceptance failed";run.finishedAt=new Date().toISOString();this.save();return run}
 createProduct(request){return this.productMutations.execute(request)}
 createProject({id,name,metadata}){if(!id||this.state.projects[id])throw new Error("project id unavailable");this.state.projects[id]={id,name:name||id,runs:[],createdAt:new Date().toISOString(),metadata:metadata?validateMetadata(metadata):{lifecycle:'ACTIVE',purpose:'USER_PROJECT',protection:'NORMAL',source:'Created through Project interface'}};this.save();return this.state.projects[id]}
 requireProject(id){if(!Object.hasOwn(this.state.projects,id))throw Error('Project unavailable');return this.state.projects[id]}
 updateGoal(id,goal,confirmed){const p=this.requireProject(id);mutationAllowed(p,confirmed);if(typeof goal!=='string')throw Error('invalid Goal');p.pendingGoal=goal;p.goalUpdatedAt=new Date().toISOString();delete p.preparedPlan;this.save();return p;}
 updateMetadata(id,m,confirmed){const p=this.requireProject(id);mutationAllowed(p,confirmed);p.metadata=validateMetadata(m);this.save();return p;}
 async plan(goal,projectId,confirmed){const p=projectId?this.requireProject(projectId):null;if(p)mutationAllowed(p,confirmed);const w=p&&this.projectWorkspace(projectId),plan=await (w?this.provider.planContinuation({goal,workspace:w}):this.provider.plan(goal));if(p){if(p.pendingGoal!==undefined&&p.pendingGoal!==goal)throw Error('Goal changed while planning; review and generate again');p.pendingGoal=goal;p.preparedPlan={goal,plan,createdAt:new Date().toISOString()};this.save();}return plan}

 async evolve({projectId,goal,plan}){const run=this.beginContinuation({projectId,goal,plan}),w=run.workspace;try{await this.step(run,"BUILDING",async()=>this.apply(run,await this.provider.evolve({goal,plan,workspace:w}),w));for(let attempt=0;attempt<3;attempt++){let failures=await this.check(run,w);if(!failures.length)failures=await this.behavioral(run,w);if(!failures.length)break;run.lastFailures=failures;if(failures.some(x=>/^CONTRACT:|^ACCEPTANCE PROCEDURE:|^WFE RUNTIME:/.test(x)))throw Error(failures.join("; "));if(attempt===2)throw Error("Acceptance still failing: "+failures.join("; "));await this.step(run,"REPAIRING",async()=>this.apply(run,await this.provider.repair({goal,plan,failures,workspace:w}),w))}await this.step(run,"VERIFYING",async()=>{run.verifier=this.verify(run,w);if(!run.verifier.pass)throw Error(run.verifier.failures.join("; "))});run.status="DONE";run.finishedAt=new Date().toISOString();this.save();return run}catch(e){run.status="BLOCKED";run.blocker=e.message;run.finishedAt=new Date().toISOString();this.save();return run}}
 async start({projectId="playground",goal,plan}){const p=this.project(projectId),id=`run-${Date.now()}`,w=path.join(this.base,"workspaces",id);fs.mkdirSync(w,{recursive:true});const run={id,goal,plan,workspace:w,status:"BUILDING",steps:[],decisions:[],diagnostics:[],artifacts:[],checks:[],behavior:[],verifier:null,startedAt:new Date().toISOString()};p.runs.push(run);this.save();try{for(let attempt=0;attempt<3;attempt++){if(attempt===0)await this.step(run,"BUILDING",async()=>{
 const prior=p.runs.at(-2),boundary=/^(CONTRACT:|ACCEPTANCE PROCEDURE:|WFE RUNTIME:)/;
 if(prior?.status==='BLOCKED'&&prior.goal===goal&&boundary.test(prior.blocker||'')&&prior.workspace&&path.resolve(prior.workspace).startsWith(path.resolve(this.base,'workspaces')+path.sep)&&fs.existsSync(prior.workspace)){
  fs.cpSync(prior.workspace,w,{recursive:true});run.retryOf=prior.id;this.apply(run,{files:{},decision:'Explicit retry of terminal boundary failure; copied candidate into new isolated workspace; independent acceptance required'},w);
 }else this.apply(run,await this.provider.implement({goal,plan,workspace:w}),w);
});else await this.step(run,"REPAIRING",async()=>this.apply(run,await this.provider.repair({goal,plan,failures:run.lastFailures,workspace:w}),w));let failures=await this.check(run,w);if(!failures.length)failures=await this.behavioral(run,w);if(!failures.length)break;run.lastFailures=failures;if(failures.some(x=>/^CONTRACT:|^ACCEPTANCE PROCEDURE:|^WFE RUNTIME:/.test(x)))throw Error(failures.join("; "));if(attempt===2)throw new Error(`Acceptance still failing: ${failures.join("; ")}`)}await this.step(run,"VERIFYING",async()=>{run.verifier=this.verify(run,w);if(!run.verifier.pass)throw new Error(run.verifier.failures.join("; "))});run.status="DONE";run.useUrl=run.runtime?.browserUrl||this.readContract(w)?.browserUrl;run.finishedAt=new Date().toISOString();this.save();return run}catch(e){run.status="BLOCKED";run.blocker=e.message;run.finishedAt=new Date().toISOString();this.save();return run}}
 apply(run,o,w){this.writeFiles(w,o.files);run.decisions.push(o.decision);if(o.diagnostic)run.diagnostics.push(o.diagnostic);run.product=o.product||this.readJson(w,"product.json");run.artifacts=this.artifacts(w)}
 async step(run,label,fn){const s={label,status:"RUNNING",startedAt:new Date().toISOString()};run.status=label;run.steps.push(s);this.save();try{await fn();s.status="DONE"}catch(e){s.status="FAILED";s.error=e.message;throw e}finally{s.finishedAt=new Date().toISOString();this.save()}}
 async check(run,w){
 run.status="CHECKING";this.save();const f=[];
 for(const n of ["product.json","wfe-run.json"])if(!this.readJson(w,n))f.push('CONTRACT: '+n+' missing or invalid');
 const norm=this.normalizeContract(this.readJson(w,'wfe-run.json'));
 if(norm.error)f.push('CONTRACT: '+norm.error);
 else {const desktop=norm.ready?.kind==='process-window';for(const k of desktop?['build','start','artifact','ready','stop']:['start','ready','browserUrl'])if(!norm[k])f.push('CONTRACT: missing '+k);
 if(norm.browserUrl)try{normalizeProcedure(this.readJson(w,'wfe-browser.json'));}catch(e){f.push(e.message);}
 if(desktop&&!this.readJson(w,'wfe-desktop.json'))f.push('ACCEPTANCE PROCEDURE: wfe-desktop.json missing or invalid');}
 for(const file of this.artifacts(w).filter(x=>x.endsWith('.js')))try{execFileSync(process.execPath,['--check',path.join(w,file)],{stdio:'pipe'});}catch{f.push(file+' syntax invalid');}
 run.checks.push({at:new Date().toISOString(),pass:!f.length,failures:f});this.save();return f;
}
 async behavioral(run,w){run.status="ACCEPTING";this.save();let c=this.readContract(w);const fail=[],desktop=c?.ready?.kind==="process-window";if(c?.browserUrl){const rt=run.runtime?bind(c,run.runtime.port):await runtime(c);run.runtime=rt;c={...c,runtime:rt,ready:rt.ready,browserUrl:rt.browserUrl};this.save()}if(c.prepare){const r=await this.command(c.prepare,w,120000);if(r.code!==0)fail.push(`prepare failed: ${r.tail}`)}if(fail.length){run.behavior.push({pass:false,failures:fail});this.save();return fail}if(desktop){const b=await this.command(c.build,w,180000);if(b.code!==0)fail.push(`build failed: ${b.tail}`);if(!fs.existsSync(path.join(w,c.artifact)))fail.push("declared artifact absent");if(!fail.length){const a=await this.command({command:"powershell",args:["-ExecutionPolicy","Bypass","-File",path.join(this.root,"scripts","desktop-executor.ps1"),"-Workspace",w,"-Procedure",path.join(w,"wfe-desktop.json")]},this.root,180000);let result;try{result=JSON.parse(a.tail.split(/\\r?\\n/).filter(Boolean).at(-1))}catch{}run.desktopRequired=true;run.desktopAcceptance=result||{pass:false,error:"invalid desktop evidence",raw:a.tail};if(a.code!==0||!result?.pass)fail.push(`independent desktop acceptance failed: exit=${a.code}; output=${a.tail}`);run.behavior.push({at:new Date().toISOString(),pass:!fail.length,checks:result?.evidence||[],failures:fail})}this.save();return fail}await preflight(c.runtime);const app=this.spawnApp(c.start,w,c.runtime);
 try{
  const ready=await this.waitReady(c.ready);
  if(!ready||!app.alive()||!ownsEndpoint(app.pid,c.runtime.port))fail.push('WFE RUNTIME: intended product readiness/ownership failed; '+app.tail());
  run.runtimeEvidence={...c.runtime,pid:app.pid,ready,owned:!fail.length};
  if(!fail.length&&c.accept){
   const env={...process.env,[c.runtime.portEnv]:String(c.runtime.port)},a=await this.command({...c.accept,env},w,180000),result=parseEvidence(a.tail);
   if(a.code!==0||!result?.pass)fail.push('behavioral acceptance failed: exit='+a.code+'; output='+a.tail);
   run.behavior.push({at:new Date().toISOString(),pass:!fail.length,checks:result?.checks||[],failures:[...fail]});
  }
 }finally{await app.stop();}
 // Browser executor starts its own owned process with the SAME effective port,
 // then can independently prove stop/restart and persistence.
 if(!fail.length&&c.browserUrl){
  const b=await this.command({command:process.execPath,args:[path.join(__dirname,'..','scripts','browser-executor.js'),w,path.join(w,'wfe-browser.json')],env:{...process.env,WFE_RUNTIME_PORT:String(run.runtime.port)}},this.root,180000),result=parseEvidence(b.tail);
  run.browserRequired=true;run.browserAcceptance=result||{pass:false,error:'invalid browser evidence',raw:b.tail};
  if(b.code!==0||!result?.pass)fail.push((result?.class==='ACCEPTANCE_PROCEDURE'?'ACCEPTANCE PROCEDURE: ':result?.class==='WFE_RUNTIME'?'WFE RUNTIME: ':'independent browser acceptance failed: ')+'exit='+b.code+'; output='+b.tail);
  if(!c.accept)run.behavior.push({at:new Date().toISOString(),pass:!fail.length,checks:result?.evidence||[],failures:[...fail]});
 }
 this.save();return fail;
 }

 async openAccepted(run){
 if(run.status!=='DONE'||!run.verifier?.pass)throw Error('accepted result unavailable');
 const c=this.readContract(run.workspace);if(!c?.browserUrl)throw Error('browser result unavailable');
 const rt=run.runtime?bind(c,run.runtime.port):await runtime(c);await preflight(rt);const app=this.spawnApp(c.start,run.workspace,rt);
 const ready=await this.waitReady(rt.ready),owned=app.alive()&&ownsEndpoint(app.pid,rt.port);
 if(!ready||!owned){await app.stop();throw Error('WFE RUNTIME: accepted result readiness/ownership failed');}
 run.runtime=rt;run.openEvidence={...rt,pid:app.pid,ready,owned,at:new Date().toISOString()};this.save();
 return{app,url:rt.browserUrl,pid:app.pid,port:rt.port,ready,owned};
}
 spawnApp(spec,w,rt){
 const env={...process.env};if(rt?.portEnv)env[rt.portEnv]=String(rt.port);
 const cp=spawn(spec.command,spec.args,{cwd:w,env,windowsHide:true,stdio:['ignore','pipe','pipe']});let log='';
 cp.stdout.on('data',d=>log+=d);cp.stderr.on('data',d=>log+=d);cp.on('error',e=>log+=e.message);
 return{pid:cp.pid,alive:()=>cp.exitCode===null&&cp.signalCode===null&&!cp.killed,tail:()=>log.slice(-2000),stop:async()=>{
 if(cp.exitCode!==null||cp.signalCode!==null)return;cp.kill();const until=Date.now()+5000;while(cp.exitCode===null&&cp.signalCode===null&&Date.now()<until)await new Promise(r=>setTimeout(r,100));if(cp.exitCode===null&&cp.signalCode===null)throw Error('WFE RUNTIME: owned product failed to exit');
 }};
}
 command(spec,w,timeout){return new Promise((ok)=>{const cp=spawn(spec.command,spec.args,{cwd:w,env:spec.env||process.env,windowsHide:true,stdio:["ignore","pipe","pipe"]});let out="";cp.stdout.on("data",d=>out+=d);cp.stderr.on("data",d=>out+=d);const t=setTimeout(()=>cp.kill(),timeout);cp.on("error",e=>{clearTimeout(t);ok({code:-1,tail:e.message})});cp.on("close",code=>{clearTimeout(t);ok({code,tail:out.slice(-20000)})})})}
 waitReady(r){const until=Date.now()+(r.timeoutMs||10000);return new Promise(ok=>{const hit=()=>{const lib=r.url.startsWith("https")?https:http,req=lib.get(r.url,res=>{res.resume();if(res.statusCode>=200&&res.statusCode<300)return ok(true);retry()});req.on("error",retry);req.setTimeout(1000,()=>req.destroy())},retry=()=>Date.now()>until?ok(false):setTimeout(hit,200);hit()})}
 verify(run,w){const f=[];if(!run.checks.at(-1)?.pass)f.push("static checks not passing");if(!run.behavior.at(-1)?.pass)f.push("behavioral acceptance not passing");if(run.browserRequired&&!run.browserAcceptance?.pass)f.push("independent browser acceptance not passing");if(run.desktopRequired&&!run.desktopAcceptance?.pass)f.push("independent desktop acceptance not passing");if(!this.readJson(w,"product.json"))f.push("product record absent");return{pass:!f.length,failures:f,behaviorChecks:run.behavior.at(-1)?.checks||[],browserAcceptance:run.browserAcceptance||null,at:new Date().toISOString()}}
 readJson(w,n){try{return JSON.parse(fs.readFileSync(path.join(w,n),"utf8"))}catch{return null}} normalizeContract(c){if(!c||typeof c!=="object")return{error:"invalid run contract"};const o={...c};if(o.accept?.procedure&&!o.accept.command){if(o.accept.procedure!=='wfe-browser.json')return{error:'accept.procedure must name independent wfe-browser.json'};delete o.accept;}for(const k of ["prepare","build","start","accept"])if(o[k]&&(typeof o[k].command!=="string"||!Array.isArray(o[k].args)))return{error:k+" must be command + args"};if(o.browserUrl){if(!o.runtime||typeof o.runtime.portEnv!=="string"||!/^[A-Z_][A-Z0-9_]*$/i.test(o.runtime.portEnv))return{error:"browser runtime requires bounded runtime.portEnv"};if(/^(NODE_OPTIONS|NODE_PATH|PATH|COMSPEC|SYSTEMROOT|WFE_RUNTIME_PORT|WFE_MODEL_COMMAND|WFE_BROWSER_EXE|WFE_PUPPETEER_PATH)$/i.test(o.runtime.portEnv))return{error:'reserved runtime binding'};for(const u of [o.browserUrl,o.ready?.url]){try{const x=new URL(u);if(!["http:","https:"].includes(x.protocol)||!["127.0.0.1","localhost"].includes(x.hostname)||!x.port||x.username||x.password)return{error:"browser endpoint must be explicit local port"}}catch{return{error:"invalid browser endpoint"}}}}return o} readContract(w){const c=this.normalizeContract(this.readJson(w,"wfe-run.json"));return c?.error?null:c}artifacts(w){return fs.readdirSync(w).filter(x=>!x.startsWith("."))}writeFiles(w,files={}){for(const[n,b]of Object.entries(files)){const f=path.join(w,n);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,b)}}
}
module.exports={Kernel};
