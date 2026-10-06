import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import catalogue from '../../../src/control-capabilities.js';
const manifest=JSON.parse(readFileSync(new URL('../../../plugins/wfe/mcp.json',import.meta.url)));
const endpoint=process.env.WFE_MCP_ENDPOINT??manifest.mcpServers['wfe-local'].url;
const client=new Client({name:'wfe-live-smoke',version:'0.1.0'});
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const pluginHashes=['plugin.json','mcp.json'].map(f=>hash(new URL('../../../plugins/wfe/'+f,import.meta.url)));
const stateBefore=await(await fetch('http://127.0.0.1:4317/api/state')).json();
assert.equal(stateBefore.active.length,0,'Smoke only against idle canonical operator');
const stateHashBefore=hash(new URL('../../../.wfe-next/state.json',import.meta.url));
try{
 await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
 const tools=(await client.listTools()).tools;
 const productCatalogue=(await import('../../../src/product-capabilities.js')).default;
 assert.deepEqual(tools.map(t=>t.name),productCatalogue.CONTROL_CAPABILITIES.map(c=>c.name));
 const results={};const latency=[];
 for(const tool of tools){
  if(tool._meta['wfe/capability'].access==='write'){results[tool.name]={invoked:false,reason:'Read-only smoke; writes verified by product-demo.mjs'};continue;}
  const projectId=Object.keys(stateBefore.projects).find(id=>stateBefore.projects[id].runs.length>0);
  const args=['wfe_run_get','wfe_work_status','wfe_acceptance_result','wfe_artifact_list','wfe_artifact_preview'].includes(tool.name)?{projectId,runId:stateBefore.projects[projectId].runs.at(-1).id}:['wfe_project_get','wfe_workbench_get','wfe_product_status'].includes(tool.name)?{projectId}:{};
  const t=performance.now(),result=await client.callTool({name:tool.name,arguments:args});
  results[tool.name]={available:result.structuredContent.available,error:result.structuredContent.error?.code??null,ms:Math.round((performance.now()-t)*10)/10};
  assert.equal(result.structuredContent.available,tool._meta['wfe/capability'].availability==='supported',tool.name);
 }
 for(let i=0;i<5;i++){const t=performance.now();assert.equal((await client.callTool({name:'wfe_status',arguments:{}})).structuredContent.available,true);latency.push(Math.round((performance.now()-t)*10)/10);}
 const stateAfter=await(await fetch('http://127.0.0.1:4317/api/state')).json();
 assert.equal(stateAfter.operator.pid,stateBefore.operator.pid);
 assert.equal(hash(new URL('../../../.wfe-next/state.json',import.meta.url)),stateHashBefore);
 assert.deepEqual(stateAfter.projects,stateBefore.projects);
 const system=(await client.callTool({name:'wfe_system_get',arguments:{}})).structuredContent;
 assert.equal(system.data.sourceIdentity.runtimeMatchesSourceAtAdapterStart,true);
 const report={result:'PASS',endpoint,operatorPid:stateBefore.operator.pid,operatorLoadedCode:stateBefore.operator.loadedCode,projects:Object.keys(stateBefore.projects).length,active:stateBefore.active.length,ready:Object.values(stateBefore.projectStatus).filter(x=>x.state==='READY').length,blocked:Object.values(stateBefore.projectStatus).filter(x=>x.state==='BLOCKED').length,tools:results,latencyMs:latency,pluginHashes,stateHashBefore,stateUnchanged:true,system:system.data};
 if(process.env.WFE_SMOKE_REPORT)writeFileSync(process.env.WFE_SMOKE_REPORT,JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
}finally{await client.close();}

