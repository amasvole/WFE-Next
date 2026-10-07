// A fixed canonical kernel route, independent of legacy HTTP mutations.
async function productControlHttp(q,r,kernel){
 if(q.url!=='/api/control/product-create')return false;
 const send=(code,data)=>{r.writeHead(code,{'content-type':'application/json'});r.end(JSON.stringify(data));};
 let host,origin;try{host=new URL('http://'+q.headers.host).hostname;origin=q.headers.origin?new URL(q.headers.origin):null;}catch{send(403,{error:'LOCAL_BOUNDARY'});return true;}
 const local=x=>['127.0.0.1','localhost','[::1]'].includes(x);
 if(!local(host)||(origin&&(!local(origin.hostname)||origin.protocol!=='http:'))){send(403,{error:'LOCAL_BOUNDARY'});return true;}
 if(q.method!=='POST'){send(405,{error:'METHOD_NOT_ALLOWED'});return true;}
 try{
  const chunks=[];let size=0;
  for await(const chunk of q){size+=chunk.length;if(size>16384){send(413,{error:'REQUEST_TOO_LARGE'});return true;}chunks.push(chunk);}
  const result=kernel.createProduct(JSON.parse(Buffer.concat(chunks).toString('utf8')));
  send(200,result);
 }catch(e){const code=['INVALID_REQUEST','REQUEST_ID_CONFLICT','MUTATION_BUSY','SOURCE_CHANGED','STATE_INVALID','STATE_CHANGED'].includes(e.code)?e.code:e instanceof SyntaxError?'INVALID_REQUEST':'CONTROL_UNAVAILABLE';send(code==='INVALID_REQUEST'?400:409,{error:code});}
 return true;
}
module.exports={productControlHttp};
