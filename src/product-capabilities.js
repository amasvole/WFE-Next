// Only empty product creation has canonical mutation authority. All execution
// operations remain unavailable.
const {READ_CAPABILITIES}=require('./control-capabilities');
const {requestSchema,resultSchema}=require('./product-contract');
const object=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
const id={type:'string',minLength:1,maxLength:160,pattern:'^[A-Za-z0-9][A-Za-z0-9._-]*$'};
const pair=object({projectId:id,runId:id});
const envelope=data=>object({schemaVersion:{const:'wfe.control.v1'},capability:{type:'string'},available:{type:'boolean'},observedAt:{type:'string'},data:{anyOf:[data,{type:'null'}]},error:object({code:{type:'string'},message:{type:'string'}})},['schemaVersion','capability','available','observedAt','data']);
function alias(name,source,description){return {...READ_CAPABILITIES.find(c=>c.name===source),name,description};}
function blocked(name,inputSchema,description){return {name,description,inputSchema,outputSchema:envelope(object({})),access:'write',safetyClass:'authority-required',availability:'unavailable',approval:{required:true,authority:'WFEKey',granted:false},handlerIdentity:'unavailable: canonical policy/broker/WFEKey/exact-SHA/receipt contract absent',handler:()=>null};}
const run=(ctx,a)=>ctx.state.projects[a.projectId]?.runs.find(r=>r.id===a.runId);
const acceptanceSchema=object({projectId:id,runId:id,status:{type:'string'},accepted:{type:'boolean'},verifierPass:{anyOf:[{type:'boolean'},{type:'null'}]},provenance:{const:'canonical historical evidence; no fresh acceptance or SHA attestation'}});
const artifactSchema=object({projectId:id,runId:id,accepted:{type:'boolean'},artifacts:{type:'array',items:object({name:{type:'string'}})},provenance:{const:'recorded names only; existence and integrity not verified'}});
function read(name,inputSchema,dataSchema,handler,description){return {name,description,inputSchema,outputSchema:envelope(dataSchema),handler,handlerIdentity:'GET /api/state -> Project.runs[runId]',access:'read',safetyClass:'read-only-observation',availability:'supported',approval:{required:false,authority:null,granted:false}};}
const PRODUCT_CAPABILITIES=[
 {name:'wfe_product_create',description:'Create one empty canonical product at exact clean source SHA. NORMAL requires no approval; protected classification requires verified WFEKey. Use a stable requestId for retries. Returns a durable policy/receipt result; no build or execution.',inputSchema:requestSchema,outputSchema:envelope(resultSchema),access:'write',safetyClass:'empty-product-create',availability:'supported',approval:{required:false,authority:null,granted:false},handlerIdentity:'Kernel.createProduct -> POST /api/control/product-create',handler:()=>{throw Error('canonical control route required');}},
 blocked('wfe_product_open',object({projectId:id,runId:id}),'Launch accepted product preview. BLOCKED: process launch requires canonical authority.'),
 alias('wfe_product_status','wfe_project_get','Observe canonical product status; product maps to Project.'),
 blocked('wfe_work_plan',object({projectId:id,goal:{type:'string',minLength:1,maxLength:8000}}),'Persist a product plan. BLOCKED: authoritative mutation contract absent.'),
 blocked('wfe_work_start',object({projectId:id}),'Start the reviewed plan through canonical execution authority. BLOCKED: contract absent.'),
 alias('wfe_work_status','wfe_run_get','Observe a canonical Run; DONE is recorded history, not a fresh attestation.'),
 blocked('wfe_acceptance_run',pair,'Run independent acceptance. BLOCKED: execution authority absent.'),
 read('wfe_acceptance_result',pair,acceptanceSchema,(ctx,a)=>{const r=run(ctx,a);return r?{...a,status:r.status,accepted:r.status==='DONE'&&r.verifier?.pass===true,verifierPass:r.verifier?.pass??null,provenance:'canonical historical evidence; no fresh acceptance or SHA attestation'}:null;},'Read recorded acceptance result without rerunning tests.'),
 read('wfe_artifact_list',pair,artifactSchema,(ctx,a)=>{const r=run(ctx,a);return r?{...a,accepted:r.status==='DONE'&&r.verifier?.pass===true,artifacts:(r.artifacts||[]).filter(n=>typeof n==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/.test(n)).map(name=>({name})),provenance:'recorded names only; existence and integrity not verified'}:null;},'List safe recorded artifact names; no filesystem or integrity claim.'),
 // Preview requires run-bound ownership and freshness evidence. opened[] only
 // identifies the Project, so it cannot safely attest a requested Run preview.
 {...blocked('wfe_artifact_preview',pair,'Preview unavailable: no run-bound preview ownership/freshness contract.'),access:'read',safetyClass:'read-only-observation',approval:{required:false,authority:null,granted:false}}
];
module.exports={PRODUCT_CAPABILITIES,CONTROL_CAPABILITIES:[...READ_CAPABILITIES,...PRODUCT_CAPABILITIES]};
