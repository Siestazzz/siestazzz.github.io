const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:1280,height:800}});
 await p.goto('http://localhost:4100/friends/');
 assert.equal(await p.locator('.friend-honors').count(),0);
 assert(await p.locator('.friends-comment').evaluateAll(es=>es.every(e=>e.textContent.trim()==='暂未填写个人描述')));
 await p.locator('.friends-online').first().hover();
 assert.equal(await p.locator('.friends-online').first().evaluate(e=>getComputedStyle(e).cursor),'pointer');
 await p.screenshot({path:'pjskapk/analysis-6.8.1/friends-list-20261013.png'});
 await p.locator('[data-friends-tab=exchange]').click();
 assert.equal(await p.locator('#friends-exchange-panel').evaluate(e=>getComputedStyle(e).borderTopLeftRadius),'12px');
 assert(await p.locator('#friends-own-card').isVisible());
 await p.screenshot({path:'pjskapk/analysis-6.8.1/friends-exchange-20261013.png'});
 await p.setViewportSize({width:390,height:844});
 await p.screenshot({path:'pjskapk/analysis-6.8.1/friends-exchange-mobile-20261013.png'});
 console.log('PASS pointer, descriptions, honors unmounted, rounded exchange panel, desktop/mobile screenshots');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
