"""Check AIS standalone pages using an optional local Playwright installation.
No publication, external navigation or changes to source documents.
"""
from pathlib import Path
import argparse
import json
import subprocess
import tempfile
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--browser', default=None)
parser.add_argument('--out', default=str(ROOT / 'qa-output'))
args = parser.parse_args()
out = Path(args.out).resolve()
out.mkdir(parents=True, exist_ok=True)
results = []

def check(condition, name):
    if not condition:
        raise AssertionError(name)
    results.append(name)

with tempfile.TemporaryDirectory(prefix='ais-browser-') as directory:
    temp = Path(directory)
    script = "import {standalone} from './scripts/build.mjs'; await standalone('investor',process.argv[1]); await standalone('public',process.argv[2]);"
    subprocess.run(['node', '--input-type=module', '-e', script, str(temp/'investor.html'), str(temp/'public.html')], cwd=ROOT, check=True)
    htmls = {kind: (temp/f'{kind}.html').read_text() for kind in ['investor', 'public']}
    with sync_playwright() as p:
        launch = {'headless': True}
        if args.browser:
            launch['executable_path'] = args.browser
        browser = p.chromium.launch(**launch)
        version = browser.version
        for kind in htmls:
            for width, height in [(1440,1000),(768,1024),(390,844),(320,720)]:
                page = browser.new_page(viewport={'width':width,'height':height})
                errors, external = [], []
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.on('request', lambda request: external.append(request.url) if request.url.startswith(('http:', 'https:')) else None)
                page.emulate_media(reduced_motion='reduce')
                page.set_content(htmls[kind], wait_until='load')
                check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{kind} {width}px: no overflow')
                check(page.locator('h1').count() == 1, f'{kind} {width}px: heading')
                check(page.locator('img').evaluate_all('(images)=>images.every(i=>i.complete&&i.naturalWidth>0)'), f'{kind} {width}px: logo')
                check(not errors and not external, f'{kind} {width}px: no page errors or external requests')
                check(not any(term in page.inner_text('body').lower() for term in ['сверк','черновик','docx','excel','пока не указаны','пока не согласовано']), f'{kind} {width}px: no internal commentary')
                if kind == 'investor':
                    expect(page.locator('#financing-title')).to_contain_text('47 млн ₽')
                    check(page.locator('#economics').count() == 0, 'Previous forecast is not displayed')
                    check(page.locator('button[data-open-materials]').count() == 0, 'No materials placeholder')
                else:
                    check(page.locator('#financing,#economics,#projects').count() == 0, 'Public edition excludes private sections')
                page.screenshot(path=str(out/f'{kind}-{width}.png'), full_page=True)
                page.close()
        page = browser.new_page(viewport={'width':390,'height':844})
        page.emulate_media(reduced_motion='reduce')
        page.set_content(htmls['investor'], wait_until='load')
        menu = page.locator('.menu-toggle')
        menu.click()
        expect(menu).to_have_attribute('aria-expanded', 'true')
        page.keyboard.press('Escape')
        expect(menu).to_have_attribute('aria-expanded', 'false')
        expect(menu).to_be_focused()
        menu.click()
        page.locator('#mobile-navigation a[href="#team"]').click()
        expect(menu).to_have_attribute('aria-expanded', 'false')
        expect(page.locator('#team-title')).to_be_focused()
        check(page.evaluate("document.querySelector('#team-title').getBoundingClientRect().top >= document.querySelector('.header-inner').getBoundingClientRect().bottom"), 'Team anchor clears header')
        page.locator('#financing summary').click()
        check(page.locator('#financing details').evaluate('(e)=>e.open'), 'Participation disclosure opens')
        page.locator('#financing').screenshot(path=str(out/'financing-390.png'))
        page.emulate_media(media='print')
        page.evaluate("window.dispatchEvent(new Event('beforeprint'))")
        check(page.locator('details').evaluate_all('(items)=>items.every(d=>d.open)'), 'Print includes participation conditions')
        page.pdf(path=str(out/'investor-print.pdf'), prefer_css_page_size=True, print_background=True)
        page.close()
        context = browser.new_context(java_script_enabled=False, viewport={'width':390,'height':844})
        page = context.new_page()
        page.set_content(htmls['investor'], wait_until='load')
        check(page.locator('#financing').is_visible(), 'NoJS financing visible')
        check(page.evaluate("getComputedStyle(document.querySelector('.site-header')).position") == 'static', 'NoJS navigation in document flow')
        check(page.locator('a[download]').count() == 0, 'NoJS has no obsolete attachment')
        context.close()
        browser.close()
report = {'status':'PASS','browser':'Chromium '+version,'checks':results,'notTested':['Published site','Hosting authentication','Safari and Firefox']}
(out/'browser-results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({'status':'PASS','checks':len(results),'report':str(out/'browser-results.json')},ensure_ascii=False))
