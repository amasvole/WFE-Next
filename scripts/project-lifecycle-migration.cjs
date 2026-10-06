// Explicit, evidence-bound one-time classification. Never infer provenance from names.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');const root=path.resolve(__dirname,'..'),dir=root+'/.wfe-next/workbench-003',file=root+'/.wfe-next/state.json';
const baseline=JSON.parse(fs.readFileSync(dir+'/baseline-state.json')),state=JSON.parse(fs.readFileSync(file));assert.deepEqual(state,baseline,'state changed since inventory; stop and inspect');
const documented={
 'real-generation':['ACCEPTANCE_FIXTURE','scripts/real-generation.js exact projectId'],
 'general-app':['ACCEPTANCE_FIXTURE','scripts/general-app-acceptance.js exact projectId'],
 'cross-stack':['ACCEPTANCE_FIXTURE','scripts/cross-stack-acceptance.js exact projectId'],
 'household-tasks-final-muwdvsnz':['ACCEPTANCE_FIXTURE','docs/PRODUCT-LOOP-001.md exact Project and accepted Runs']
};
for(const p of Object.values(state.projects)){assert(!p.metadata,'already classified');const user=p.id==='print-queue-mini-muwicviu',d=documented[p.id];p.metadata={lifecycle:user?'ACTIVE':'INACTIVE',purpose:user?'USER_PROJECT':d?.[0]||'LEGACY_UNKNOWN',protection:user?'NORMAL':'WARN_BEFORE_MUTATION',source:user?'Pavel WORKBENCH-003 instruction and existing browser Project identity':d?.[1]||'Legacy inventory; purpose not established from authoritative evidence'};}
const text=fs.readFileSync(dir+'/recovered-browser-text.txt','utf8').replace(/\r/g,''),body=text.slice(text.lastIndexOf('\nNew Goal\n')+10),goal=body.split('\nGenerate Plan\n')[0].trim();assert(goal.startsWith('Create a small local browser application'));
const section=(a,b)=>body.split('\n'+a+'\n')[1].split('\n'+b+'\n')[0].trim().split('\n');const plan={goal,components:section('Components','Implementation'),implementation:section('Implementation','Acceptance'),acceptance:section('Acceptance','Latest activity')};
const p=state.projects['print-queue-mini-muwicviu'];assert.equal(p.runs.length,0);p.pendingGoal=goal;p.preparedPlan={goal,plan,createdAt:null,recoveredAt:new Date().toISOString(),reviewNote:'Known intent omission reported by Pavel: material PLA/PETG/ASA is absent. Review and correct Goal/Plan before START.',source:'Existing browser Goal/Plan visible text recovered; original generation time unavailable'};
for(const [id,p]of Object.entries(baseline.projects)){const now=structuredClone(state.projects[id]);delete now.metadata;delete now.pendingGoal;delete now.preparedPlan;assert.deepEqual(now,p,'history changed '+id);}
fs.writeFileSync(file,JSON.stringify(state,null,2));fs.writeFileSync(dir+'/classified-state.json',JSON.stringify(state,null,2));console.log('13 Projects classified; all pre-existing Project fields preserved; Print Queue prepared Plan recovered without START');
