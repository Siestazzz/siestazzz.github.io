const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage();
  for(const width of [1440,1024,768,390]){
   await page.setViewportSize({width,height:900});
   await page.goto('http://localhost:4100/search/');
   await page.locator('.song-row').first().waitFor();
   assert.equal(await page.locator('.topbar .game-stat').count(),3);
   assert.equal(await page.locator('.game-stat-rank small').textContent(),'访客数');
   assert.equal(await page.locator('.stat-battery').evaluate(e=>e.complete&&e.naturalWidth>0),true);
   const boxes=await page.locator('.topbar .game-stat,.topbar .menu-toggle').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}}));
   boxes.forEach((b,i)=>{assert.ok(b.left>=0&&b.right<=width);if(i)assert.ok(b.left>=boxes[i-1].right)});
   const search=await page.locator('.song-search').boundingBox();
   if(width>700)assert.ok(search.x+search.width<=boxes[0].left,JSON.stringify({width,search,boxes}));
   await page.screenshot({path:`backups/verification/header-${width}.png`});
  }
  await page.setViewportSize({width:1440,height:900});
  await page.goto('http://localhost:4100/');
  await page.waitForFunction(()=>{const v=document.querySelector('.title-entry-movie');return v&&v.readyState>=2&&v.currentTime>1},null,{timeout:60000});
  assert.equal(await page.locator('.title-entry-art').evaluateAll(es=>es.every(e=>e.src.endsWith('.webp')&&e.complete&&e.naturalWidth>0)),true);
  await page.screenshot({path:'backups/verification/entry-compressed.png'});
  console.log('Header positions, battery, WebP layers and video playback passed');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
