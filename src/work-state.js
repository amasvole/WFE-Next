// Optional canonical Project extension. No scheduler, execution or approval authority.
const STATES=['ACTIVE','WAITING','BLOCKED','READY','DONE','FROZEN','HISTORICAL','CANCELLED'];
const terminal=new Set(['DONE','FROZEN','HISTORICAL','CANCELLED']);
const string={type:'string',minLength:1,maxLength:1000};
const id={type:'string',pattern:'^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$'};
const sha={type:'string',pattern:'^[a-f0-9]{40}$'};
const object=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
const nullable=x=>({anyOf:[x,{type:'null'}]});
const actionSchema=object({kind:{enum:['AUTOMATIC','WFEKEY','OPERATOR','NONE']},capability:{enum:['wfe_current_work_get','wfe_work_item_get','wfe_next_actions_get','wfe_self_state_get']},summary:string},['kind']);
const blockerSchema=object({class:{enum:['DEPENDENCY','APPROVAL','AUTHORITY','EXTERNAL','EXECUTION','UNKNOWN']},summary:string,code:string,dependencyWorkId:id,requiredAction:string,approvalId:id,observedAt:{type:'string',format:'date-time'}},['class','summary','observedAt']);
const bindingSchema=object({currentRunId:id,acceptedRunId:id,repository:string,pr:{type:'integer',minimum:1},branch:string,candidateSha:sha,frozenSha:sha,node:id,runner:id,decisionId:id,githubCheck:string},[]);
const itemSchema=object({id,title:string,purpose:string,parentWorkId:id,relatedWorkIds:{type:'array',items:id,maxItems:100},state:{enum:STATES},binding:bindingSchema,blocker:blockerSchema,nextAction:actionSchema},['id','title','purpose','state','nextAction']);
const workStateSchema=object({schemaVersion:{const:'wfe.project.work.v1'},managedSystem:{const:'WFE'},acceptedMainSha:sha,items:{type:'array',items:itemSchema,maxItems:100}},['schemaVersion','items']);
// Same closed schemas are validated in the kernel before persistence and in MCP.
function validateSchema(value,schema){
 if(schema.anyOf){if(!schema.anyOf.some(s=>{try{validateSchema(value,s);return true}catch{return false}}))throw Error('invalid work state');return;}
 if(schema.const!==undefined&&value!==schema.const)throw Error('invalid work state');
 if(schema.enum&&!schema.enum.includes(value))throw Error('invalid work state');
 if(schema.type==='null'&&value!==null)throw Error('invalid work state');
 if(schema.type==='string'&&(typeof value!=='string'||value.length<(schema.minLength||0)||value.length>(schema.maxLength||1000)||(schema.pattern&&!new RegExp(schema.pattern).test(value))||(schema.format==='date-time'&&(!/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(value)||!Number.isFinite(Date.parse(value))))))throw Error('invalid work state');
 if(schema.type==='integer'&&(!Number.isInteger(value)||value<schema.minimum))throw Error('invalid work state');
 if(schema.type==='array'){if(!Array.isArray(value)||value.length>schema.maxItems)throw Error('invalid work state');value.forEach(x=>validateSchema(x,schema.items));}
 if(schema.type==='object'){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!Object.hasOwn(schema.properties,k))||schema.required.some(k=>!Object.hasOwn(value,k)))throw Error('invalid work state');for(const [k,v]of Object.entries(value))validateSchema(v,schema.properties[k]);}
}
function validateWorkState(project){
 const w=project.workState;if(w===undefined)return;
 validateSchema(w,workStateSchema);
 if(w.acceptedMainSha&&w.managedSystem!=='WFE')throw Error('accepted main requires managed WFE Project');
 const ids=new Set();for(const i of w.items){if(ids.has(i.id))throw Error('duplicate work id');ids.add(i.id);
  if((i.state==='BLOCKED')!==!!i.blocker)throw Error('structured blocker required only for BLOCKED');
  if(terminal.has(i.state)&&i.nextAction.kind!=='NONE')throw Error('terminal work has no action');
  if(!terminal.has(i.state)&&i.nextAction.kind==='NONE')throw Error('current work requires explicit action');
  if(i.nextAction.kind==='AUTOMATIC'&&!i.nextAction.capability)throw Error('automatic action requires fixed read capability');
  if(i.nextAction.kind!=='AUTOMATIC'&&i.nextAction.capability)throw Error('human action cannot dispatch capability');
  if(['WFEKEY','OPERATOR'].includes(i.nextAction.kind)&&!i.nextAction.summary)throw Error('human action requires explicit summary');
  for(const key of ['currentRunId','acceptedRunId'])if(i.binding?.[key]&&!project.runs.some(r=>r.id===i.binding[key]))throw Error('work Run reference missing');
  if(i.binding?.acceptedRunId&&!project.runs.some(r=>r.id===i.binding.acceptedRunId&&r.status==='DONE'))throw Error('accepted Run must be DONE');
  if(i.state==='FROZEN'&&i.binding?.candidateSha)throw Error('frozen work cannot have development candidate');
 }
 for(const i of w.items)for(const ref of [i.parentWorkId,i.blocker?.dependencyWorkId,...(i.relatedWorkIds||[])].filter(Boolean))if(ref===i.id||!ids.has(ref))throw Error('invalid work dependency');
}
function validateWorkProjects(state){
 const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 if(!record(state)||!record(state.projects))throw Error('invalid canonical state');
 let count=0,self=0;
 for(const [key,p] of Object.entries(state.projects)){
  if(!record(p)||p.id!==key||typeof p.name!=='string'||!Array.isArray(p.runs))throw Error('invalid canonical project');
  for(const r of p.runs){
   if(!record(r)||typeof r.id!=='string'||typeof r.status!=='string'||(r.goal!==undefined&&typeof r.goal!=='string')||(r.steps!==undefined&&!Array.isArray(r.steps)))throw Error('invalid canonical run');
   for(const s of r.steps||[])if(!record(s)||typeof s.label!=='string'||typeof s.status!=='string')throw Error('invalid canonical step');
   if(Object.hasOwn(r,'verifier')&&r.verifier!==null&&(!record(r.verifier)||typeof r.verifier.pass!=='boolean'))throw Error('invalid canonical verifier');
  }
  validateWorkState(p);count+=p.workState?.items.length||0;if(p.workState?.managedSystem==='WFE')self++;
 }
 if(count>1000||self>1)throw Error('work state bounds exceeded');
}
const authority=()=>({runner:'UNAVAILABLE',node:'UNAVAILABLE',approval:'UNAVAILABLE',approvalAuthority:'WFEKey',granted:false});
const projectedSchema=object({projectId:id,item:itemSchema,authorities:object({runner:{const:'UNAVAILABLE'},node:{const:'UNAVAILABLE'},approval:{const:'UNAVAILABLE'},approvalAuthority:{const:'WFEKey'},granted:{const:false}})});
function currentWork(state){validateWorkProjects(state);const items=Object.values(state.projects).sort((a,b)=>a.id.localeCompare(b.id,'en')).flatMap(p=>(p.workState?.items||[]).slice().sort((a,b)=>a.id.localeCompare(b.id,'en')).map(item=>({projectId:p.id,item:structuredClone(item),authorities:authority()})));return {schemaVersion:'wfe.current.work.v1',items,unclassifiedProjects:Object.values(state.projects).filter(p=>!p.workState).map(p=>p.id).sort(),...Object.fromEntries(STATES.map(s=>[s.toLowerCase(),items.filter(x=>x.item.state===s)]))};}
function selfState(state){const p=Object.values(state.projects).find(p=>p.workState?.managedSystem==='WFE');return {availability:p?'RECORDED':'UNKNOWN',projectId:p?.id||null,acceptedMainSha:p?.workState.acceptedMainSha||null,work:p?currentWork(state).items.filter(x=>x.projectId===p.id):[],authorities:authority()};}
module.exports={STATES,workStateSchema,itemSchema,projectedSchema,validateWorkProjects,validateWorkState,currentWork,selfState,object,nullable,id};
