const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:1280,height:720}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:4100/');await p.waitForSelector('.live-menu-reading');
 assert.equal(await p.locator('.game-home,.map-globe,.sekai-map').count(),0);
 assert.equal(await p.locator('.game-back:visible').count(),0);
 const world=await p.evaluate(()=>document.documentElement.dataset.homeWorld);
 await p.reload();assert.equal(await p.evaluate(()=>document.documentElement.dataset.homeWorld),world);
 await p.waitForSelector('.unknown-scene[data-characters-ready=true]');
 await p.evaluate(()=>window.savedScene=document.querySelector('.unknown-scene'));
 await p.locator('.live-menu-reading').click();await p.waitForSelector('.song-row');
 await p.locator('.game-back').click();await p.waitForSelector('.live-menu-reading');
 assert.equal(new URL(p.url()).pathname,'/');assert(await p.evaluate(()=>savedScene===document.querySelector('.unknown-scene')));
 await p.screenshot({path:'pjskapk/analysis-6.8.1/random-entry-review.png'});
 await p.goto('http://localhost:4100/map/');assert.equal(await p.locator('.sekai-map').count(),0);await p.waitForSelector('.live-menu-reading');
 // Deterministic clock advance; cannot use real pagehide after editing timestamps (it refreshes lastSeen).
 await p.addInitScript(()=>{const now=Date.now;Date.now=()=>now()+31*60*1000;});
 await p.reload();const next=await p.evaluate(()=>document.documentElement.dataset.homeWorld);assert.notEqual(next,world);
 assert.deepEqual(errors,[]);console.log('PASS entry/legacy map, refresh stability, soft return, timeout switch',world,'->',next);
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
