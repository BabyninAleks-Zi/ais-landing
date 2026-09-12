import {mkdtemp,mkdir,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {sourceFiles} from './source-files.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const temp=await mkdtemp(join(tmpdir(),'ais-clean-'));
try {
  for(const file of sourceFiles){
    await mkdir(dirname(join(temp,file)),{recursive:true});
    await copyFile(join(root,file),join(temp,file));
  }
  for(const args of [['--test','tests/site.test.mjs'],['scripts/build.mjs','--all']]){
    const result=spawnSync(process.execPath,args,{cwd:temp,stdio:'inherit'});
    if(result.error) throw result.error;
    if(result.status!==0) throw new Error('Проверка чистого набора исходников завершилась ошибкой.');
  }
  await rm(join(temp,'content/investor.json'));
  const result=spawnSync(process.execPath,['scripts/build.mjs','--audience','public'],{cwd:temp,stdio:'inherit'});
  if(result.error || result.status!==0) throw new Error('Публичная сборка зависит от инвесторского контента.');
  console.log(`PASS: ${sourceFiles.length} source files; builds without documents; public builds without investor JSON.`);
} finally {
  await rm(temp,{recursive:true,force:true});
}
