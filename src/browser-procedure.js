'use strict';
function normalizeProcedure(input){
 if(!input||!Array.isArray(input.steps)||!input.steps.length||input.steps.length>100)throw Error('ACCEPTANCE PROCEDURE: bounded nonempty steps required');
 const supported=new Set(['goto','type','select','click','waitText','assertText','assertAbsent','rowSelect','rowClick','stopBackend','startBackend','waitReady','reload']);
 const str=(v,name)=>{if(typeof v!=='string'||!v.trim())throw Error('ACCEPTANCE PROCEDURE: '+name+' requires nonempty string');return v;};
 return {steps:input.steps.map(s=>{
  if(!s||!supported.has(s.op))throw Error('ACCEPTANCE PROCEDURE: unsupported op '+s?.op);
  if(s[s.op]!==undefined){const payload=s[s.op];if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('ACCEPTANCE PROCEDURE: invalid operation payload');for(const [key,value]of Object.entries(payload))if(s[key]!==undefined&&JSON.stringify(s[key])!==JSON.stringify(value))throw Error('ACCEPTANCE PROCEDURE: conflicting payload '+key);s={...payload,...s};}
  const x={op:s.op};
  if(s.op==='goto')x.url=str(s.url,'goto url');
  if(['type','select','click','rowSelect','rowClick'].includes(s.op))x.selector=str(s.selector??s.target,s.op+' selector');
  if(['type','select','rowSelect'].includes(s.op)){x.value=s.value??(s.op==='type'?s.text:undefined);if(typeof x.value!=='string')throw Error('ACCEPTANCE PROCEDURE: '+s.op+' requires value');}
  if(['waitText','assertText'].includes(s.op)||s.op==='assertAbsent'&&s.text!==undefined)x.text=str(s.text,s.op+' text');
  if(s.op==='assertAbsent'&&s.text===undefined&&typeof s.selector!=='string')throw Error('ACCEPTANCE PROCEDURE: assertAbsent requires text or selector');
  if(['rowClick','rowSelect'].includes(s.op))x.rowText=str(s.rowText??s.row??s.text,s.op+' row identity');
  if(['assertText','assertAbsent','waitText'].includes(s.op)){if(s.selector!==undefined)x.selector=str(s.selector,'assert selector');if(s.rowText!==undefined||s.row!==undefined)x.rowText=str(s.rowText??s.row,'assert row');}
  if(s.timeoutMs!==undefined){if(!Number.isInteger(s.timeoutMs)||s.timeoutMs<1||s.timeoutMs>30000)throw Error('ACCEPTANCE PROCEDURE: timeout out of bounds');x.timeoutMs=s.timeoutMs;}
  if(s.op==='waitReady'&&s.url!==undefined)x.url=str(s.url,'readiness url');
  return x;
 })};
}
module.exports={normalizeProcedure};
