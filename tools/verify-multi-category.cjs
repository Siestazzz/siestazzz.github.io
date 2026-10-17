const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const posts=JSON.parse(fs.readFileSync('public/search.json','utf8'));
 assert.equal(posts.length,11);
 assert.equal(posts.find(p=>p.statsId==='ciscn-2024-reverse').date,'2024-05-23');
 assert.equal(posts.find(p=>p.statsId==='pixel-flashing').date,'2026-09-22');
 assert.ok(fs.readFileSync('public/2025/09/14/ciscn-2024-reverse/index.html','utf8').includes('/2024/05/23/ciscn-2024-reverse/'));
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  for(const category of ['CTF','Android','逆向工程','AI','漏洞挖掘','其他','']){
   await page.goto('http://localhost:4100/search/?category='+encodeURIComponent(category));
   await page.waitForFunction(()=>document.querySelector('.song-row')||document.querySelector('.empty-selection'));
   const expected=posts.filter(p=>!category||[...p.categories,...p.tags].some(n=>n.toLowerCase()===category.toLowerCase())).map(p=>p.path);
   assert.deepEqual(await page.locator('.song-row').evaluateAll(es=>es.map(e=>e.dataset.path)),expected);
   if(category==='Android')await page.screenshot({path:'backups/verification/category-android-inclusive.png'});
  }
  await page.goto('http://localhost:4100/2026/09/22/pixel-flashing/');
  await page.locator('.article-content img').first().waitFor();
  assert.ok(await page.locator('.article-content img').first().evaluate(e=>e.complete&&e.naturalWidth>0));
  console.log('11 posts, publication date, legacy redirect, all seven filters and Pixel image passed');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
