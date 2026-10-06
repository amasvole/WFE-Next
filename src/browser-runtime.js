'use strict';
const net=require('net'),{execFileSync}=require('child_process');
const OPERATOR_PORT=4317;
async function preflight(rt){
 if(rt.port===OPERATOR_PORT)throw Error('WFE RUNTIME: operator endpoint protected');
 await new Promise((ok,no)=>{const s=net.createServer();s.once('error',e=>no(Error('WFE RUNTIME: endpoint occupied: '+e.message)));s.listen(rt.port,'127.0.0.1',()=>s.close(ok));});
}
function bind(c,port){
 if(!Number.isInteger(port)||port<1024||port>65535||port===OPERATOR_PORT)throw Error("WFE RUNTIME: invalid owned port");
 const remap=u=>{const x=new URL(u);x.hostname="127.0.0.1";x.port=port;return x.href;};return{port,portEnv:c.runtime.portEnv,ready:{...c.ready,url:remap(c.ready.url)},browserUrl:remap(c.browserUrl)};
}
async function assign(c){
 const port=await new Promise((ok,no)=>{const s=net.createServer();s.once('error',no);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>ok(p));});});
 const rt=bind(c,port);
 await preflight(rt);return rt;
}
function ownsEndpoint(pid,port){
 if(!pid||port===OPERATOR_PORT)return false;
 if(process.platform!=='win32')throw Error('WFE RUNTIME: endpoint ownership verification unavailable on this host');
 const rows=execFileSync('netstat',['-ano','-p','tcp'],{encoding:'utf8',windowsHide:true}).split(/\r?\n/);
 const matches=rows.map(x=>x.trim().split(/\s+/)).filter(x=>x[0]==='TCP'&&x[1].endsWith(':'+port)&&x[3]==='LISTENING');
 return matches.length>0&&matches.every(x=>Number(x[4])===pid);
}
function parseEvidence(text){
 const raw=text.trim();try{return JSON.parse(raw);}catch{}
 // Accept a complete JSON document after command logs, including formatted JSON.
 for(let i=0;i<raw.length;i++)if(raw[i]==='{'){try{const x=JSON.parse(raw.slice(i));if(x&&typeof x.pass==='boolean')return x;}catch{}}
 return null;
}
module.exports={bind,assign,preflight,ownsEndpoint,parseEvidence,OPERATOR_PORT};
