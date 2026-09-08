const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.goto('http://localhost:4100/live/',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('.unknown-scene[data-characters-ready=true]');
 await page.evaluate(()=>{window.savedScene=document.querySelector('.unknown-scene');window.savedCanvas=document.querySelector('.home-characters canvas');window.documentMarker=123;});
 const startRequests=requests.length;
 async function go(path){const start=Date.now();await page.evaluate(path=>window.sekaiNavigate(path),path);assert.equal(await page.evaluate(()=>window.savedScene===document.querySelector('.unknown-scene')&&window.savedCanvas===document.querySelector('.home-characters canvas')&&window.documentMarker===123),true);console.log(path,Date.now()-start+'ms');}
 await page.locator('.live-menu-reading').click();await page.waitForSelector('.song-row');
 assert.equal(await page.evaluate(()=>window.documentMarker),123);
 await page.locator('#song-query').fill('frida');await page.locator('.read-start').click();await page.waitForSelector('.code-expand');
 await page.locator('.code-expand').first().click();assert.equal(await page.locator('.code-expand').first().getAttribute('aria-expanded'),'true');
 await page.evaluate(()=>window.scrollTo(0,0));await page.locator('.game-back').click();await page.waitForSelector('#song-query');assert.equal(await page.locator('#song-query').inputValue(),'frida');
 for(let i=0;i<3;i++){await go('/live/');await go('/search/');await go('/friends/');await go('/');}
 await page.locator('.home-live').click();await page.waitForSelector('.live-menu-reading');
 await page.goBack();await page.waitForSelector('.home-gacha');assert.equal(await page.evaluate(()=>window.documentMarker),123);
 await page.goForward();await page.waitForSelector('.live-menu-reading');
 await page.waitForTimeout(500);await page.screenshot({path:'pjskapk/router-live-review.png'});
 const initialAssets=new Set(requests.slice(0,startRequests));
 const reloaded=requests.slice(startRequests).filter(u=>initialAssets.has(u)&&/game-assets\/(characters|map)\//.test(u));assert.deepEqual(reloaded,[]);
 assert.deepEqual(errors,[]);console.log('PASS persistent scene/canvas, search restore, code toggle, 3 repeated cycles, history, no world resource refetch');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
