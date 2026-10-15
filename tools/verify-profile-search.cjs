const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage();await p.goto('http://localhost:4100/about/');
 assert.equal(await p.locator('.profile-copy>strong').innerText(),'Reverse/Mobile/Agent');
 assert.equal((await p.locator('.profile-message').innerText()).trim(),'这个人很懒');
 assert.equal(await p.locator('.profile-stats>span').count(),2);
 assert(await p.locator('.profile-stats b').evaluateAll(es=>es.every(e=>getComputedStyle(e).color==='rgb(19, 157, 145)')));
 assert(await p.locator('.profile-message p').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=19));
 await p.goto('http://localhost:4100/search/');await p.waitForSelector('.song-row');
 const covers=await p.evaluate(async()=>await(await fetch('/search.json')).json());assert.equal(covers.length,10);assert(covers.every(p=>p.cover.endsWith('.webp')));
 const form=p.locator('.song-search'),button=form.locator('button');const bg=await form.evaluate(e=>getComputedStyle(e).backgroundColor);
 await button.hover();await p.waitForTimeout(200);assert.equal(await form.evaluate(e=>getComputedStyle(e).backgroundColor),bg);
 assert.equal(await button.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(51, 204, 187)');
 await p.locator('#song-query').fill('不存在的文章关键词');await p.waitForSelector('.empty-selection');
 console.log('PASS profile text/count/green/font, ten WebP covers, search filter and button-only hover. No screenshots.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
