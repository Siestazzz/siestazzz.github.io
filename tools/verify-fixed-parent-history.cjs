const assert=require('node:assert/strict');
const{chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome',ignoreDefaultArgs:['--disable-back-forward-cache']});try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:4100/',{waitUntil:'domcontentloaded'});await page.waitForSelector('.unknown-scene[data-characters-ready=true]');
 const home=await page.evaluate(()=>navigation.currentEntry.key);
 await page.evaluate(()=>sekaiNavigate('/live/'));const live=await page.evaluate(()=>navigation.currentEntry.key);
 await page.evaluate(()=>sekaiNavigate('/search/?q=frida'));await page.waitForSelector('.song-row');const search=await page.evaluate(()=>navigation.currentEntry.key);
 await page.evaluate(()=>sekaiNavigate('/friends/'));
 await page.evaluate(()=>sekaiNavigate('/2026/08/09/android-root-frida-bypass/'));
 await page.evaluate(()=>{window.keptCanvas=document.querySelector('.home-characters canvas');});
 for(const [key,selector] of [[search,'#song-query'],[live,'.live-menu-reading'],[home,'.home-gacha']]){
   const start=Date.now();await page.locator('.game-back').click();await page.waitForFunction(key=>navigation.currentEntry.key===key,key);await page.waitForSelector(selector);
   assert(await page.evaluate(()=>window.keptCanvas===document.querySelector('.home-characters canvas')));console.log('parent restored',Date.now()-start+'ms');
 }
 // Direct entry: no matching parent exists. Soft fallback must still work.
 const direct=await browser.newPage();await direct.goto('http://localhost:4100/2026/08/09/android-root-frida-bypass/',{waitUntil:'domcontentloaded'});
 await direct.evaluate(()=>window.originalDocument=document);await direct.locator('.game-back').click();await direct.waitForSelector('#song-query');
 assert(await direct.evaluate(()=>window.originalDocument===document));
 assert.equal(new URL(direct.url()).pathname,'/search/');assert.deepEqual(errors,[]);
 console.log('PASS correct parent history keys, skip unrelated friends page, persistent canvas, direct-entry soft fallback');
 const cached=await browser.newPage();await cached.addInitScript(()=>addEventListener('pageshow',e=>window.restoredByBFCache=e.persisted));
 await cached.goto('http://localhost:4100/',{waitUntil:'domcontentloaded'});await cached.waitForSelector('.unknown-scene[data-characters-ready=true]');
 await cached.evaluate(()=>window.originalHome=123);
 await cached.goto('http://localhost:4100/live/',{waitUntil:'domcontentloaded'});await cached.waitForSelector('.unknown-scene[data-characters-ready=true]');
 await cached.locator('.game-back').click();await cached.waitForFunction(()=>location.pathname==='/'&&window.originalHome===123);
 assert(await cached.evaluate(()=>window.restoredByBFCache));console.log('PASS cross-document fixed parent restored actual BFCache document (persisted=true)');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
