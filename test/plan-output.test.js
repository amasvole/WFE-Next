const assert=require('assert/strict'),{planSchema,structuredPlan}=require('../src/plan-output');
const schema=planSchema(true),plan={currentArchitecture:'existing',persistenceCompatibility:'preserved',deltaSteps:['change'],regressionAcceptance:['existing behavior'],newAcceptance:['new behavior']},envelope={type:'result',subtype:'success',is_error:false,structured_output:plan,result:'Unstructured narrative is not plan authority'};
assert.deepEqual(structuredPlan(JSON.stringify(envelope),schema),plan);
for(const x of [{...envelope,is_error:true},{...envelope,subtype:'error_max_turns'},{...envelope,structured_output:undefined},{...envelope,structured_output:{...plan,deltaSteps:'text'}},{...envelope,structured_output:{...plan,goal:'overridden'}}])assert.throws(()=>structuredPlan(JSON.stringify(x),schema));
assert.throws(()=>structuredPlan('```json\n'+JSON.stringify(plan)+'\n```',schema));console.log('Structured planner success/schema/failure boundary: PASS');
