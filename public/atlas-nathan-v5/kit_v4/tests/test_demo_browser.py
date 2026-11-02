from playwright.sync_api import sync_playwright
from pathlib import Path
import threading, http.server, socketserver, functools
p=Path(__file__).resolve().parents[1]
handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(p))
server=socketserver.TCPServer(('127.0.0.1',0),handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1280,'height':900},device_scale_factor=1)
 errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.goto(f'http://127.0.0.1:{server.server_address[1]}/demo.html')
 page.screenshot(path=str(p/'previews/demo-desktop.png'),full_page=True)
 assert page.locator('.stage img').count()==2
 page.get_by_text('WPI · 19 regiões').first.click()
 assert page.locator('.zone').count()==19
 page.locator('.zone').first.click()
 assert '1' in page.locator('#summary').inner_text()
 page.get_by_text('DAS28 · 28 articulações').first.click()
 assert page.locator('.joint').count()==28
 page.locator('.joint').first.click()
 assert '1' in page.locator('#summary').inner_text()
 page.get_by_text('Edema',exact=True).last.click()
 page.locator('.joint').first.click()
 assert '1' in page.locator('#summary').inner_text()
 page.get_by_text('Artrite psoriásica').first.click()
 assert page.locator('.stage img').count()==6
 page.set_viewport_size({'width':390,'height':844})
 page.screenshot(path=str(p/'previews/demo-mobile.png'),full_page=True)
 assert not errs,errs
 print('Browser OK, screens:',p/'previews')
 browser.close()
