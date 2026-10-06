'use strict';

const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
function firstExisting(xs){return xs.find(x=>x&&fs.existsSync(x))} const puppeteerPath=firstExisting([process.env.WFE_PUPPETEER_PATH,'F:/WFE/bootstrap/rdc/node_modules/puppeteer']);if(!puppeteerPath)throw new Error('Puppeteer unavailable');const puppeteer=require(puppeteerPath); const browserExe=firstExisting([process.env.WFE_BROWSER_EXE,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe']);if(!browserExe)throw new Error('Edge/Chromium unavailable');
const workspace=process.argv[2], procedurePath=process.argv[3];
const contract=JSON.parse(fs.readFileSync(path.join(workspace,'wfe-run.json'),'utf8'));
const raw=fs.readFileSync(procedurePath,'utf8').replace(/^.*?```json\s*/s,'').replace(/\s*```.*$/s,'');
const procedure=JSON.parse(raw), origin=new URL(contract.browserUrl).origin, evidence=[]; let child,browser,page,oldPid;
function rec(i,s,pass,obs){evidence.push({index:i,op:s.op,pass,observation:String(obs).slice(0,1000)});if(!pass)throw new Error('step '+i+' '+s.op+': '+obs)}
const bodyText=()=>page.evaluate(()=>document.body.innerText);
async function ready(expect,timeout){const end=Date.now()+timeout;while(Date.now()<end){try{const r=await fetch(contract.ready.url);if(expect&&r.ok)return true;if(!expect)await new Promise(r=>setTimeout(r,150));}catch(e){if(!expect)return true}await new Promise(r=>setTimeout(r,150))}return false}
function start(){child=spawn(contract.start.command,contract.start.args,{cwd:workspace,stdio:'ignore',windowsHide:true});return child}
async function stop(){if(!child||child.exitCode!==null)return;oldPid=child.pid;if(process.platform==='win32')spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true});else child.kill('SIGTERM');const end=Date.now()+5000;while(child.exitCode===null&&Date.now()<end)await new Promise(r=>setTimeout(r,100))}
async function row(s){for(const h of await page.$$('tr')){const t=await h.evaluate(e=>e.innerText);if(t.includes(s.rowText))return h}throw new Error('row not found: '+s.rowText)}
(async()=>{try{
 start();rec(-3,{op:'initialStart'},await ready(true,15000),'pid='+child.pid+' ready='+contract.ready.url);
 browser=await puppeteer.launch({executablePath:browserExe,headless:true,args:['--no-first-run']});page=await browser.newPage();
 await page.setRequestInterception(true);page.on('request',r=>{try{new URL(r.url()).origin===origin?r.continue():r.abort()}catch{r.abort()}});
 for(let i=0;i<procedure.steps.length;i++){const s=procedure.steps[i];try{
  if(s.op==='goto'){const u=s.url==='$BROWSER_URL'?contract.browserUrl:s.url;if(new URL(u).origin!==origin)throw new Error('origin denied');const x=await page.goto(u,{waitUntil:'networkidle0'});rec(i,s,x&&x.ok(),'HTTP '+(x&&x.status())+' '+u)}
  else if(s.op==='type'){await page.type(s.selector,s.value);rec(i,s,true,'typed '+JSON.stringify(s.value)+' into '+s.selector)}
  else if(s.op==='select'){const v=await page.select(s.selector,s.value);rec(i,s,v.includes(s.value),'selected='+v.join(','))}
  else if(s.op==='click'){await page.click(s.selector);await new Promise(r=>setTimeout(r,300));rec(i,s,true,'clicked '+s.selector)}
  else if(s.op==='waitText'||s.op==='assertText'){if(s.op==='waitText')await page.waitForFunction(x=>document.body.innerText.toLowerCase().includes(x.toLowerCase()),{timeout:5000},s.text);const t=await bodyText();rec(i,s,t.toLowerCase().includes(s.text.toLowerCase()),'observed text '+JSON.stringify(s.text))}
  else if(s.op==='assertAbsent'){await new Promise(r=>setTimeout(r,300));const t=await bodyText();rec(i,s,!t.toLowerCase().includes(s.text.toLowerCase()),'absent '+JSON.stringify(s.text))}
  else if(s.op==='rowSelect'){const h=await row(s),sel=await h.$(s.selector);await sel.select(s.value);await new Promise(r=>setTimeout(r,500));const h2=await row(s),sel2=await h2.$(s.selector),v=await sel2.evaluate(e=>e.value);rec(i,s,v===s.value,'row='+s.rowText+' selected='+v)}
  else if(s.op==='rowClick'){const h=await row(s),el=await h.$(s.selector);await el.click();await new Promise(r=>setTimeout(r,500));rec(i,s,true,'row='+s.rowText+' clicked='+s.selector)}
  else if(s.op==='stopBackend'){await stop();const down=await ready(false,5000);rec(i,s,down,'oldPid='+oldPid+' unavailable='+down)}
  else if(s.op==='startBackend'){start();rec(i,s,child.pid!==oldPid,'oldPid='+oldPid+' newPid='+child.pid)}
  else if(s.op==='waitReady'){const up=await ready(true,15000);rec(i,s,up,'pid='+child.pid+' ready='+up)}
  else if(s.op==='reload'){const x=await page.reload({waitUntil:'networkidle0'});rec(i,s,x&&x.ok(),'reload HTTP '+(x&&x.status()))}
  else throw new Error('unsupported op '+s.op);
 }catch(e){rec(i,s,false,e.message)}}
 console.log(JSON.stringify({pass:true,origin,oldPid,newPid:child&&child.pid,evidence}));
}catch(e){console.log(JSON.stringify({pass:false,error:e.message,origin,evidence}));process.exitCode=1}finally{if(browser)await browser.close();await stop()}})();
