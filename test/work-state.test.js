const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {Kernel}=require('../src/kernel');
const {currentWork,selfState,validateWorkProjects,STATES}=require('../src/work-state');
const example=require('../docs/examples/wfe-self-project.json');
const state=()=>({projects:{'wfe-self':structuredClone(example),legacy:{id:'legacy',name:'Old demo',runs:[{id:'old',status:'DONE'}]}}});
test('offline staging preserves all existing canonical records and rejects overwrite',()=>{
 const {stage}=require('../scripts/stage-self-state.cjs');const old={projects:{legacy:state().projects.legacy},productControl:{receipt:'unchanged'}},before=JSON.stringify(old);
 const next=stage(old,example);assert.equal(JSON.stringify(old),before);assert.deepEqual(next.projects.legacy,old.projects.legacy);assert.deepEqual(next.productControl,old.productControl);assert.throws(()=>stage(next,example));assert.equal(selfState(next).availability,'RECORDED');
});
test('product.create keeps managed work and legacy canonical state intact',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'wfe-work-product-'));
 try{const k=new Kernel({root,provider:{},productAuthority:{sourceIdentity:()=>({sha:'a'.repeat(40),clean:true})}});k.state=state();k.save();const before=structuredClone(k.state);k.createProduct({requestId:'preserve-work',projectId:'empty',name:'Empty',baseSha:'a'.repeat(40)});assert.deepEqual(k.state.projects['wfe-self'],before.projects['wfe-self']);assert.deepEqual(k.state.projects.legacy,before.projects.legacy);assert.deepEqual(currentWork(new Kernel({root,provider:{}}).state).items,currentWork(before).items);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('explicit lifecycle, frozen/history isolation, self state and deterministic actions',()=>{
 const s=state(),before=JSON.stringify(s),p=currentWork(s);assert.deepEqual(p,currentWork(s));
 assert.equal(p.active.length,1);assert.equal(p.blocked[0].item.blocker.code,'EXAMPLE_ACCEPTANCE_PENDING');
 assert.equal(p.frozen[0].item.nextAction.kind,'NONE');assert.equal(p.historical[0].item.nextAction.kind,'NONE');
 assert.deepEqual(p.unclassifiedProjects,['legacy']);assert.equal(selfState(s).acceptedMainSha,example.workState.acceptedMainSha);
 assert.equal(JSON.stringify(s),before);
 for(const lifecycle of STATES){const x=state(),i=x.projects['wfe-self'].workState.items[0];i.state=lifecycle;i.nextAction={kind:['DONE','FROZEN','HISTORICAL','CANCELLED'].includes(lifecycle)?'NONE':'OPERATOR',summary:'Explicit action'};if(lifecycle==='BLOCKED')i.blocker={class:'UNKNOWN',summary:'Explicit unknown reason',observedAt:'2026-10-07T00:00:00Z'};assert.equal(currentWork(x)[lifecycle.toLowerCase()].some(y=>y.item.id===i.id),true);}
});
test('GitHub, runtime and approval references never determine status or approval',()=>{
 const s=state(),i=s.projects['wfe-self'].workState.items[0];i.binding.pr=123;i.binding.githubCheck='merged';i.binding.runner='runner-reference';i.binding.decisionId='decision-reference';s.active=['wfe-self'];
 const p=currentWork(s);assert.equal(p.active[0].item.state,'ACTIVE');assert.equal(p.frozen.length,1);assert.equal(p.active[0].authorities.runner,'UNAVAILABLE');assert.equal(p.active[0].authorities.approval,'UNAVAILABLE');assert.equal(p.active[0].authorities.granted,false);
 assert.equal(selfState({projects:{}}).availability,'UNKNOWN');
});
test('invalid blockers, terminal actions, shell dispatch, identities and unknown fields fail closed',()=>{
 const edits=[i=>{i.state='BLOCKED'},i=>{i.state='FROZEN'},i=>{i.nextAction={kind:'AUTOMATIC',capability:'shell'}},i=>{i.state='PR_MERGED'},i=>{i.binding.currentRunId='missing'},i=>{i.blocker={}},i=>{i.nextAction={kind:'WFEKEY',granted:true}}];
 for(const edit of edits){const s=state();edit(s.projects['wfe-self'].workState.items[0]);assert.throws(()=>validateWorkProjects(s));}
 const s=state();s.projects.other=structuredClone(example);assert.throws(()=>validateWorkProjects(s));
});
test('fixed observation automatic action and WFEKey requirement grant no execution authority',()=>{
 const s=state(),i=s.projects['wfe-self'].workState.items[0];i.nextAction={kind:'AUTOMATIC',capability:'wfe_self_state_get'};validateWorkProjects(s);i.nextAction={kind:'WFEKEY',summary:'Decision needed'};validateWorkProjects(s);assert.equal(currentWork(s).active[0].authorities.granted,false);
});
test('canonical persistence and legacy defaults survive reload without rewriting product state',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'wfe-work-'));
 try{const k=new Kernel({root,provider:{}});k.state=state();k.save();const disk=fs.readFileSync(k.stateFile,'utf8'),loaded=new Kernel({root,provider:{}});assert.deepEqual(currentWork(loaded.state),currentWork(k.state));assert.equal(fs.readFileSync(k.stateFile,'utf8'),disk);assert.deepEqual(loaded.state.projects.legacy,k.state.projects.legacy);
 delete k.state.projects['wfe-self'];k.save();assert.deepEqual(new Kernel({root,provider:{}}).state,k.state);assert.deepEqual(currentWork(k.state).items,[]);
 fs.writeFileSync(k.stateFile,'{broken');assert.throws(()=>new Kernel({root,provider:{}}));assert.equal(fs.readFileSync(k.stateFile,'utf8'),'{broken');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
