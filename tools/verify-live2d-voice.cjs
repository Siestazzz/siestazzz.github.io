const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 for(const [key,r] of [['ichika',.05],['rin',.3],['len',.55],['miku',.8]]){
  const p=await b.newPage();await p.addInitScript(v=>{Math.random=()=>v;},r);
  await p.goto('http://localhost:4100/live/');await p.mouse.click(10,400);
  await p.waitForSelector('[data-live2d-host][data-ready=true]',{timeout:60000});
  const host=p.locator('[data-live2d-host]');assert.equal(await host.getAttribute('data-character'),key);
  const rows=await p.evaluate(async k=>(await(await fetch('/game-assets/live2d/'+k+'/talks.json')).json()).items,key);
  await p.waitForFunction(v=>sekaiAudio.state.lastVoice.endsWith('/'+v+'.ogg'),rows[0].voice);
  for(let i=1;i<3;i++){await p.locator('.live2d-talk').click();await p.waitForFunction(v=>sekaiAudio.state.lastVoice.endsWith('/'+v+'.ogg'),rows[i].voice);assert.equal(await host.getAttribute('data-talk-id'),String(rows[i].id));}
  await p.locator('.bgm-toggle').click();assert.equal(await p.evaluate(()=>sekaiAudio.state.voice),'');
  await p.locator('.live2d-talk').click();await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>sekaiAudio.state.voice),'');
  await p.locator('.bgm-toggle').click();await p.locator('.live2d-talk').click();
  await p.waitForFunction(v=>sekaiAudio.state.lastVoice.endsWith('/'+v+'.ogg'),rows[1].voice);
  await p.locator('.live-menu-reading').click();await p.waitForURL('**/search/**');assert.equal(await p.evaluate(()=>sekaiAudio.state.voice),'');
  await p.close();console.log('PASS original voice mapping, mute, replacement, unmount:',key);
 }
 const p=await b.newPage({viewport:{width:1280,height:800}});
 await p.goto('http://localhost:4100/search/');const tag=p.locator('.preview-tags a').first();await tag.waitFor();
 const before=await tag.evaluate(e=>getComputedStyle(e).backgroundColor);await tag.hover();await p.waitForTimeout(200);assert.notEqual(await tag.evaluate(e=>getComputedStyle(e).backgroundColor),before);
 const href=await tag.evaluate(e=>e.href);await tag.click();await p.waitForURL(href);
 await p.goto('http://localhost:4100/search/');const button=p.locator('.song-search button');const bg=await button.evaluate(e=>getComputedStyle(e).backgroundColor);await button.hover();await p.waitForTimeout(200);assert.notEqual(await button.evaluate(e=>getComputedStyle(e).backgroundColor),bg);
 await p.screenshot({path:'pjskapk/analysis-6.8.1/search-hover-review.png'});
 console.log('PASS preview tags direct navigation and search hover');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
