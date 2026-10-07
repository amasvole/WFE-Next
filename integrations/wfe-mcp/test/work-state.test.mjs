import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {createAdapter,validate} from '../src/adapter.mjs';
const require=createRequire(import.meta.url),{projectStatus}=require('../../../src/project-status.js');
const example=require('../../../docs/examples/wfe-self-project.json');
const {validateCanonicalState}=require('../../../src/control-capabilities.js');
function state(){const projects={'wfe-self':structuredClone(example)};return {projects,operator:{pid:42,startedAt:'2026-10-07T00:00:00Z',loadedCode:'test'},active:[],opened:{},projectStatus:Object.fromEntries(Object.values(projects).map(p=>[p.id,projectStatus(p)]))};}
test('MCP rejects invalid verifier values before projection while absent/null/boolean-pass objects remain valid',async()=>{
 for(const fields of [{},{verifier:null},{verifier:{pass:true}},{verifier:{pass:false}}]){
  const s=state();s.projects['wfe-self'].runs=[{id:'r',status:'DONE',...fields}];s.projectStatus['wfe-self']=projectStatus(s.projects['wfe-self']);
  assert.equal(validateCanonicalState(s),s);
  const adapter=createAdapter({fetchImpl:async()=>new Response(JSON.stringify(s))});
  const result=await adapter.call('wfe_run_get',{projectId:'wfe-self',runId:'r'});assert.equal(result.structuredContent.available,true);assert.deepEqual(result.structuredContent.data.verifier,fields.verifier?{pass:fields.verifier.pass,at:null}:null);
 }
 for(const verifier of [false,0,'',[],{}, {pass:0},{pass:'true'},'invalid',1]){
  const s=state();s.projects['wfe-self'].runs=[{id:'r',status:'DONE',verifier}];s.projectStatus['wfe-self']=projectStatus(s.projects['wfe-self']);const before=JSON.stringify(s);
  assert.throws(()=>validateCanonicalState(s),/invalid canonical verifier/);
  const adapter=createAdapter({fetchImpl:async()=>new Response(JSON.stringify(s))});
  const result=await adapter.call('wfe_run_get',{projectId:'wfe-self',runId:'r'});assert.equal(result.structuredContent.error.code,'WFE_STATE_INVALID');assert.equal(result.structuredContent.data,null);assert.equal(JSON.stringify(s),before);
 }
});
test('new dynamic capabilities validate canonical output with plugin unchanged and no writes',async()=>{
 const s=state(),before=JSON.stringify(s),paths=['plugin.json','mcp.json'].map(f=>new URL('../../../plugins/wfe/'+f,import.meta.url)),plugin=paths.map(p=>readFileSync(p,'utf8'));let reads=0;
 const adapter=createAdapter({fetchImpl:async(url,options)=>{assert.equal(options.method,'GET');assert.ok(url.endsWith('/api/state'));reads++;return new Response(JSON.stringify(s));}});
 for(const name of ['wfe_current_work_get','wfe_work_item_get','wfe_next_actions_get','wfe_self_state_get']){const tool=adapter.tools.find(t=>t.name===name);assert.ok(tool);assert.equal(tool.annotations.readOnlyHint,true);const r=await adapter.call(name,name==='wfe_work_item_get'?{projectId:'wfe-self',workId:'victus-startup'}:{});assert.equal(r.structuredContent.available,true);validate(r.structuredContent,tool.outputSchema);}
 assert.equal(reads,4);assert.equal(JSON.stringify(s),before);assert.deepEqual(paths.map(p=>readFileSync(p,'utf8')),plugin);
 const next=(await adapter.call('wfe_next_actions_get')).structuredContent.data.actions;assert.equal(next.length,2);assert.ok(next.every(x=>!['FROZEN','HISTORICAL'].includes(x.item.state)));
});
test('bad work state fails closed; old state remains readable and self identity unknown',async()=>{
 const s=state();delete s.projects['wfe-self'].workState.items[1].blocker;
 const bad=createAdapter({fetchImpl:async()=>new Response(JSON.stringify(s))});assert.equal((await bad.call('wfe_current_work_get')).structuredContent.error.code,'WFE_STATE_INVALID');
 delete s.projects['wfe-self'].workState;
 const legacy=createAdapter({fetchImpl:async()=>new Response(JSON.stringify(s))});assert.equal((await legacy.call('wfe_self_state_get')).structuredContent.data.availability,'UNKNOWN');assert.deepEqual((await legacy.call('wfe_current_work_get')).structuredContent.data.unclassifiedProjects,['wfe-self']);
});
