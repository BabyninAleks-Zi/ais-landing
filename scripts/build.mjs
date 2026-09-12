import {readFile,writeFile,mkdir,rm,copyFile,realpath} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {renderPage,escapeHtml} from './render.mjs';

export const ROOT=fileURLToPath(new URL('../',import.meta.url));
const json=async path=>JSON.parse(await readFile(join(ROOT,path),'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// Nothing is discovered automatically in private-assets, including old PDFs.
export async function loadAttachment(investor, root=ROOT) {
  const attachment=investor?.attachment;
  if(attachment == null) return null;
  if(attachment.approved !== true || attachment.revision !== investor.sourceRevision ||
     !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.pdf$/.test(attachment.fileName || '') ||
     !/^[a-f0-9]{64}$/.test(attachment.sha256 || '')) {
    throw new Error('Приложение требует явного согласования, версии и SHA-256.');
  }
  const privateRoot=join(await realpath(root),'private-assets');
  const file=await realpath(join(privateRoot,attachment.fileName));
  if(!file.startsWith(privateRoot+sep)) throw new Error('Приложение находится вне private-assets.');
  const bytes=await readFile(file);
  if(bytes.subarray(0,5).toString() !== '%PDF-' || sha(bytes) !== attachment.sha256) {
    throw new Error('Приложение не является PDF или не совпадает с согласованным SHA-256.');
  }
  return {...attachment,bytes,href:'documents/'+attachment.fileName};
}
function documentHtml(page, css, js, inline=false, logoData='') {
  const hash=createHash('sha256').update(js).digest('base64');
  const csp=inline?`default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'sha256-${hash}'; base-uri 'none'; form-action 'none'; object-src 'none'`:`default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'`;
  return `<!doctype html>\n<html lang="ru" data-audience="${page.audience}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${escapeHtml(csp)}"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><meta name="theme-color" content="#0b2d3a"><title>${escapeHtml(page.title)}</title><meta name="description" content="${escapeHtml(page.description)}"><link rel="icon" type="image/png" href="${inline?logoData:'assets/ais-monogram.png'}">${inline?`<style>${css}</style>`:'<link rel="stylesheet" href="assets/styles.css">'}</head><body>${page.body}${inline?`<script>${js}</script>`:'<script src="assets/app.js" defer></script>'}</body></html>\n`;
}
export async function build(audience='investor') {
  if(!['investor','public'].includes(audience)) throw new Error('audience должен быть investor или public.');
  const site=await json('content/site.json');
  const investor=audience==='investor'?await json('content/investor.json'):null;
  const attachment=await loadAttachment(investor);
  const css=await readFile(join(ROOT,'src/styles.css'),'utf8');
  const js=await readFile(join(ROOT,'src/app.js'),'utf8');
  const logo=await readFile(join(ROOT,'assets/ais-monogram.png'));
  const out=join(ROOT,`dist-${audience}`);
  await rm(out,{recursive:true,force:true});
  await mkdir(join(out,'assets'),{recursive:true});
  const html=documentHtml(renderPage(site,investor,{attachment}),css,js);
  await writeFile(join(out,'index.html'),html);
  await copyFile(join(ROOT,'src/styles.css'),join(out,'assets/styles.css'));
  await copyFile(join(ROOT,'src/app.js'),join(out,'assets/app.js'));
  await writeFile(join(out,'assets/ais-monogram.png'),logo);
  await writeFile(join(out,'.nojekyll'),'');
  await writeFile(join(out,'robots.txt'),'User-agent: *\nDisallow: /\n');
  await writeFile(join(out,'404.html'),'<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>AIS — страница не найдена</title><body><h1>Страница не найдена</h1><p>Проверьте адрес или <a href="./index.html">откройте презентацию AIS</a>.</p></body></html>');
  if(attachment){
    await mkdir(join(out,'documents'),{recursive:true});
    await writeFile(join(out,'documents',attachment.fileName),attachment.bytes);
  }
  const files=['index.html','assets/styles.css','assets/app.js','assets/ais-monogram.png','404.html','robots.txt','.nojekyll'];
  if(attachment) files.push('documents/'+attachment.fileName);
  const hashes={};
  for(const name of files) hashes[name]=sha(await readFile(join(out,name)));
  await writeFile(join(out,'build-manifest.json'),JSON.stringify({audience,sourceRevision:site.sourceRevision,implementationRevision:site.implementationRevision,authentication:false,...(investor?{financialStatus:investor.review.status}:{}),files:hashes},null,2)+'\n');
  return out;
}
export async function standalone(audience='investor',output) {
  if(!['investor','public'].includes(audience)) throw new Error('Неизвестная редакция.');
  const site=await json('content/site.json');
  const investor=audience==='investor'?await json('content/investor.json'):null;
  const attachment=await loadAttachment(investor);
  const css=await readFile(join(ROOT,'src/styles.css'),'utf8');
  const js=await readFile(join(ROOT,'src/app.js'),'utf8');
  const logoData='data:image/png;base64,'+(await readFile(join(ROOT,'assets/ais-monogram.png'))).toString('base64');
  const embedded=attachment?{...attachment,href:'data:application/pdf;base64,'+attachment.bytes.toString('base64')}:null;
  const page=renderPage(site,investor,{logoData,attachment:embedded});
  await writeFile(output,documentHtml(page,css,js,true,logoData));
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);
  try{
    if(args.includes('--all')){
      for(const audience of ['investor','public']) console.log('Built:',await build(audience));
    }else{
      const index=args.indexOf('--audience');
      const audience=index<0?'investor':args[index+1];
      if(!audience) throw new Error('После --audience требуется значение.');
      console.log('Built:',await build(audience));
    }
  }catch(error){console.error(error.message);process.exitCode=1;}
}
