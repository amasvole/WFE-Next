'use strict';
const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const {normalizeProcedure}=require('../src/browser-procedure'),{preflight,ownsEndpoint}=require('../src/browser-runtime');
const firstExisting=xs=>xs.find(x=>x&&fs.existsSync(x));
const workspace=process.argv[2],procedurePath=process.argv[3],evidence=[];
let child,browser,page,oldPid,origin,contract,preferredOrigin;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function rec(index,op,pass,observation){evidence.push({index,op,pass,observation});if(!pass)throw Error('step '+index+' '+op+': '+observation);}
async function ready(timeout=10000){const until=Date.now()+timeout;do{if(child?.exitCode!==null||child?.signalCode!==null)return false;try{if((await fetch(contract.ready.url)).ok&&ownsEndpoint(child.pid,contract.runtime.port))return true;}catch{}await sleep(150);}while(Date.now()<until);return false;}
async function start(){await preflight(contract.runtime);const env={...process.env,[contract.runtime.portEnv]:String(contract.runtime.port)};delete env.WFE_RUNTIME_PORT;child=spawn(contract.start.command,contract.start.args,{cwd:workspace,env,stdio:['ignore','pipe','pipe'],windowsHide:true});child.on('error',()=>{});child.stdout.resume();child.stderr.resume();return child;}
async function stop(){if(!child||child.exitCode!==null||child.signalCode!==null)return;oldPid=child.pid;child.kill();const until=Date.now()+5000;while(child.exitCode===null&&child.signalCode===null&&Date.now()<until)await sleep(100);if(child.exitCode===null&&child.signalCode===null)throw Error('WFE RUNTIME: owned browser backend did not exit');}
async function row(s){
 const h=await page.evaluateHandle((text,target)=>{
  const candidates=[...document.querySelectorAll('body *')].filter(e=>e.innerText?.includes(text)&&e.querySelector(target));
  return candidates.filter(e=>!candidates.some(other=>other!==e&&e.contains(other)))[0]||null;
 },s.rowText,s.selector);
 const el=h.asElement();if(!el)throw Error('row not found: '+s.rowText);return el;
}
async function textFor(s){if(s.rowText){const h=await row(s),el=s.selector?await h.$(s.selector):h;if(!el)return '';return el.evaluate(e=>e.innerText);}if(s.selector)return page.$eval(s.selector,e=>e.innerText).catch(()=> '');return page.evaluate(()=>document.body.innerText);}
function effectiveUrl(u){if(u==='$BROWSER_URL'||u==='{{browserUrl}}')return contract.browserUrl;const x=new URL(u,contract.browserUrl);if(x.origin===preferredOrigin){const e=new URL(contract.browserUrl);x.hostname=e.hostname;x.port=e.port;}if(x.origin!==origin)throw Error('ACCEPTANCE PROCEDURE: origin denied');return x.href;}
(async()=>{try{
 contract=JSON.parse(fs.readFileSync(path.join(workspace,'wfe-run.json'),'utf8'));preferredOrigin=new URL(contract.browserUrl).origin;
 const port=Number(process.env.WFE_RUNTIME_PORT);if(!Number.isInteger(port)||port<1024||port>65535||!contract.runtime?.portEnv)throw Error('WFE RUNTIME: effective runtime assignment required');
 const remap=u=>{const x=new URL(u);x.hostname='127.0.0.1';x.port=port;return x.href;};contract={...contract,runtime:{...contract.runtime,port},ready:{...contract.ready,url:remap(contract.ready.url)},browserUrl:remap(contract.browserUrl)};origin=new URL(contract.browserUrl).origin;
 const procedure=normalizeProcedure(JSON.parse(fs.readFileSync(procedurePath,'utf8')));
 // Validate all URLs before starting any process or interacting with the app.
 for(const s of procedure.steps)if(s.url)effectiveUrl(s.url);
 await start();rec(-3,'initialStart',await ready(),'pid='+child.pid+' ready='+contract.ready.url);
 const puppeteerPath=firstExisting([process.env.WFE_PUPPETEER_PATH,'F:/WFE/bootstrap/rdc/node_modules/puppeteer']);if(!puppeteerPath)throw Error('Puppeteer unavailable');
 const browserExe=firstExisting([process.env.WFE_BROWSER_EXE,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe']);if(!browserExe)throw Error('Edge unavailable');
 browser=await require(puppeteerPath).launch({executablePath:browserExe,headless:true,args:['--no-first-run']});page=await browser.newPage();
 await page.setRequestInterception(true);page.on('request',r=>{try{new URL(r.url()).origin===origin?r.continue():r.abort();}catch{r.abort();}});
 for(let i=0;i<procedure.steps.length;i++){
  const s=procedure.steps[i];try{
   if(s.op==='goto'){const u=effectiveUrl(s.url),r=await page.goto(u,{waitUntil:'networkidle0'});rec(i,s.op,r?.ok(),'HTTP '+r?.status()+' '+u);}
   else if(s.op==='type'){await page.type(s.selector,s.value);rec(i,s.op,true,'typed '+JSON.stringify(s.value));}
   else if(s.op==='select'){const v=await page.select(s.selector,s.value);await sleep(350);rec(i,s.op,v.includes(s.value),'selected '+v);}
   else if(s.op==='click'){await page.click(s.selector);await sleep(350);rec(i,s.op,true,'clicked '+s.selector);}
   else if(['waitText','assertText','assertAbsent'].includes(s.op)){
    if(s.op==='waitText'){const until=Date.now()+(s.timeoutMs||5000);while(Date.now()<until&&!(await textFor(s)).toLowerCase().includes(s.text.toLowerCase()))await sleep(150);}
    else await sleep(250);
    const text=await textFor(s),found=s.text===undefined?await page.$eval(s.selector,els=>els.some(e=>e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden')):text.toLowerCase().includes(s.text.toLowerCase());rec(i,s.op,s.op==='assertAbsent'?!found:found,(s.rowText?'row='+s.rowText+' ':'')+'observed '+JSON.stringify(text).slice(0,500));
   }else if(s.op==='rowSelect'){const h=await row(s),el=await h.$(s.selector);await el.select(s.value);await sleep(400);const updated=await row(s),target=await updated.$(s.selector),v=await target.evaluate(e=>e.value);rec(i,s.op,v===s.value,'row='+s.rowText+' selected='+v);}
   else if(s.op==='rowClick'){const h=await row(s),el=await h.$(s.selector);await el.click();await sleep(400);rec(i,s.op,true,'row='+s.rowText+' clicked='+s.selector);}
   else if(s.op==='stopBackend'){await stop();let down=false;try{await fetch(contract.ready.url);}catch{down=true;}rec(i,s.op,down,'oldPid='+oldPid+' unavailable='+down);}
   else if(s.op==='startBackend'){await start();rec(i,s.op,child.pid!==oldPid,'oldPid='+oldPid+' newPid='+child.pid);}
   else if(s.op==='waitReady')rec(i,s.op,await ready(s.timeoutMs),'pid='+child.pid+' endpoint='+contract.ready.url);
   else if(s.op==='reload'){const r=await page.reload({waitUntil:'networkidle0'});rec(i,s.op,r?.ok(),'reload HTTP '+r?.status());}
  }catch(e){rec(i,s.op,false,e.message);}
 }
 console.log(JSON.stringify({pass:true,origin,oldPid,newPid:child?.pid,evidence}));
}catch(e){const category=e.message.startsWith('ACCEPTANCE PROCEDURE:')?'ACCEPTANCE_PROCEDURE':e.message.startsWith('WFE RUNTIME:')?'WFE_RUNTIME':'PRODUCT';console.log(JSON.stringify({pass:false,class:category,error:e.message,origin,evidence}));process.exitCode=category==='ACCEPTANCE_PROCEDURE'?2:1;}finally{if(browser)await browser.close();await stop();}})();
