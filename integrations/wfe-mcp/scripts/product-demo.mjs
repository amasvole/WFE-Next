// Real persistent ChatGPT-facing MCP -> canonical operator -> kernel -> state.
// Does not plan, build, start, open, or invoke any legacy HTTP mutation.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {sourceIdentity} from '../src/adapter.mjs';
const manifest=JSON.parse(readFileSync(new URL('../../../plugins/wfe/mcp.json',import.meta.url)));
const endpoint=manifest.mcpServers['wfe-local'].url,identity=sourceIdentity();
assert.equal(identity.worktreeClean,true,'Demo requires clean committed candidate');
const input={requestId:'counter-create-'+identity.sha,projectId:'mcp-counter-'+identity.sha.slice(0,12),name:'MCP Counter Demo',baseSha:identity.sha};
const file=process.argv[2],phase=process.argv[3]??'create';assert.ok(['create','restart'].includes(phase));
const client=new Client({name:'product-create-live-demo',version:'1'});
const stateFile=new URL('../../../.wfe-next/state.json',import.meta.url),disk=()=>JSON.parse(readFileSync(stateFile));
const before=disk(),state=await(await fetch('http://127.0.0.1:4317/api/state')).json();assert.equal(state.active.length,0);assert.equal(state.operator.root.replaceAll('\\','/'),'F:/WFE-Next');
try{
 await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
 const tool=(await client.listTools()).tools.find(t=>t.name==='wfe_product_create');assert.equal(tool._meta['wfe/capability'].availability,'supported');
 const create=await client.callTool({name:'wfe_product_create',arguments:input});assert.equal(create.structuredContent.data.receipt.result,'PASS');
 const replay=await client.callTool({name:'wfe_product_create',arguments:input});assert.equal(replay.structuredContent.data.deduplicated,true);assert.deepEqual(replay.structuredContent.data.receipt,create.structuredContent.data.receipt);
 const staleInput={...input,requestId:'counter-stale-'+identity.sha,projectId:'counter-stale-'+identity.sha.slice(0,12),baseSha:'0'.repeat(40)};
 const stale=await client.callTool({name:'wfe_product_create',arguments:staleInput});assert.equal(stale.isError,true);assert.equal(stale.structuredContent.data.receipt.code,'STALE_SHA');
 const protectedInput={...input,requestId:'counter-protected-'+identity.sha,projectId:'counter-protected-'+identity.sha.slice(0,12),protection:'WARN_BEFORE_MUTATION'};
 const protectedDenied=await client.callTool({name:'wfe_product_create',arguments:protectedInput});assert.equal(protectedDenied.isError,true);assert.equal(protectedDenied.structuredContent.data.receipt.code,'APPROVAL_REQUIRED');
 const status=await client.callTool({name:'wfe_product_status',arguments:{projectId:input.projectId}});assert.equal(status.structuredContent.data.id,input.projectId);assert.equal(status.structuredContent.data.runs,0);
 const after=disk(),receipt=create.structuredContent.data.receipt;
 assert.deepEqual(after.productControl.receipts[input.requestId],receipt);assert.equal(after.projects[input.projectId].creationReceiptId,receipt.receiptId);
 assert.equal(Object.values(after.projects).filter(p=>p.id===input.projectId).length,1);assert.equal(after.projects[staleInput.projectId],undefined);assert.equal(after.projects[protectedInput.projectId],undefined);
 for(const [id,p]of Object.entries(before.projects))assert.deepEqual(after.projects[id],p,'Existing Project changed');
 const prior=phase==='restart'?JSON.parse(readFileSync(file,'utf8')):null;
 if(prior){assert.notEqual(prior.operatorPid,state.operator.pid);assert.deepEqual(prior.receipt,receipt);assert.equal(create.structuredContent.data.deduplicated,true);}
 const report={result:'PASS',phase,observedAt:new Date().toISOString(),candidateSha:identity.sha,endpoint,operatorPid:state.operator.pid,previousOperatorPid:prior?.operatorPid??null,request:input,receipt,receiptLocation:'.wfe-next/state.json -> productControl.receipts['+input.requestId+']',createdExactlyOnce:true,applicationBuilt:false,replayDeduplicated:true,staleShaRejected:true,missingRequiredApprovalRejected:true,existingProjectsUnchanged:true,receiptSurvivesRestart:phase==='restart',pluginHashes:['plugin.json','mcp.json'].map(f=>createHash('sha256').update(readFileSync(new URL('../../../plugins/wfe/'+f,import.meta.url))).digest('hex')),wireResults:{create,replay,stale,protectedDenied,status}};
 if(file)writeFileSync(file,JSON.stringify(report,null,2));console.log(JSON.stringify({result:report.result,phase,sha:identity.sha,projectId:input.projectId,receiptId:receipt.receiptId,operatorPid:state.operator.pid,replayDeduplicated:true}));
}finally{await client.close();}
