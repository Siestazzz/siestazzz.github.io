const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const posts=JSON.parse(fs.readFileSync('public/search.json','utf8'));
 assert.ok(posts.every(p=>!('cover' in p)));
 assert.ok(!fs.existsSync('public/images/post-covers'));
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const covers=[],errors=[];
  page.on('request',r=>{if(/post-covers|wallpaper-/.test(r.url()))covers.push(r.url());});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:4100/search/',{waitUntil:'domcontentloaded'});
  await page.locator('.song-row').first().waitFor();
  assert.equal(await page.locator('.song-thumb,.jacket,.phone-jacket-wash').count(),0);
  await page.locator('.song-row').nth(1).click();
  assert.ok(await page.locator('#song-preview h1').textContent());
  fs.mkdirSync('backups/verification',{recursive:true});
  await page.screenshot({path:'backups/verification/no-covers-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'backups/verification/no-covers-mobile.png'});
  assert.deepEqual(covers,[]);assert.deepEqual(errors,[]);
  console.log('PASS: no cover fields/files/DOM/network requests; selection works; desktop/mobile screenshots saved.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
