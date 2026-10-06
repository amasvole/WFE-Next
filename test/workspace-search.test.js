const assert=require('node:assert/strict'),fs=require('fs'),os=require('os'),path=require('path');
const {workspaceFiles,workspaceSearch,LIMITS}=require('../src/workspace-files');
(async()=>{const base=fs.mkdtempSync(path.join(os.tmpdir(),'wfe-search-')),root=path.join(base,'workspaces','accepted');try{
fs.mkdirSync(path.join(root,'public'),{recursive:true});fs.writeFileSync(path.join(root,'public','app.ts'),'const Household = "priority";');fs.writeFileSync(path.join(root,'large.txt'),'x'.repeat(LIMITS.bytes+1));fs.writeFileSync(path.join(root,'unknown.dat'),'readable');fs.writeFileSync(path.join(root,'binary.txt'),Buffer.from([0,1]));
const kernel={base,state:{projects:{p:{runs:[{id:'r',status:'DONE',workspace:root,artifacts:['public']}]}}}};
for(const ext of 'txt md json js ts html css java py yaml yml xml'.split(' ')){fs.writeFileSync(path.join(root,'source.'+ext),'safe text');assert.equal(workspaceFiles(kernel,'p','source.'+ext).text,'safe text');}
for(const rel of ['../outside','public/../../outside',root,'C:/Windows/win.ini','%2e%2e/outside','public\\app.ts','public/app.ts:secret','node_modules/x'])assert.throws(()=>workspaceFiles(kernel,'p',rel));
for(const id of ['missing','__proto__','constructor']){assert.throws(()=>workspaceFiles(kernel,id));await assert.rejects(workspaceSearch(kernel,id,'priority'));}
assert.match(workspaceFiles(kernel,'p','large.txt').previewUnavailable,/limit/);assert.match(workspaceFiles(kernel,'p','unknown.dat').previewUnavailable,/Unsupported/);assert.match(workspaceFiles(kernel,'p','binary.txt').previewUnavailable,/Binary/);
const outside=path.join(base,'outside');fs.mkdirSync(outside);fs.writeFileSync(path.join(outside,'secret.txt'),'priority external');fs.symlinkSync(outside,path.join(root,'linked'),'junction');assert.throws(()=>workspaceFiles(kernel,'p','linked/secret.txt'));
assert.equal((await workspaceSearch(kernel,'p','app.ts')).results[0].kind,'filename/path');assert((await workspaceSearch(kernel,'p','public/app')).results.length);const content=await workspaceSearch(kernel,'p','priority');assert.equal(content.results.length,1);assert(content.results[0].snippet.includes('Household'));assert.equal(content.results[0].line,1);assert.equal((await workspaceSearch(kernel,'p','nomatch')).results.length,0);
await assert.rejects(workspaceSearch(kernel,'p',''));await assert.rejects(workspaceSearch(kernel,'p','x'.repeat(201)));
for(let i=0;i<140;i++)fs.writeFileSync(path.join(root,'match'+i+'.txt'),'needle');const bounded=await workspaceSearch(kernel,'p','needle');assert(bounded.results.length<=LIMITS.results);assert(bounded.limited);assert(bounded.filesVisited<=LIMITS.files);assert(bounded.bytesRead<=LIMITS.totalBytes);
console.log('Search / preview types / traversal / junction / bounds PASS');
}finally{fs.rmSync(base,{recursive:true,force:true})}})().catch(e=>{console.error(e);process.exitCode=1});
