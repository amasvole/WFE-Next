'use strict';
const fs=require('fs'),path=require('path');
const LIMITS=Object.freeze({files:1000,entries:3000,directory:500,bytes:256*1024,totalBytes:8*1024*1024,results:100,ms:250,depth:24});
const TEXT=new Set('txt md json js ts html css java py yaml yml xml cjs mjs jsx tsx csv svg'.split(' '));
const inside=(a,b)=>b===a||b.startsWith(a+path.sep);
function authority(kernel,id){
 if(typeof id!=='string'||!Object.hasOwn(kernel.state.projects,id))throw Error('unknown project');
 const p=kernel.state.projects[id],run=p.runs.filter(r=>r.status==='DONE'&&r.workspace).at(-1);if(!run)throw Error('accepted workspace unavailable');
 const root=path.resolve(run.workspace),base=path.resolve(kernel.base,'workspaces');
 if(!inside(base,root))throw Error('workspace outside authority');
 let cursor=base;for(const part of path.relative(base,root).split(path.sep).filter(Boolean)){cursor=path.join(cursor,part);if(fs.lstatSync(cursor).isSymbolicLink())throw Error('linked workspace denied');}
 if(fs.lstatSync(base).isSymbolicLink()||!inside(fs.realpathSync(base),fs.realpathSync(root)))throw Error('workspace outside authority');
 return {root,run,p};
}
function resolveFile(a,relative){
 if(typeof relative!=='string'||path.isAbsolute(relative)||/[\\:%\x00-\x1f]/.test(relative)||relative.split('/').some(x=>x==='..'||x.startsWith('.')||x==='node_modules'||/[. ]$/.test(x)))throw Error('path denied');
 const target=path.resolve(a.root,relative);if(!inside(a.root,target))throw Error('path denied');
 let cursor=a.root;for(const part of relative.split('/').filter(Boolean)){cursor=path.join(cursor,part);if(fs.lstatSync(cursor).isSymbolicLink())throw Error('linked path denied');}
 if(!inside(fs.realpathSync(a.root),fs.realpathSync(target)))throw Error('path denied');return target;
}
function info(a,relative){return {runId:a.run.id,workspace:a.root,rootLabel:'Accepted Workspace',path:relative,currentAccepted:true,artifact:(a.run.artifacts||[]).includes(relative),shared:a.p.runs.filter(r=>r.workspace===a.run.workspace).length>1};}
function preview(target,stat){
 const type=path.extname(target).slice(1).toLowerCase()||'unknown',out={kind:'file',size:stat.size,type};
 if(stat.size>LIMITS.bytes)return {...out,previewUnavailable:'File exceeds 256 KB preview limit'};
 // Read through a capped descriptor even if a file grows after stat.
 const fd=fs.openSync(target,'r'),buffer=Buffer.alloc(LIMITS.bytes+1);let n;try{n=fs.readSync(fd,buffer,0,buffer.length,0)}finally{fs.closeSync(fd)}
 if(n>LIMITS.bytes)return {...out,previewUnavailable:'File exceeds 256 KB preview limit'};
 const bytes=buffer.subarray(0,n);if(bytes.includes(0))return {...out,previewUnavailable:'Binary file'};
 if(!TEXT.has(type))return {...out,previewUnavailable:'Unsupported file type'};
 try{return {...out,text:new TextDecoder('utf-8',{fatal:true}).decode(bytes)}}catch{return {...out,previewUnavailable:'Binary or unsupported text encoding'}}
}
function entries(target){const list=[];let count=0,truncated=false;const d=fs.opendirSync(target);try{let e;while((e=d.readSync())){if(++count>LIMITS.directory){truncated=true;break}if(!e.name.startsWith('.')&&e.name!=='node_modules'&&!e.isSymbolicLink()&&(e.isDirectory()||e.isFile()))list.push(e)}}finally{d.closeSync()}return {list,truncated};}
function workspaceFiles(kernel,id,relative=''){
 const a=authority(kernel,id),target=resolveFile(a,relative),stat=fs.statSync(target),meta=info(a,relative);
 if(stat.isDirectory()){const {list,truncated}=entries(target);return {...meta,kind:'directory',truncated,entries:list.map(e=>({name:e.name,kind:e.isDirectory()?'directory':'file',artifact:(a.run.artifacts||[]).includes(relative?relative+'/'+e.name:e.name)})).sort((a,b)=>a.kind.localeCompare(b.kind)||a.name.localeCompare(b.name))}}
 if(!stat.isFile())throw Error('regular file required');return {...meta,...preview(target,stat)};
}
async function workspaceSearch(kernel,id,query){
 const a=authority(kernel,id);if(typeof query!=='string'||!query.trim()||query.length>200)throw Error('query must contain 1-200 characters');
 const needle=query.trim().toLowerCase(),results=[],started=Date.now(),stack=[{relative:'',depth:0}];let filesVisited=0,entriesVisited=0,bytesRead=0,limited=false,skipped=0;
 outer:while(stack.length){const {relative,depth}=stack.pop(),target=resolveFile(a,relative),d=fs.opendirSync(target);try{let e;while((e=d.readSync())){
 if(++entriesVisited>LIMITS.entries||filesVisited>=LIMITS.files||results.length>=LIMITS.results||Date.now()-started>=LIMITS.ms){limited=true;break outer}
 if(e.name.startsWith('.')||e.name==='node_modules'||e.isSymbolicLink())continue;
 const rel=relative?relative+'/'+e.name:e.name;
 if(e.isDirectory()){if(depth<LIMITS.depth)stack.push({relative:rel,depth:depth+1});else limited=true;continue}if(!e.isFile())continue;
 filesVisited++;const file=resolveFile(a,rel),stat=fs.statSync(file),base={filename:e.name,path:rel,artifact:(a.run.artifacts||[]).includes(rel)};
 if(rel.toLowerCase().includes(needle))results.push({...base,kind:'filename/path'});
 if(stat.size<=LIMITS.bytes&&TEXT.has(path.extname(file).slice(1).toLowerCase())){
 if(bytesRead+LIMITS.bytes+1>LIMITS.totalBytes){limited=true;break outer}const x=preview(file,stat);bytesRead+=Math.min(stat.size,LIMITS.bytes+1);
 if(x.text!==undefined&&results.length<LIMITS.results){const pos=x.text.toLowerCase().indexOf(needle);if(pos>=0){const line=x.text.slice(0,pos).split('\n').length;results.push({...base,kind:'text match',line,snippet:x.text.slice(Math.max(0,pos-60),pos+needle.length+100).replace(/\s+/g,' ')})}}else skipped++;
 }else skipped++;
 if(filesVisited%20===0)await new Promise(r=>setImmediate(r));
 } }finally{d.closeSync()}}
 return {...info(a,''),query,results,filesVisited,entriesVisited,bytesRead,skipped,limited,limits:LIMITS};
}
module.exports={workspaceFiles,workspaceSearch,LIMITS};
