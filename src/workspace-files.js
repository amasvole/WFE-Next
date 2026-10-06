'use strict';
const fs=require('fs'),path=require('path');
// A projection of an existing accepted Run. Never accepts a client supplied root.
function workspaceFiles(kernel,id,relative=''){
 const p=kernel.state.projects[id],run=p?.runs.filter(r=>r.status==='DONE'&&r.workspace).at(-1);
 if(!run)throw Error('accepted workspace unavailable');
 const root=path.resolve(run.workspace),base=path.resolve(kernel.base,'workspaces');
 const inside=(a,b)=>b===a||b.startsWith(a+path.sep);
 if(!inside(base,root)||fs.lstatSync(root).isSymbolicLink()||!inside(fs.realpathSync(base),fs.realpathSync(root)))throw Error('workspace outside authority');
 if(typeof relative!=='string'||path.isAbsolute(relative)||relative.includes('\\')||relative.split('/').some(x=>x==='..'||x.startsWith('.')))throw Error('path denied');
 const target=path.resolve(root,relative);if(!inside(root,target))throw Error('path denied');
 let cursor=root;for(const part of relative.split('/').filter(Boolean)){cursor=path.join(cursor,part);if(fs.lstatSync(cursor).isSymbolicLink())throw Error('linked path denied');}
 if(!inside(fs.realpathSync(root),fs.realpathSync(target)))throw Error('path denied');
 const stat=fs.statSync(target),info={runId:run.id,workspace:root,path:relative,shared:p.runs.filter(r=>r.workspace===run.workspace).length>1};
 if(stat.isDirectory())return {...info,kind:'directory',entries:fs.readdirSync(target,{withFileTypes:true}).filter(x=>!x.name.startsWith('.')&&!['node_modules'].includes(x.name)&&!x.isSymbolicLink()).slice(0,500).map(x=>({name:x.name,kind:x.isDirectory()?'directory':'file',artifact:(run.artifacts||[]).includes(relative?relative+'/'+x.name:x.name)})).sort((a,b)=>a.kind.localeCompare(b.kind)||a.name.localeCompare(b.name))};
 if(!stat.isFile())throw Error('regular file required');
 if(stat.size>256*1024)return {...info,kind:'file',previewUnavailable:'File exceeds 256 KB preview limit',size:stat.size};
 const bytes=fs.readFileSync(target);if(bytes.includes(0))return {...info,kind:'file',previewUnavailable:'Binary file',size:stat.size};
 return {...info,kind:'file',text:bytes.toString('utf8'),size:stat.size};
}
module.exports={workspaceFiles};
