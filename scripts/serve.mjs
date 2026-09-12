/** Local review only. This server is not production authentication. */
import {createServer} from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
export function safePath(root,url){
  let path;
  try {path=decodeURIComponent(url.split('?')[0]);} catch {return null;}
  if(path.includes('\0')||path.includes('\\'))return null;
  if(path.split('/').some(x=>x.startsWith('.')))return null;
  const full=resolve(root,'.'+(path.endsWith('/')?path+'index.html':path));
  return full.startsWith(resolve(root)+sep)?full:null;
}
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.pdf':'application/pdf','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8'};
export async function startServer({root,port=4173,host='127.0.0.1'}={}){
  const base=await realpath(root);
  const server=createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Frame-Options','DENY');
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end('Method not allowed');return;}
    const file=safePath(base,req.url||'/');
    if(!file){res.writeHead(403);res.end('Forbidden');return;}
    try {
      const actual=await realpath(file);
      if(!actual.startsWith(base+sep)){res.writeHead(403);res.end('Forbidden');return;}
      const meta=await stat(actual);
      if(!meta.isFile()){res.writeHead(404);res.end('Not found');return;}
      res.writeHead(200,{'Content-Type':types[extname(actual)]||'application/octet-stream','Content-Length':meta.size});
      res.end(req.method==='HEAD'?undefined:await readFile(actual));
    }catch{res.writeHead(404);res.end('Not found');}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});
  return server;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);
  const arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
  const audience=arg('--audience','investor');
  const port=Number(arg('--port','4173'));
  if(!['investor','public'].includes(audience)||!Number.isInteger(port)||port<1||port>65535){console.error('Некорректная редакция или порт.');process.exit(1);}
  const root=fileURLToPath(new URL(`../dist-${audience}/`,import.meta.url));
  try{
    const server=await startServer({root,port});
    console.log(`AIS ${audience}: http://127.0.0.1:${port}/`);
    console.log('Локальный просмотр. Не публичный сервер и не контроль доступа.');
    for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>server.close(()=>process.exit(0)));
  }catch(error){console.error('Не удалось запустить просмотр:',error.message);process.exitCode=1;}
}
