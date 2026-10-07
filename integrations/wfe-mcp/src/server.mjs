import {createAdapter,createHttpAdapter,sourceIdentity} from './adapter.mjs';
import {operatorOrigin} from './status-view.mjs';
const port=Number(process.env.WFE_MCP_PORT??4327);
if(!Number.isInteger(port)||port<1||port>65535)throw Error('WFE_MCP_PORT must be a valid TCP port');
const adapter=createAdapter({origin:operatorOrigin(process.env.WFE_OPERATOR_ORIGIN),identity:sourceIdentity()});
const server=createHttpAdapter(adapter);
server.listen(port,'127.0.0.1',()=>console.error('WFE-Next product-control MCP listening on http://127.0.0.1:'+port+'/mcp'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));

