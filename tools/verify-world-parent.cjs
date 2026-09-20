const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:4100/?world=5');
 await page.waitForSelector('.unknown-scene[data-characters-ready=true]');
 await page.evaluate(()=>{window.keptDocument=document;window.keptScene=document.querySelector('.unknown-scene');window.keptCanvas=document.querySelector('.home-characters canvas');});
 await page.evaluate(()=>sekaiNavigate('/live/'));
 await page.evaluate(()=>sekaiNavigate('/search/'));await page.waitForSelector('.read-start');
 for(const size of [{width:1280,height:720},{width:1920,height:700},{width:699,height:842}]){
  await page.setViewportSize(size);await page.waitForTimeout(200);
  const result=await page.locator('.read-start').evaluate(el=>({height:el.offsetHeight,shrink:getComputedStyle(el).flexShrink}));
  assert.equal(result.height,80);assert.equal(result.shrink,'0');console.log(size,result);
 }
 await page.setViewportSize({width:1280,height:720});
 await page.locator('.read-start').scrollIntoViewIfNeeded();
 await page.screenshot({path:'pjskapk/analysis-6.8.1/search-button-fixed.png'});
 let documents=0;page.on('request',r=>{if(r.isNavigationRequest()&&r.frame()===page.mainFrame())documents++;});
 await page.locator('.game-back').click();await page.waitForSelector('.live-menu-reading');
 await page.locator('.game-back').click();await page.waitForSelector('.home-gacha');
 assert.equal(new URL(page.url()).search,'?world=5');
 assert(await page.evaluate(()=>window.keptDocument===document&&window.keptScene===document.querySelector('.unknown-scene')&&window.keptCanvas===document.querySelector('.home-characters canvas')));
 assert.equal(documents,0);assert.deepEqual(errors,[]);
 console.log('PASS search -> live -> same-world homepage, no document request, same canvas');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
