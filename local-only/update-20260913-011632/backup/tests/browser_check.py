"""Browser QA of the exact standalone builds; no network navigation or policy bypass.
Requires Python 3.10+, Playwright and Chromium. Does not publish or contact third parties.
"""
from pathlib import Path
from hashlib import sha256
import argparse, json, subprocess, tempfile
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--browser', default=None, help='Optional Chromium executable path')
parser.add_argument('--out', default=str(ROOT / 'qa-output'))
args = parser.parse_args()
out = Path(args.out).resolve(); out.mkdir(parents=True, exist_ok=True)
results = []
def record(name, details=None):
    results.append({'name': name, 'status': 'PASS', 'details': details})
def check(condition, message):
    if not condition: raise AssertionError(message)

with tempfile.TemporaryDirectory(prefix='ais-browser-') as temp:
    temp = Path(temp)
    script = "import {standalone} from './scripts/build.mjs'; await standalone('investor',process.argv[1]); await standalone('public',process.argv[2]);"
    subprocess.run(['node','--input-type=module','-e',script,str(temp/'investor.html'),str(temp/'public.html')],cwd=ROOT,check=True)
    htmls={kind:(temp/f'{kind}.html').read_text() for kind in ['investor','public']}
    with sync_playwright() as p:
        launch={'headless':True}
        if args.browser: launch['executable_path']=args.browser
        browser=p.chromium.launch(**launch)
        version=browser.version
        for kind in ['investor','public']:
            for width,height in [(1440,1000),(1024,900),(768,1024),(390,844),(360,800),(320,720)]:
                page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
                errors=[]; outbound=[]
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.on('request',lambda request:outbound.append(request.url) if request.url.startswith(('http:','https:')) else None)
                page.emulate_media(reduced_motion='reduce')
                page.set_content(htmls[kind],wait_until='load')
                check(page.locator('html').get_attribute('lang')=='ru','language')
                widths=page.evaluate('({viewport:innerWidth,scroll:document.documentElement.scrollWidth})')
                check(widths['scroll']<=width+1,f'overflow: {kind} / {width}: {widths}')
                check(not errors, f'JavaScript errors: {errors}')
                check(not outbound,f'External requests: {outbound}')
                check(page.evaluate("getComputedStyle(document.documentElement).scrollBehavior")=='auto','Reduced motion ignored')
                check(page.locator('h1').count()==1,'h1 count')
                images=page.locator('img').evaluate_all('(items)=>items.every(i=>i.complete && i.naturalWidth>0)')
                check(images,'Logo failed to load')
                if kind=='investor' and width in [1440,390]:
                    page.screenshot(path=str(out/f'hero-{width}.png'))
                    page.screenshot(path=str(out/f'page-{width}.png'),full_page=True)
                record(f'{kind}: layout {width}px',{'horizontalOverflow':False,'pageErrors':errors,'externalRequests':outbound})
                page.close()
        page=browser.new_page(viewport={'width':1440,'height':1000})
        page.emulate_media(reduced_motion='reduce')
        page.set_content(htmls['investor'],wait_until='load')
        expect(page.locator('#scenario-base')).to_be_visible()
        expect(page.locator('#scenario-expanded')).to_be_hidden()
        expect(page.locator('#scenario-base .negative')).to_have_text('−0,03')
        record('Base scenario and negative result')
        page.get_by_role('tab',name='С шестью инженерами',exact=True).click()
        expect(page.locator('#scenario-expanded')).to_be_visible()
        expect(page.locator('#scenario-base')).to_be_hidden()
        expect(page.locator('#scenario-expanded .liquidity-summary strong')).to_contain_text('47,50')
        record('Expanded scenario changes table and funding requirement')
        page.get_by_role('tab',name='С шестью инженерами',exact=True).press('ArrowLeft')
        expect(page.locator('#tab-base')).to_be_focused()
        expect(page.locator('#scenario-base')).to_be_visible()
        record('Keyboard tabs / roving focus')
        check(page.locator('.assumptions').is_visible(),'Assumptions not visible')
        check(not page.locator('details').first.get_attribute('open'),'details default')
        record('Essential assumptions visible while disclosure collapsed')
        page.locator('#economics').screenshot(path=str(out/'economics-1440.png'))
        page.locator('#services').screenshot(path=str(out/'services-1440.png'))
        page.locator('#financing').screenshot(path=str(out/'financing-1440.png'))
        summary=page.locator('#financing summary')
        summary.click()
        check(page.locator('#financing details').evaluate('(e)=>e.open'),'disclosure not opened')
        record('Native financing disclosure')
        trigger=page.locator('[data-open-materials]')
        trigger.click()
        dialog=page.locator('#materials-dialog')
        expect(dialog).to_be_visible()
        expect(page.locator('[data-close-materials]')).to_be_focused()
        for _ in range(6):
            page.keyboard.press('Tab')
            check(page.evaluate("Boolean(document.activeElement.closest('#materials-dialog'))"),'Focus escaped modal')
        record('Native modal and focus containment')
        with page.expect_download() as info:
            page.locator('#materials-dialog a[download]').click()
        download=info.value
        check(download.suggested_filename=='AIS_First_Meeting_2026-09-12.pdf','PDF filename')
        data=Path(download.path()).read_bytes()
        expected=(ROOT/'private-assets/ais-first-meeting-2026-09-12.pdf').read_bytes()
        check(sha256(data).digest()==sha256(expected).digest(),'Downloaded PDF changed')
        record('PDF download and SHA-256 identity')
        page.keyboard.press('Escape')
        expect(dialog).not_to_be_visible()
        expect(trigger).to_be_focused()
        record('Modal Escape and focus return')
        page.set_viewport_size({'width':390,'height':844})
        page.evaluate('window.scrollTo(0,0)')
        menu=page.locator('.menu-toggle');menu.click()
        expect(menu).to_have_attribute('aria-expanded','true')
        page.keyboard.press('Escape')
        expect(menu).to_have_attribute('aria-expanded','false')
        expect(menu).to_be_focused()
        record('Mobile menu Escape')
        menu.click()
        page.locator('#mobile-navigation a[href="#team"]').click()
        expect(menu).to_have_attribute('aria-expanded','false')
        page.wait_for_timeout(100)
        metrics=page.evaluate("({top:document.querySelector('#team-title').getBoundingClientRect().top,header:document.querySelector('.header-inner').getBoundingClientRect().bottom})")
        check(metrics['top']>=metrics['header']-1,f'Anchor covered: {metrics}')
        expect(page.locator('#mobile-navigation a[href="#team"]')).to_have_attribute('aria-current','location')
        record('Mobile anchor targets team; heading not under header',metrics)
        page.locator('#economics').screenshot(path=str(out/'economics-390.png'))
        page.locator('#financing').screenshot(path=str(out/'financing-390.png'))
        scroller=page.locator('#scenario-base .table-scroll')
        check(scroller.evaluate('(e)=>e.scrollWidth>e.clientWidth'),'Expected table-level scroll')
        scroller.evaluate('(e)=>e.scrollLeft=e.scrollWidth')
        check(scroller.evaluate('(e)=>e.scrollLeft>0'),'Table does not scroll')
        record('Horizontal scrolling restricted to financial table')
        page.emulate_media(media='print')
        page.evaluate("window.dispatchEvent(new Event('beforeprint'))")
        expect(page.locator('#scenario-base')).to_be_visible();expect(page.locator('#scenario-expanded')).to_be_visible()
        check(page.locator('details').evaluate_all('(items)=>items.every(d=>d.open)'),'Print omitted details')
        record('Print: both scenarios and expanded caveats')
        page.close()
        ctx=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
        page=ctx.new_page();page.set_content(htmls['investor'],wait_until='load')
        expect(page.locator('#scenario-base')).to_be_visible();expect(page.locator('#scenario-expanded')).to_be_visible()
        check(page.locator('a[download]').count()>0,'PDF fallback absent')
        check(page.evaluate("getComputedStyle(document.querySelector('.site-header')).position")=='static','NoJS nav overlaps hero')
        record('No-JavaScript fallback: content, both scenarios and materials')
        ctx.close();browser.close()
report={'status':'PASS','browser':'Chromium '+version,'loading':'Exact standalone HTML via page.set_content; no network navigation','checks':results,'notTested':['Published URL / GitHub Pages','Safari and Firefox','Remote GitHub writes','Hosting authentication']}
(out/'browser-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':'PASS','browser':report['browser'],'checks':len(results),'report':str(out/'browser-results.json')},ensure_ascii=False))
