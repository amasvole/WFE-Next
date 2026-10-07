import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {ListToolsRequestSchema,CallToolRequestSchema,McpError,ErrorCode} from '@modelcontextprotocol/sdk/types.js';
import {AjvJsonSchemaValidator} from '@modelcontextprotocol/sdk/validation/ajv';
import capabilities from '../../../src/control-capabilities.js';
import productCapabilities from '../../../src/product-capabilities.js';
import productContract from '../../../src/product-contract.js';
import {buildStatusView,formatStatusText,operatorOrigin,unavailableStatus} from './status-view.mjs';
const {READ_CAPABILITIES,publicCapability,validateCanonicalState}=capabilities;
const validator=new AjvJsonSchemaValidator(), compiled=new WeakMap();
export function validate(value,schema){let check=compiled.get(schema);if(!check){check=validator.getValidator(schema);compiled.set(schema,check);}if(!check(value).valid)throw Error('Invalid schema value');}
export const INTEGRATION_CONTRACT='wfe.mcp.integration.v1';
export function sourceIdentity(){
 const root=fileURLToPath(new URL('../../../',import.meta.url));
 const files=['src/server.js','src/project-status.js','src/work-state.js','src/kernel.js','src/product-mutation.js','src/product-contract.js','src/product-control-http.js','src/provider.js','src/plan-output.js','src/workspace-files.js','src/browser-runtime.js','src/browser-procedure.js','scripts/browser-executor.js'];
 const loadedCode=createHash('sha256').update(files.map(f=>readFileSync(path.join(root,f))).join('')).digest('hex');
  const adapterLoadedCode=createHash('sha256').update(['src/control-capabilities.js','src/product-capabilities.js','src/product-contract.js','integrations/wfe-mcp/src/status-view.mjs','integrations/wfe-mcp/src/adapter.mjs','integrations/wfe-mcp/src/server.mjs'].map(f=>readFileSync(path.join(root,f))).join('')).digest('hex');
 const wfeVersion=JSON.parse(readFileSync(path.join(root,'package.json'),'utf8')).version;
 let sha=null,worktreeClean=null;
 try{sha=execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'-C',root,'rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore'],windowsHide:true}).trim();worktreeClean=execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'-C',root,'status','--porcelain','--untracked-files=normal'],{encoding:'utf8',stdio:['ignore','pipe','ignore'],windowsHide:true}).trim()==='';}catch{}
 return {sha,worktreeClean,wfeVersion,adapterLoadedCode,loadedCode,observedAt:new Date().toISOString(),scope:'WFE-Next disk source at adapter startup; SHA does not assert clean tree or remote equality'};
}
export function createAdapter({registry=productCapabilities.CONTROL_CAPABILITIES,origin=operatorOrigin(),fetchImpl=fetch,identity={sha:null,worktreeClean:null,wfeVersion:null,adapterLoadedCode:null,loadedCode:null,observedAt:null,scope:'unavailable'}}={}){
 origin=operatorOrigin(origin);
 const catalogue=registry.map(c=>Object.freeze({...c,inputSchema:structuredClone(c.inputSchema),outputSchema:structuredClone(c.outputSchema),approval:Object.freeze({...c.approval,granted:false})}));
 const names=new Set();
 const productWrite=c=>c.name==='wfe_product_create'&&c.access==='write'&&c.availability==='supported'&&c.handlerIdentity==='Kernel.createProduct -> POST /api/control/product-create';
 for(const c of catalogue){if(!/^wfe_[a-z0-9_]+$/.test(c.name)||names.has(c.name)||/shell|exec|powershell|cmd/.test(c.name))throw Error('invalid capability catalogue');names.add(c.name);if(!c.inputSchema||!c.outputSchema||!c.handlerIdentity||typeof c.handler!=='function'||!['read','write'].includes(c.access)||!['supported','unavailable'].includes(c.availability)||typeof c.approval.required!=='boolean')throw Error('invalid capability contract');if(c.access==='write'&&!productWrite(c)&&(!c.approval.required||c.approval.authority!=='WFEKey'))throw Error('write capability requires WFEKey');}
 const tools=catalogue.map(c=>({name:c.name,description:c.description,inputSchema:c.inputSchema,outputSchema:c.outputSchema,annotations:{readOnlyHint:c.access==='read',destructiveHint:c.access!=='read',idempotentHint:c.access==='read',openWorldHint:false},_meta:{'wfe/capability':publicCapability(c),'wfe/integrationContract':INTEGRATION_CONTRACT}}));
 async function readState(){
  let response;
  try{response=await fetchImpl(origin+'/api/state',{method:'GET',headers:{accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(2000)});}catch{throw Object.assign(Error('operator unavailable'),{code:'WFE_OPERATOR_UNAVAILABLE'});}
  if(!response.ok)throw Object.assign(Error('operator unavailable'),{code:'WFE_OPERATOR_UNAVAILABLE'});
  if(Number(response.headers?.get('content-length')||0)>8*1024*1024)throw Object.assign(Error('invalid state'),{code:'WFE_STATE_INVALID'});
  const chunks=[];let size=0;
  for await(const chunk of response.body){size+=chunk.length;if(size>8*1024*1024)throw Object.assign(Error('invalid state'),{code:'WFE_STATE_INVALID'});chunks.push(Buffer.from(chunk));}
  try{return validateCanonicalState(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{throw Object.assign(Error('invalid state'),{code:'WFE_STATE_INVALID'});}
 }
 function failure(c,observedAt,code){
  const message={WFE_OPERATOR_UNAVAILABLE:'Loopback WFE operator did not return canonical state.',WFE_STATE_INVALID:'Canonical state failed validation.',WFE_AUTHORITY_NOT_IMPLEMENTED:'No authoritative WFE-Next contract exists for this domain.',WFE_APPROVAL_REQUIRED:'Requirement metadata is not approval. This read-only adapter cannot execute mutations.',WFE_CAPABILITY_UNAVAILABLE:'This adapter cannot execute mutations.',WFE_NOT_FOUND:'Canonical Project or Run not found.'}[code]||'Capability failed safely.';
  const result=c.legacy?{...unavailableStatus(observedAt),error:{code,message}}:{schemaVersion:'wfe.control.v1',capability:c.name,available:false,observedAt,data:null,error:{code,message}};
  validate(result,c.outputSchema);
  return {isError:true,content:[{type:'text',text:JSON.stringify(result)}],structuredContent:result};
 }
 async function call(name,args={}){
  const c=catalogue.find(c=>c.name===name);
  if(!c)throw new McpError(ErrorCode.InvalidParams,'Unknown WFE capability');
  try{validate(args,c.inputSchema);}catch{throw new McpError(ErrorCode.InvalidParams,'Invalid capability arguments');}
  const observedAt=new Date().toISOString();
  if(productWrite(c)){
   try{
    // Fixed route and fixed contract. Never dispatch client-selected HTTP paths
    // or invoke the legacy /api/projects, /api/plan, /api/start mutations.
    validate(args,productContract.requestSchema);
    const response=await fetchImpl(origin+'/api/control/product-create',{method:'POST',headers:{accept:'application/json','content-type':'application/json'},body:JSON.stringify(args),redirect:'error',signal:AbortSignal.timeout(10000)});
    if(!response.ok)return failure(c,observedAt,'WFE_CONTROL_REJECTED');
    const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;if(size>32768)throw Error('oversized control result');chunks.push(Buffer.from(chunk));}
    const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));validate(data,productContract.resultSchema);
    if(data.receipt.requestId!==args.requestId||data.receipt.targetId!==args.projectId||data.receipt.baseSha!==args.baseSha)throw Error('control identity mismatch');
    const result={schemaVersion:'wfe.control.v1',capability:c.name,available:true,observedAt,data};validate(result,c.outputSchema);
    return {...(data.receipt.result==='REJECTED'?{isError:true}:{}),content:[{type:'text',text:JSON.stringify(result)}],structuredContent:result};
   }catch{return failure(c,observedAt,'WFE_CONTROL_UNAVAILABLE');}
  }
  if(c.approval.required)return failure(c,observedAt,'WFE_APPROVAL_REQUIRED');
  if(c.access!=='read')return failure(c,observedAt,'WFE_CAPABILITY_UNAVAILABLE');
  if(c.availability==='unavailable')return failure(c,observedAt,'WFE_AUTHORITY_NOT_IMPLEMENTED');
  try{
   const state=c.name==='wfe_capabilities_list'?null:await readState();
   const status=state?buildStatusView(state,observedAt):null;
   if(status)validate(status,capabilities.statusSchema);
   const data=await c.handler({state,status,registry:catalogue,identity},args);
   if(data===null)return failure(c,observedAt,'WFE_NOT_FOUND');
   const result=c.legacy?data:{schemaVersion:'wfe.control.v1',capability:c.name,available:true,observedAt,data};
   validate(result,c.outputSchema);
   return {content:[{type:'text',text:c.legacy?formatStatusText(result):JSON.stringify(result)}],structuredContent:result};
  }catch(e){return failure(c,observedAt,e.code==='WFE_OPERATOR_UNAVAILABLE'?'WFE_OPERATOR_UNAVAILABLE':e.code==='WFE_STATE_INVALID'||e instanceof SyntaxError?'WFE_STATE_INVALID':e.name==='TimeoutError'?'WFE_OPERATOR_UNAVAILABLE':'WFE_STATE_INVALID');}
 }
 function createMcpServer(){
  const server=new Server({name:'wfe',version:'0.1.0'},{capabilities:{tools:{}},instructions:'Discover WFE capabilities with tools/list. Contract wfe.mcp.integration.v1. product.create is the only supported mutation: creates an empty Project through canonical policy and durable receipts at exact clean SHA. Retry with identical requestId/arguments. Protected classification requires verified WFEKey. Approval required is never approval granted. No shell or WFEKey bypass. Other mutations remain unavailable.'});
  server.setRequestHandler(ListToolsRequestSchema,async()=>({tools}));
  server.setRequestHandler(CallToolRequestSchema,async req=>call(req.params.name,req.params.arguments??{}));
  return server;
 }
 return {tools,call,createMcpServer,origin};
}
export function createHttpAdapter(adapter){
 const hosts=new Set(['127.0.0.1','localhost','[::1]']);
 return createServer(async(req,res)=>{
  let url;try{url=new URL(req.url??'/', 'http://127.0.0.1');}catch{res.writeHead(400).end();return;}
  let host;try{host=new URL('http://'+req.headers.host).hostname;}catch{}
  if(!hosts.has(host)){res.writeHead(403).end('Invalid Host');return;}
  const origin=req.headers.origin;
  if(origin){let u;try{u=new URL(origin);}catch{}if(!u||!hosts.has(u.hostname)||u.protocol!=='http:'){res.writeHead(403).end('Invalid Origin');return;}res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','content-type,mcp-session-id,mcp-protocol-version');res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');}
  if(req.method==='OPTIONS'&&url.pathname==='/mcp'){res.writeHead(204).end();return;}
  if(req.method==='GET'&&url.pathname==='/'){res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify({service:'wfe-chatgpt-plugin',version:'0.1.0',transport:'streamable-http',mcpPath:'/mcp',operatorOrigin:adapter.origin,authority:'canonical product.create; other writes unavailable',integrationContract:INTEGRATION_CONTRACT,capabilities:adapter.tools.length,source:'WFE-Next/integrations/wfe-mcp'}));return;}
  if(url.pathname!=='/mcp'||!['POST','GET','DELETE'].includes(req.method)){res.writeHead(404).end();return;}
  const server=adapter.createMcpServer(),transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});
  res.on('close',()=>{transport.close().catch(()=>{});server.close().catch(()=>{});});
  try{await server.connect(transport);await transport.handleRequest(req,res);}catch{if(!res.headersSent)res.writeHead(500).end('Internal MCP error');}
 });
}




