import {copyFile,mkdir,readdir,rm} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build,ROOT} from './build.mjs';

export const publicationFiles = [
  'index.html', '404.html', 'robots.txt', '.nojekyll',
  'assets/styles.css', 'assets/app.js', 'assets/ais-monogram.png'
];

export async function buildPages() {
  const source = await build('investor');
  const entries = await readdir(source,{recursive:true,withFileTypes:true});
  if (entries.some(entry => entry.isSymbolicLink()) ||
      entries.filter(entry => entry.isFile()).length !== publicationFiles.length + 1) {
    throw new Error('Публикация допускает только файлы сайта; документы требуют отдельной настройки.');
  }
  const output = join(ROOT,'dist-pages');
  await rm(output,{recursive:true,force:true});
  for (const prefix of ['', 'dist-investor']) {
    for (const file of publicationFiles) {
      const target = join(output,prefix,file);
      await mkdir(dirname(target),{recursive:true});
      await copyFile(join(source,file),target);
    }
  }
  return output;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log('Built:',await buildPages()); }
  catch (error) { console.error(error.message);process.exitCode=1; }
}
