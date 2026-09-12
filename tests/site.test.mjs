import {tmpdir} from 'node:os';
import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,mkdtemp,mkdir,writeFile,rm,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {build,ROOT,standalone,loadAttachment} from '../scripts/build.mjs';
import {buildPages} from '../scripts/build-pages.mjs';
import {escapeHtml,formatNumber,revenueHeight,renderPage,validateContent} from '../scripts/render.mjs';
import {safePath,startServer} from '../scripts/serve.mjs';
const read=path=>readFile(join(ROOT,path),'utf8');
const hash=b=>createHash('sha256').update(b).digest('hex');
let site,investor,privateHtml,publicHtml,templateHtml,server,url;
function forecastFixture() {
 const fixture=structuredClone(investor);
 fixture.review={status:'approved',issues:[]};
 fixture.years=[2026,2027,2028];
 fixture.scenarios={
  base:{label:'Тестовый вариант',tag:'Синтетические данные',revenue:[10,20,30],result:[-1,2,3],financingNeed:10},
  expanded:{label:'Тестовое расширение',tag:'Синтетические данные',revenue:[20,40,60],result:[1,4,6],financingNeed:20}
 };
 return fixture;
}
before(async()=>{
 site=JSON.parse(await read('content/site.json'));investor=JSON.parse(await read('content/investor.json'));
 await build('investor');await build('public');
 privateHtml=await read('dist-investor/index.html');publicHtml=await read('dist-public/index.html');
 templateHtml=renderPage(site,forecastFixture()).body;
 server=await startServer({root:join(ROOT,'dist-investor'),port:0});url=`http://127.0.0.1:${server.address().port}`;
});
after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));});
test('Исходники содержат только используемые данные проекта',()=>{
 assert.equal(investor.review.status,'not_included');
 assert.equal(investor.scenarios,undefined);assert.equal(investor.years,undefined);
 assert.equal(investor.review.summary,undefined);assert.deepEqual(investor.review.issues,[]);
});
test('Неиспользуемые прогнозы нельзя незаметно добавить в исходники',()=>{
 const data=forecastFixture();data.review.status='not_included';
 assert.throws(()=>validateContent(site,data));
});
test('Показан вклад инвестора, а не учредителей',()=>{assert.ok(privateHtml.includes('Долевой вклад инвестора'));assert.ok(!privateHtml.includes('Долевой вклад учредителей'));});
test('Источники и назначение средств сходятся',()=>{const f=investor.funding;assert.equal(f.equity+f.loan,47);assert.equal(f.paut+f.ectane+f.workingCapital,47);});
test('Отрицательный результат и десятичная запятая сохранены',()=>{assert.equal(formatNumber(-0.03),'−0,03');assert.ok(templateHtml.includes('class="negative">−1,00'));});
test('Единая нулевая шкала графика для обоих сценариев',()=>{assert.equal(revenueHeight(140),100);assert.equal(revenueHeight(0),0);assert.equal(revenueHeight(70),50);assert.equal((templateHtml.match(/data-scale="140"/g)||[]).length,6);});
test('Отрицательная выручка не рисуется через абсолютное значение',()=>assert.throws(()=>revenueHeight(-1)));
test('Недопустимые числа не проходят в диаграмму',()=>{for(const x of [NaN,Infinity,141])assert.throws(()=>revenueHeight(x));});
test('Ключевые условия не спрятаны в details',()=>{const alwaysVisible=templateHtml.replace(/<details[\s\S]*?<\/details>/g,'');for(const s of ['365 дней','90 дней','до процентов по займу'])assert.ok(alwaysVisible.includes(s));});
test('Уникальные id страницы',()=>{const ids=[...privateHtml.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);});
test('Все якоря ведут в существующий раздел',()=>{for(const m of privateHtml.matchAll(/href="#([^"]+)"/g))assert.ok(privateHtml.includes(`id="${m[1]}"`),m[1]);});
test('Команда ведёт к участникам, не стартовой программе',()=>assert.match(privateHtml,/<section id="team"[\s\S]*?Бабынин А\.В\./));
test('Служебная фраза о регистрации удалена',()=>{assert.ok(!privateHtml.includes('находится в стадии регистрации'));assert.ok(privateHtml.includes('Проект создания инженерной компании'));});
test('Ни ложной отправки формы, ни mailto-заглушки',()=>{assert.ok(!privateHtml.includes('mailto:[email]'));assert.ok(!privateHtml.includes('<form'));});
test('Контакты можно задать без изменения шаблона',()=>{const data=structuredClone(site);data.contact.email='project@example.com';data.contact.phone='+7 (900) 123-45-67';const html=renderPage(data,investor).body;assert.ok(html.includes('mailto:project@example.com'));assert.ok(html.includes('tel:+79001234567'));});
test('Контакты с HTML/JS отвергаются',()=>{const data=structuredClone(site);data.contact.email='javascript:alert(1)';assert.throws(()=>renderPage(data,investor));});
test('Пользовательские строки экранируются',()=>assert.equal(escapeHtml('<script>"&\''),'&lt;script&gt;&quot;&amp;&#39;'));
test('Несогласованная редакция отклоняется',()=>{const i=structuredClone(investor);i.sourceRevision='01.01.2000';assert.throws(()=>validateContent(site,i));});
test('Неполные финансовые массивы отклоняются',()=>{const i=forecastFixture();i.scenarios.base.revenue.pop();assert.throws(()=>validateContent(site,i));});
test('В публичном HTML нет инвесторских разделов или значений',()=>{for(const x of ['id="economics"','id="financing"','121,87','92,68','47,50','Долевой вклад','Заём инвестора','40%','Сахалин-1','ТШО','29 страниц'])assert.ok(!publicHtml.includes(x),x);});
test('В публичной сборке нет PDF, исходников и финансового JSON',async()=>{const paths=await readdir(join(ROOT,'dist-public'),{recursive:true});assert.ok(!paths.some(x=>/\.pdf$|investor\.json|\.tsx$|\.xlsx$|^reference|^content|^private-assets/.test(x)));});
test('Общий клиентский код не содержит финансовых значений',async()=>{const js=await read('dist-public/assets/app.js');assert.ok(!/92\.68|121\.87|47\.50|31\.57/.test(js));});
test('Индексирование по умолчанию выключено в обеих редакциях',async()=>{for(const h of [privateHtml,publicHtml])assert.ok(h.includes('content="noindex,nofollow"'));assert.match(await read('dist-public/robots.txt'),/Disallow: \//);});
test('Нет зависимости от Figma, CDN или внешних шрифтов',async()=>{const combined=privateHtml+await read('dist-investor/assets/styles.css')+await read('dist-investor/assets/app.js');assert.ok(!/https?:\/\//.test(combined));assert.ok(!combined.includes('.figma/make/site.json'));});
test('Утверждённая монограмма используется байт-в-байт',async()=>assert.equal(hash(await readFile(join(ROOT,'assets/ais-monogram.png'))),hash(await readFile(join(ROOT,'dist-investor/assets/ais-monogram.png')))));
test('Ресурсы используют относительные пути для подкаталога Pages',()=>{const links=[...privateHtml.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>m[1]);assert.ok(!links.some(x=>x.startsWith('/')));});
test('CSP отключает соединения и серверную отправку',()=>{assert.ok(privateHtml.includes("connect-src &#39;none&#39;"));assert.ok(privateHtml.includes("form-action &#39;none&#39;"));});
test('Локальный сервер выдаёт страницу',async()=>{const r=await fetch(url);assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/text\/html/);});
test('Локальный сервер не обслуживает исходники',async()=>{assert.equal((await fetch(url+'/content/investor.json')).status,404);});
test('Локальный сервер не принимает формы',async()=>assert.equal((await fetch(url,{method:'POST',body:'x'})).status,405));
test('Обход корня, скрытые файлы и некорректные пути блокируются',()=>{for(const p of ['/../content/site.json','/%2e%2e/secret','/.git/config','/%00','/%gg','/foo\\bar'])assert.equal(safePath('/site',p),null);});
test('Манифест честно указывает отсутствие аутентификации',async()=>assert.equal(JSON.parse(await read('dist-investor/build-manifest.json')).authentication,false));
test('Сборка воспроизводима',async()=>{const before=await read('dist-public/build-manifest.json');await build('public');assert.equal(await read('dist-public/build-manifest.json'),before);});
test('Невалидный режим сборки не пишет файлы',async()=>await assert.rejects(()=>build('private')));

test('На странице новые суммы без служебных комментариев и старого прогноза',()=>{
 for(const x of ['47 млн ₽','Долевой вклад инвестора','Заём инвестора','Два комплекта SIUI SyncScan 3'])assert.ok(privateHtml.includes(x),x);
 for(const html of [privateHtml,publicHtml])for(const x of ['сверк','черновик','DOCX','Excel','пока не указаны','пока не согласовано','исходный пакет','id="economics"','31,57','37,65','47,50','52,50','15 млн ₽','42 млн ₽'])assert.ok(!html.toLowerCase().includes(x.toLowerCase()),x);
 assert.ok(!privateHtml.includes('data-open-materials>'));
});
test('Включение прогнозного раздела без данных не проходит',()=>{
 const data=structuredClone(investor);data.review.status='approved';assert.throws(()=>renderPage(site,data));
});
test('Новые услуги сохраняют применимость и границы ЭПБ',()=>{
 for(const html of [privateHtml,publicHtml]) for(const text of ['репрезентативные точки','собственная технологическая процедура','Применимость процедуры','Самостоятельная ЭПБ не входит','ВТД теплообменников','DROPS']) assert.ok(html.includes(text),text);
});
test('Частные каналы находятся только в инвесторской версии',async()=>{
 const publicFiles=await readdir(join(ROOT,'dist-public'),{recursive:true,withFileTypes:true});
 const allPublic=(await Promise.all(publicFiles.filter(x=>x.isFile()&&!x.name.endsWith('.png')).map(x=>readFile(join(x.parentPath,x.name),'utf8')))).join('\n');
 for(const text of ['NCOC','Павлодарский','HSE Services','West Control Service','ARISE','ТЕХИНКОМ']){
  assert.ok(privateHtml.includes(text));assert.ok(!allPublic.includes(text),text);
 }
 for(const text of ['needs_model_review','Долевой вклад','Заём инвестора','47 млн','52,50','31,57','40%','application/pdf','JVBER'])assert.ok(!allPublic.includes(text),text);
});
test('Без утверждённого приложения нет старого PDF или фиктивной ссылки',async()=>{
 assert.equal(investor.attachment,null);
 assert.ok(!/href="[^"]*\.pdf|href="data:application\/pdf|download=/.test(privateHtml));
 assert.ok(!privateHtml.includes('<dialog'));
 assert.ok(!privateHtml.includes('Статус материалов'));
 assert.ok(!(await readdir(join(ROOT,'dist-investor'),{recursive:true})).some(x=>/\.pdf$/.test(x)));
 assert.equal((await fetch(url+'/documents/ais-first-meeting-2026-09-12.pdf')).status,404);
});
test('Обе standalone версии собираются без документов',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'ais-standalone-test-'));
 try{for(const kind of ['investor','public']){
  const file=join(dir,kind+'.html');await standalone(kind,file);
  const html=await readFile(file,'utf8');assert.ok(!html.includes('data:application/pdf'));assert.ok(!html.includes('ais-first-meeting-2026-09-12.pdf'));
  assert.ok(html.includes('data:image/png;base64,'));
 }}finally{await rm(dir,{recursive:true,force:true});}
});
test('Приложение требует явного согласования версии, пути и хеша',async()=>{
 assert.equal(await loadAttachment(investor,'/path/that/does/not/exist'),null);
 const dir=await mkdtemp(join(tmpdir(),'ais-attachment-test-'));
 const bytes=Buffer.from('%PDF-1.4\nApproved fixture\n%%EOF');
 const spec={approved:true,revision:investor.sourceRevision,fileName:'approved.pdf',sha256:hash(bytes)};
 const data=a=>({...investor,attachment:a});
 try{
  await mkdir(join(dir,'private-assets'));await writeFile(join(dir,'private-assets/approved.pdf'),bytes);
  const actual=await loadAttachment(data(spec),dir);assert.deepEqual(actual.bytes,bytes);
  assert.ok(renderPage(site,investor,{attachment:actual}).body.includes('download="approved.pdf"'));
  for(const patch of [{approved:false},{revision:'old'},{sha256:'0'.repeat(64)},{fileName:'../approved.pdf'},{fileName:'/approved.pdf'},{fileName:'missing.pdf'}])await assert.rejects(()=>loadAttachment(data({...spec,...patch}),dir));
  await writeFile(join(dir,'outside.pdf'),bytes);await symlink(join(dir,'outside.pdf'),join(dir,'private-assets/escape.pdf'));
  await assert.rejects(()=>loadAttachment(data({...spec,fileName:'escape.pdf'}),dir));
  await writeFile(join(dir,'private-assets/approved.pdf'),'not a PDF');
  await assert.rejects(()=>loadAttachment(data({...spec,sha256:hash('not a PDF')}),dir));
 }finally{await rm(dir,{recursive:true,force:true});}
});


test('Pages публикует принятый лендинг в корне и сохраняет выданную ссылку',async()=>{
 const output=await buildPages();
 const entries=await readdir(output,{recursive:true,withFileTypes:true});
 const actual=entries.filter(x=>x.isFile()).map(x=>join(x.parentPath,x.name).slice(output.length+1)).sort();
 const files=['.nojekyll','404.html','index.html','robots.txt','assets/styles.css','assets/app.js','assets/ais-monogram.png'];
 assert.deepEqual(actual,[...files,...files.map(x=>'dist-investor/'+x)].sort());
 for(const prefix of ['', 'dist-investor/']) {
  const html=await readFile(join(output,prefix,'index.html'),'utf8');
  assert.equal(html,privateHtml);
  assert.ok(html.includes('id="financing"'));assert.ok(html.includes('47 млн ₽'));
  assert.ok(html.includes('href="tel:+79841803640"'));
  assert.ok(html.includes('href="mailto:babynin.home@gmail.com"'));
 }
});
