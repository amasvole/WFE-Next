import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import kernelModule from '../../../src/kernel.js';
import httpModule from '../../../src/product-control-http.js';
import {createAdapter,createHttpAdapter} from '../src/adapter.mjs';
const SHA='a'.repeat(40),{Kernel}=kernelModule,{productControlHttp}=httpModule;
test('real MCP -> fixed HTTP control -> Kernel -> durable state; approved/denied/replay/stale/reload',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'wfe-mcp-create-')),requests=[];
 const options={root,provider:{},productAuthority:{sourceIdentity:()=>({sha:SHA,clean:true})}};
 let kernel=new Kernel(options);
 const operator=createServer(async(q,r)=>{requests.push({method:q.method,url:q.url});if(!await productControlHttp(q,r,kernel))r.writeHead(404).end();});operator.listen(0,'127.0.0.1');await once(operator,'listening');
 const adapter=createAdapter({origin:`http://127.0.0.1:${operator.address().port}`});
 const server=createHttpAdapter(adapter);server.listen(0,'127.0.0.1');await once(server,'listening');
 const client=new Client({name:'product-create-wire-test',version:'1'});
 const input={requestId:'counter-1',projectId:'counter',name:'Counter',baseSha:SHA};
 const call=args=>client.callTool({name:'wfe_product_create',arguments:args});
 try{
  await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${server.address().port}/mcp`)));
  const tool=(await client.listTools()).tools.find(t=>t.name==='wfe_product_create');assert.equal(tool.annotations.readOnlyHint,false);assert.equal(tool._meta['wfe/capability'].availability,'supported');
  const r=await call(input);assert.equal(r.structuredContent.data.receipt.result,'PASS');assert.equal(r.structuredContent.data.receipt.policy.approvalRequired,false);assert.equal(kernel.state.projects.counter.name,'Counter');
  const replay=await call(input);assert.equal(replay.structuredContent.data.deduplicated,true);assert.deepEqual(replay.structuredContent.data.receipt,r.structuredContent.data.receipt);
  const protectedInput={...input,requestId:'protected',projectId:'protected',protection:'WARN_BEFORE_MUTATION'};
  const denied=await call(protectedInput);assert.equal(denied.isError,true);assert.equal(denied.structuredContent.data.receipt.code,'APPROVAL_REQUIRED');assert.equal(kernel.state.projects.protected,undefined);
  assert.equal((await call({...protectedInput,requestId:'invalid',approvalId:'invalid'})).structuredContent.data.receipt.code,'APPROVAL_AUTHORITY_UNAVAILABLE');
  const stale=await call({...input,requestId:'stale',projectId:'stale',baseSha:'b'.repeat(40)});assert.equal(stale.isError,true);assert.equal(stale.structuredContent.data.receipt.code,'STALE_SHA');assert.equal(kernel.state.projects.stale,undefined);
  // A trusted authenticated bridge is a test double here, not live WFEKey.
  let approvals=0;options.productAuthority.approvalAuthority={verify:({approvalId,request,requestDigest})=>{approvals++;return {authority:'WFEKey',verified:true,approvalId,requestDigest,action:'product.create',targetId:request.target.projectId,baseSha:SHA,expiresAt:'2099-01-01T00:00:00Z'};}};
  kernel=new Kernel(options);
  const approved={...protectedInput,requestId:'approved',approvalId:'key-decision-1'};
  const result=await call(approved);assert.equal(result.structuredContent.data.receipt.result,'PASS');assert.equal(approvals,1);
  kernel=new Kernel(options);assert.equal((await call(approved)).structuredContent.data.deduplicated,true);assert.equal(approvals,1);
  assert.equal((await call({...approved,requestId:'reuse',projectId:'reuse'})).structuredContent.data.receipt.code,'APPROVAL_REPLAY');assert.equal(approvals,1);
  assert.equal(Object.keys(kernel.state.projects).length,2);assert.deepEqual(kernel.state.productControl.receipts['counter-1'],r.structuredContent.data.receipt);
  assert.ok(requests.every(x=>x.method==='POST'&&x.url==='/api/control/product-create'));
  const count=requests.length;await assert.rejects(call({...input,approved:true}));assert.equal(requests.length,count);
  const badHost=await fetch(`http://127.0.0.1:${operator.address().port}/api/control/product-create`,{method:'POST',headers:{origin:'https://evil.invalid'},body:JSON.stringify({...input,requestId:'origin'})});assert.equal(badHost.status,403);assert.equal(kernel.state.productControl.receipts.origin,undefined);
 }finally{await client.close();await new Promise(r=>server.close(r));await new Promise(r=>operator.close(r));fs.rmSync(root,{recursive:true,force:true});}
});
