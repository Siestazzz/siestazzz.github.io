const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
 const page=await browser.newPage();
 await page.clock.install();
 let events=[];
 await page.route('**/*',async route=>{
   if(route.request().url().startsWith('https://stats.test/')){
     const event=route.request().postDataJSON(); if(event)events.push(event);
     return route.fulfill({contentType:'application/json',body:JSON.stringify(event?{accepted:true}:{reads:7,visits:9,articles:{'test-post':3}})});
   }
   return route.fulfill({contentType:'text/html',body:'<script id="sekai-statistics" data-endpoint="https://stats.test" data-origin="https://siestazzz.github.io"></script><b data-total-views>—</b><article data-stats-article="test-post"><span data-post-views="test-post">—</span></article>'});
 });
 const setup=async url=>{
   await page.goto(url);
   await page.evaluate(()=>{window.disposers=[];window.SekaiPages={register(name,fn){window.mountStats=fn;window.mount=()=>fn({listen:(target,type,listener)=>{target.addEventListener(type,listener);disposers.push(()=>target.removeEventListener(type,listener));},cleanup:fn=>disposers.push(fn)});window.mount();}};});
   await page.addScriptTag({content:fs.readFileSync('themes/sekai-next/source/js/statistics.js','utf8')});
 };
 await setup('https://siestazzz.github.io/article/');
 await page.waitForFunction(()=>document.querySelector('[data-total-views]').textContent==='7');
 assert.equal(events.filter(e=>e.kind==='visit').length,1);
 assert.equal(await page.locator('[data-post-views]').textContent(),'3');
 await page.clock.runFor(29000);
 assert.equal(events.filter(e=>e.kind==='read').length,0);
 // Simulate soft-navigation unmount before threshold: old article must not count.
 await page.evaluate(()=>{disposers.splice(0).forEach(fn=>fn());document.querySelector('article').remove();mount();});
 await page.clock.runFor(30100);
 assert.equal(events.filter(e=>e.kind==='read').length,0);
 await page.evaluate(()=>{disposers.splice(0).forEach(fn=>fn());document.body.insertAdjacentHTML('beforeend','<article data-stats-article="test-post"></article>');mount();});
 await page.clock.runFor(30100);
 await page.waitForTimeout(100);
 assert.equal(events.filter(e=>e.kind==='read').length,1);
 await page.evaluate(()=>{disposers.splice(0).forEach(fn=>fn());mount();});
 await page.clock.runFor(30100);
 assert.equal(events.filter(e=>e.kind==='read').length,1);
 const visitTime=await page.evaluate(()=>Number(localStorage.getItem('sekai-stats-event:visit:site')));
 await page.clock.setFixedTime(new Date(visitTime+365*86400000-1));
 await setup('https://siestazzz.github.io/article/');
 await page.waitForFunction(()=>document.querySelector('[data-total-views]').textContent==='7');
 assert.equal(events.filter(e=>e.kind==='visit').length,1);
 await page.clock.setFixedTime(new Date(visitTime+365*86400000));
 await setup('https://siestazzz.github.io/article/');
 await page.waitForFunction(()=>document.querySelector('[data-total-views]').textContent==='7');
 assert.equal(events.filter(e=>e.kind==='visit').length,2);
 const before=events.length;
 await setup('http://localhost:4100/article/');
 await page.clock.runFor(30100);
 assert.equal(events.length,before);
 assert.equal(await page.locator('[data-total-views]').textContent(),'—');
 console.log('PASS: Chromium fixture: no read at 29s, read at 30s, soft-navigation cleanup, dedup, localhost disabled. No production requests.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
