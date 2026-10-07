// Offline review artifact only. Never replaces the input snapshot or live store.
const fs=require('node:fs');
const {validateWorkProjects}=require('../src/work-state');
function stage(state,project){
 validateWorkProjects(state);
 if(Object.hasOwn(state.projects,project.id)||Object.values(state.projects).some(p=>p.workState?.managedSystem==='WFE'))throw Error('self Project already exists; explicit review required');
 if(project.workState?.managedSystem!=='WFE')throw Error('explicit managed WFE Project required');
 const next=structuredClone(state);next.projects[project.id]=structuredClone(project);validateWorkProjects(next);return next;
}
if(require.main===module){
 const [input,record,output,...extra]=process.argv.slice(2);
 if(!input||!record||!output||extra.length)throw Error('Usage: node scripts/stage-self-state.cjs snapshot.json explicit-project.json new-review-snapshot.json');
 const next=stage(JSON.parse(fs.readFileSync(input,'utf8')),JSON.parse(fs.readFileSync(record,'utf8')));
 fs.writeFileSync(output,JSON.stringify(next,null,2),{flag:'wx'});
}
module.exports={stage};
