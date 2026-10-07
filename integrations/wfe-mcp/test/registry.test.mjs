import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import {request} from 'node:http';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {createAdapter as createControlAdapter,createHttpAdapter,INTEGRATION_CONTRACT,validate} from '../src/adapter.mjs';
import catalogue from '../../../src/control-capabilities.js';
import projection from '../../../src/project-status.js';
const {READ_CAPABILITIES}=catalogue;
const createAdapter=(options={})=>createControlAdapter({registry:READ_CAPABILITIES,...options});
const state={
 operator:{pid:42,loadedCode:'fingerprint',startedAt:'2026-10-06T10:00:00Z',root:'SECRET_ROOT'},
 projects:{
  ready:{id:'ready',name:'Ready user project',metadata:{lifecycle:'ACTIVE',purpose:'USER_PROJECT',protection:'NORMAL'},pendingGoal:'New goal',preparedPlan:{goal:'New goal',plan:{}},runs:[]},
  history:{id:'history',name:'Historical fixture',metadata:{lifecycle:'INACTIVE',purpose:'ACCEPTANCE_FIXTURE',protection:'WARN_BEFORE_MUTATION'},runs:[{id:'r-blocked',goal:'Goal',status:'BLOCKED',steps:[]},{id:'r-done',goal:'Goal',status:'DONE',steps:[{label:'VERIFYING',status:'DONE'}],verifier:{pass:true},workspace:'SECRET_WORKSPACE',diagnostics:['SECRET_DIAGNOSTIC'],runtime:{start:{command:'powershell'}}}]}
 },active:[],opened:{}
};
state.projectStatus=Object.fromEntries(Object.values(state.projects).map(p=>[p.id,projection.projectStatus(p,[])]));
const fetchState=async()=>new Response(JSON.stringify(state),{headers:{'content-type':'application/json'}});
const files=['plugin.json','mcp.json'].map(f=>new URL('../../../plugins/wfe/'+f,import.meta.url));
const pluginDigest=()=>files.map(f=>createHash('sha256').update(readFileSync(f)).digest('hex'));
const pluginBaseline=['5697d7bfe8786c657434b2a4aa8cc54ba40b810b50b061b6ece555adf4719979','cdcd428d9d932ba8dca368f0f571d921167dfcfc5eb35ed6431b66318ee3adf2'];
async function endpoint(adapter,action){
 const server=createHttpAdapter(adapter);server.listen(0,'127.0.0.1');await once(server,'listening');
 const client=new Client({name:'wfe-registry-test',version:'1.0.0'});
 try{await client.connect(new StreamableHTTPClientTransport(new URL('http://127.0.0.1:'+server.address().port+'/mcp')));return await action(client,server);}
 finally{await client.close();await new Promise(resolve=>server.close(resolve));}
}
test('real MCP discovery equals current registry and exposes deterministic output contracts',async()=>{
 const adapter=createAdapter({fetchImpl:fetchState});
 await endpoint(adapter,async client=>{
  const tools=(await client.listTools()).tools;
  assert.deepEqual(tools.map(t=>t.name),READ_CAPABILITIES.map(t=>t.name));
  assert.equal(JSON.stringify(tools),JSON.stringify((await client.listTools()).tools));
  for(const t of tools){assert.equal(t.annotations.readOnlyHint,true);assert.equal(t._meta['wfe/capability'].approval.granted,false);assert.ok(t.outputSchema);}
  const result=await client.callTool({name:'wfe_capabilities_list',arguments:{}});
  assert.equal(result.structuredContent.data.integrationContract,INTEGRATION_CONTRACT);
  assert.deepEqual(result.structuredContent.data.capabilities.map(c=>c.name),tools.map(t=>t.name));
 });
});
test('server-only addition is discoverable and callable with plugin bytes and integration metadata unchanged',async()=>{
 const base=createAdapter({fetchImpl:fetchState});
 const extra={...READ_CAPABILITIES.find(c=>c.name==='wfe_project_get'),name:'wfe_test_observation',handlerIdentity:'test-only projection'};
 const expanded=createAdapter({registry:[...READ_CAPABILITIES,extra],fetchImpl:fetchState});
 assert.deepEqual(pluginDigest(),pluginBaseline);
 assert.deepEqual(expanded.tools.slice(0,-1),base.tools);
 let baseVersion,baseInstructions;
 await endpoint(base,async client=>{baseVersion=client.getServerVersion();baseInstructions=client.getInstructions();assert.equal((await client.listTools()).tools.some(t=>t.name===extra.name),false);});
 await endpoint(expanded,async client=>{
  assert.deepEqual(client.getServerVersion(),baseVersion);assert.equal(client.getInstructions(),baseInstructions);
  assert.ok((await client.listTools()).tools.find(t=>t.name===extra.name));
  const result=await client.callTool({name:extra.name,arguments:{projectId:'ready'}});
  assert.equal(result.structuredContent.available,true);assert.equal(result.structuredContent.data.id,'ready');
 });
 assert.deepEqual(pluginDigest(),pluginBaseline);
});
test('wfe_status remains compatible and READY zero-Run / history / provenance stay distinct',async()=>{
 const adapter=createAdapter({fetchImpl:fetchState});
 const result=await adapter.call('wfe_status');
 assert.equal(result.structuredContent.schemaVersion,'wfe.status.v0');
 assert.equal(result.structuredContent.available,true);
 assert.equal(result.structuredContent.ready[0].runs,0);
 assert.equal(result.structuredContent.ready[0].currentRun,null);
 assert.match(result.content[0].text,/READY/);
 const work=(await adapter.call('wfe_work_get')).structuredContent.data;
 assert.equal(work.userProjects[0].id,'ready');assert.equal(work.historical[0].id,'history');assert.equal(work.developmentClassificationAvailable,false);
 const bench=(await adapter.call('wfe_workbench_get',{projectId:'history',limit:1})).structuredContent.data;
 assert.equal(bench.history.length,1);assert.equal(bench.historyTotal,2);assert.equal(bench.historyTruncated,true);assert.equal(bench.acceptedResult,'r-done');
 const blockers=(await adapter.call('wfe_blockers_get')).structuredContent.data;
 assert.equal(blockers.current.length,0);assert.equal(blockers.historical[0].runId,'r-blocked');
});
test('unavailable operator and malformed canonical states have structured safe failures',async()=>{
 for(const fetchImpl of [async()=>{throw new TypeError('network failure secret')},async()=>new Response('',{status:503})]){
  const adapter=createAdapter({fetchImpl});
  for(const name of ['wfe_status','wfe_projects_list']){const result=await adapter.call(name);assert.equal(result.structuredContent.available,false);assert.equal(result.structuredContent.error.code,'WFE_OPERATOR_UNAVAILABLE');assert.equal(result.isError,true);}
  assert.equal((await adapter.call('wfe_capabilities_list')).structuredContent.available,true);
 }
 const malformed=[{},[],{...state,projects:[]},{...state,active:['missing']},{...state,projectStatus:{}},{...state,projects:{bad:{id:'bad',name:'Bad',runs:'bad'}}}];
 for(const data of malformed){
  const adapter=createAdapter({fetchImpl:async()=>new Response(JSON.stringify(data))});
  const result=await adapter.call('wfe_status');assert.equal(result.structuredContent.available,false);assert.equal(result.structuredContent.error.code,'WFE_STATE_INVALID');
 }
 const adapter=createAdapter({fetchImpl:async()=>new Response('not-json-secret')});
 assert.equal((await adapter.call('wfe_status')).structuredContent.error.code,'WFE_STATE_INVALID');
});
test('all read-only tools use one GET snapshot at most and cannot mutate the canonical source',async()=>{
 const before=JSON.stringify(state),requests=[];
 const adapter=createAdapter({fetchImpl:async(url,options)=>{requests.push([url,options.method,options.redirect]);return fetchState();}});
 for(const c of READ_CAPABILITIES){
  const args=c.name==='wfe_run_get'?{projectId:'history',runId:'r-done'}:['wfe_project_get','wfe_workbench_get'].includes(c.name)?{projectId:'history'}:{};
  const count=requests.length,result=await adapter.call(c.name,args);
  assert.equal(result.isError,c.availability==='unavailable'?true:undefined,c.name);
  assert.ok(requests.length-count<=1);
  assert.equal(JSON.stringify(result).includes('SECRET_'),false);
 }
 assert.equal(JSON.stringify(state),before);
 assert.ok(requests.every(([url,method,redirect])=>url==='http://127.0.0.1:4317/api/state'&&method==='GET'&&redirect==='error'));
 await assert.rejects(adapter.call('wfe_project_get',{projectId:'history',command:'whoami'}),/Invalid capability arguments/);
 await assert.rejects(adapter.call('wfe_project_get',{projectId:'../history'}),/Invalid capability arguments/);
 assert.equal((await adapter.call('wfe_project_get',{projectId:'missing'})).structuredContent.error.code,'WFE_NOT_FOUND');
});
test('no generic shell, passthrough or bypass is discoverable or callable',async()=>{
 const adapter=createAdapter({fetchImpl:fetchState});
 assert.ok(adapter.tools.every(t=>!/(shell|exec|powershell|cmd)/.test(t.name)));
 for(const name of ['shell.exec','wfe_shell','wfe_exec','powershell','cmd'])await assert.rejects(adapter.call(name,{command:'whoami'}),/Unknown WFE capability/);
 assert.throws(()=>createAdapter({registry:[{...READ_CAPABILITIES[1],name:'wfe_shell'}]}),/invalid capability catalogue/);
});
test('approval-required metadata cannot grant approval; handler and network remain unreachable',async()=>{
 let calls=0;
 const future={...READ_CAPABILITIES[1],name:'wfe_future_write',access:'write',safetyClass:'privileged-mutation',approval:{required:true,authority:'WFEKey',granted:true},handler:()=>{calls++;throw Error('must never execute')}};
 const adapter=createAdapter({registry:[future],fetchImpl:async()=>{calls++;throw Error('must never fetch')}});
 assert.equal(adapter.tools[0]._meta['wfe/capability'].approval.required,true);
 assert.equal(adapter.tools[0]._meta['wfe/capability'].approval.granted,false);
 assert.equal((await adapter.call(future.name)).structuredContent.error.code,'WFE_APPROVAL_REQUIRED');
 await assert.rejects(adapter.call(future.name,{approved:true}),/Invalid capability arguments/);
 assert.equal(calls,0);
 assert.throws(()=>createAdapter({registry:[{...future,approval:{required:false,authority:null}}]}),/requires WFEKey/);
});
test('schemas validate every result and reject wrong types / unknown inputs deterministically',async()=>{
 const adapter=createAdapter({fetchImpl:fetchState});
 for(const c of READ_CAPABILITIES){assert.deepEqual(createAdapter({fetchImpl:fetchState}).tools.find(t=>t.name===c.name).inputSchema,c.inputSchema);}
 const result=await adapter.call('wfe_status');validate(result.structuredContent,READ_CAPABILITIES[0].outputSchema);
 assert.throws(()=>validate({...result.structuredContent,available:'yes'},READ_CAPABILITIES[0].outputSchema));
 await assert.rejects(adapter.call('wfe_workbench_get',{projectId:'ready',limit:101}),/Invalid capability arguments/);
 await assert.rejects(adapter.call('wfe_workbench_get',{projectId:'ready',limit:1.5}),/Invalid capability arguments/);
});
test('loopback boundary rejects redirects, external origins and DNS rebinding hosts',async()=>{
 assert.throws(()=>createAdapter({origin:'http://example.com'}),/loopback/);
 await endpoint(createAdapter({fetchImpl:fetchState}),async(client,server)=>{
  const url='http://127.0.0.1:'+server.address().port+'/mcp';
  assert.equal((await fetch(url,{method:'POST',headers:{Origin:'https://attacker.example'}})).status,403);
  const status=await new Promise((resolve,reject)=>{const req=request(url,{method:'POST',headers:{Host:'attacker.example'}},res=>{res.resume();resolve(res.statusCode)});req.on('error',reject);req.end();});
  assert.equal(status,403);
 });
});



