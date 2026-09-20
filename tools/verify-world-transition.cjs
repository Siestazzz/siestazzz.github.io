const {chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true});
 try{
 const p=await b.newPage({viewport:{width:1280,height:720}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:4100/map/');await p.waitForTimeout(1000);
 await p.screenshot({path:'pjskapk/analysis-6.8.1/map-up-review.png'});
 const button=p.locator('[data-enter-world="5"]');await button.click();await p.waitForTimeout(600);
 const state=await p.locator('.world-transfer-particles').evaluate(e=>({...e.dataset,white:getComputedStyle(e.parentNode,'::before').opacity}));
 console.log(state);assert(+state.visible>0);assert(+state.white>0);
 await p.screenshot({path:'pjskapk/analysis-6.8.1/transition-web-review.png'});
 await p.waitForURL('**/?world=5');await p.locator('.world-transfer').waitFor({state:'detached',timeout:15000});
 assert.deepEqual(errors,[]);console.log('PASS: single-click entry, particles, cover, arrival cleanup');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
