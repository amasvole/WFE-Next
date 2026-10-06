const assert=require('node:assert/strict'),fs=require('fs'),os=require('os'),path=require('path');
const {workspaceFiles}=require('../src/workspace-files');
const base=fs.mkdtempSync(path.join(os.tmpdir(),'wfe-files-')),root=path.join(base,'workspaces','accepted');
try{fs.mkdirSync(path.join(root,'public'),{recursive:true});fs.writeFileSync(path.join(root,'public','index.html'),'<script>never execute</script>');fs.writeFileSync(path.join(root,'.secret'),'hidden');fs.writeFileSync(path.join(root,'large.txt'),'x'.repeat(262145));fs.writeFileSync(path.join(root,'binary'),Buffer.from([0,1]));
 const kernel={base,state:{projects:{p:{runs:[{id:'accepted',status:'DONE',workspace:root,artifacts:['public']},{id:'failed',status:'BLOCKED',workspace:base}]}}}};
 assert.equal(workspaceFiles(kernel,'p').runId,'accepted');assert(!workspaceFiles(kernel,'p').entries.some(x=>x.name.startsWith('.')));assert.equal(workspaceFiles(kernel,'p','public/index.html').text,'<script>never execute</script>');
 for(const p of ['../escape','public/../../escape','.secret','public\\index.html',path.resolve(root)])assert.throws(()=>workspaceFiles(kernel,'p',p));
 assert.match(workspaceFiles(kernel,'p','large.txt').previewUnavailable,/limit/);assert.equal(workspaceFiles(kernel,'p','binary').previewUnavailable,'Binary file');
 const outside=path.join(base,'outside');fs.mkdirSync(outside);fs.writeFileSync(path.join(outside,'secret'),'outside');fs.symlinkSync(outside,path.join(root,'linked'),'junction');assert(!workspaceFiles(kernel,'p').entries.some(x=>x.name==='linked'));assert.throws(()=>workspaceFiles(kernel,'p','linked/secret'));
 assert.throws(()=>workspaceFiles(kernel,'missing'));kernel.state.projects.p.runs[0].workspace=outside;assert.throws(()=>workspaceFiles(kernel,'p'));
 console.log('Workspace boundary / accepted source / inert preview: PASS');
}finally{fs.rmSync(base,{recursive:true,force:true})}
