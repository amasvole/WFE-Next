const obj=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
const id={type:'string',minLength:1,maxLength:160,pattern:'^[A-Za-z0-9][A-Za-z0-9._-]*$'},str={type:'string'},bool={type:'boolean'};
const sha={type:'string',pattern:'^([a-f0-9]{40}|[a-f0-9]{64})$'};
const requestSchema=obj({requestId:id,projectId:id,name:{type:'string',minLength:1,maxLength:160},baseSha:sha,protection:{enum:['NORMAL','WARN_BEFORE_MUTATION']},approvalId:id},['requestId','projectId','name','baseSha']);
const requestRecord=obj({action:{const:'product.create'},requestId:id,target:obj({projectId:id,name:str,protection:{enum:['NORMAL','WARN_BEFORE_MUTATION']}}),baseSha:sha,approvalId:{anyOf:[id,{type:'null'}]}});
const policySchema=obj({policyId:{const:'wfe.product.create.v1'},action:{const:'product.create'},targetId:id,approvalRequired:bool,authority:{anyOf:[{const:'WFEKey'},{type:'null'}]},reason:str,allowed:bool});
const receiptSchema=obj({schemaVersion:{const:'wfe.product.receipt.v1'},receiptId:str,requestId:id,requestDigest:{type:'string',pattern:'^[a-f0-9]{64}$'},request:requestRecord,action:{const:'product.create'},targetId:id,baseSha:sha,observedSha:{anyOf:[sha,{type:'null'}]},policy:policySchema,approvalId:{anyOf:[id,{type:'null'}]},result:{enum:['PASS','REJECTED']},code:str,finishedAt:str});
const resultSchema=obj({receipt:receiptSchema,deduplicated:bool});
module.exports={requestSchema,resultSchema};
