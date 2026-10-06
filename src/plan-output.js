'use strict';
function planSchema(continuation){const properties=continuation?{currentArchitecture:{type:'string'},persistenceCompatibility:{type:'string'},deltaSteps:{type:'array',items:{type:'string'}},regressionAcceptance:{type:'array',items:{type:'string'}},newAcceptance:{type:'array',items:{type:'string'}}}:{components:{type:'array',items:{type:'string'}},implementation:{type:'array',items:{type:'string'}},acceptance:{type:'array',items:{type:'string'}}};return {type:'object',properties,required:Object.keys(properties),additionalProperties:false}}
function structuredPlan(output,schema){let envelope;try{envelope=JSON.parse(output)}catch{throw Error('planner returned invalid structured output')}
 if(envelope.is_error||envelope.type!=='result'||envelope.subtype!=='success')throw Error('planner structured result not successful');
 const plan=envelope.structured_output;if(!plan||typeof plan!=='object'||Array.isArray(plan))throw Error('planner structured plan missing');
 for(const [name,spec]of Object.entries(schema.properties)){const x=plan[name];if(spec.type==='string'?typeof x!=='string':!Array.isArray(x)||!x.every(v=>typeof v==='string'))throw Error('planner field invalid: '+name)}
 if(Object.keys(plan).some(x=>!Object.hasOwn(schema.properties,x)))throw Error('planner field outside contract');
 return plan;
}
module.exports={planSchema,structuredPlan};
