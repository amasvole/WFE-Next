import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {createAdapter,createHttpAdapter} from '../src/adapter.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('product discovery over real MCP; mutation handlers and HTTP remain unreachable',async()=>{
 let requests=0;
 const adapter=createAdapter({fetchImpl:async()=>{requests++;throw Error('must not reach operator')}});
 const server=createHttpAdapter(adapter);server.listen(0,'127.0.0.1');await once(server,'listening');
 const client=new Client({name:'product-control-test',version:'1'});
 try{
  await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${server.address().port}/mcp`)));
  const tools=(await client.listTools()).tools;assert.equal(tools.length,21);
  for(const [name,args]of [
   ['wfe_product_open',{projectId:'tiny-app',runId:'r1'}],
   ['wfe_work_plan',{projectId:'tiny-app',goal:'Build a counter'}],
   ['wfe_work_start',{projectId:'tiny-app'}],
   ['wfe_acceptance_run',{projectId:'tiny-app',runId:'r1'}]]){
   const t=tools.find(t=>t.name===name);assert.equal(t.annotations.readOnlyHint,false);assert.equal(t._meta['wfe/capability'].availability,'unavailable');
   const r=await client.callTool({name,arguments:args});assert.equal(r.isError,true);assert.equal(r.structuredContent.error.code,'WFE_APPROVAL_REQUIRED');
  }
  const preview=await client.callTool({name:'wfe_artifact_preview',arguments:{projectId:'tiny-app',runId:'r1'}});
  assert.equal(preview.structuredContent.error.code,'WFE_AUTHORITY_NOT_IMPLEMENTED');assert.equal(requests,0);
  const discovery=await client.callTool({name:'wfe_capabilities_list',arguments:{}});assert.equal(discovery.structuredContent.data.capabilities.length,21);
  await assert.rejects(adapter.call('wfe_work_start',{projectId:'tiny-app',approved:true}),/Invalid capability arguments/);
  const hashes=['plugin.json','mcp.json'].map(f=>createHash('sha256').update(readFileSync(new URL('../../../plugins/wfe/'+f,import.meta.url))).digest('hex'));
  assert.deepEqual(hashes,['5697d7bfe8786c657434b2a4aa8cc54ba40b810b50b061b6ece555adf4719979','cdcd428d9d932ba8dca368f0f571d921167dfcfc5eb35ed6431b66318ee3adf2']);
 }finally{await client.close();await new Promise(r=>server.close(r));}
});
