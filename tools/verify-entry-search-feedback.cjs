const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:1280,height:800}});
 await p.goto('http://localhost:4100/');await p.locator('.title-entry-enter').click();
 await p.waitForSelector('.title-entry-exiting');assert.equal(await p.locator('.title-entry-loading').count(),0);
 await p.waitForURL('**/live/');await p.waitForFunction(()=>!document.querySelector('.title-entry-route-veil'));
 await p.locator('.live-menu-reading').click();await p.waitForSelector('#song-preview .read-start');
 const form=p.locator('.song-search'),button=form.locator('button'),color=()=>form.evaluate(e=>getComputedStyle(e).backgroundColor);
 await p.mouse.move(0,400);const base=await color();const btn=await button.evaluate(e=>getComputedStyle(e).backgroundColor);
 await form.locator('input').hover();await p.waitForTimeout(200);assert.equal(await color(),base);
 await form.locator('input').focus();await p.waitForTimeout(200);assert.equal(await color(),base);
 await button.hover();await p.waitForTimeout(200);assert.equal(await color(),base);assert.notEqual(await button.evaluate(e=>getComputedStyle(e).backgroundColor),btn);
 await p.screenshot({path:'pjskapk/analysis-6.8.1/search-button-only.png'});
 console.log('PASS no entering label; search form unchanged on hover/focus, button alone changes');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
