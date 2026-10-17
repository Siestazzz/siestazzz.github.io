const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const posts=JSON.parse(fs.readFileSync('public/search.json','utf8'));
 for(const p of posts)for(const c of p.categories)assert.ok(p.tags.includes(c),p.statsId+' missing '+c);
 for(const id of ['tenda-ac6-vulnerability','allsafe-android-writeup','android-binder-calling-identity','qwb-s9-qcalc'])assert.ok(posts.find(p=>p.statsId===id).tags.includes('漏洞挖掘'));
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto('http://localhost:4100/2025/05/08/tenda-ac6-vulnerability/');
  const p=page.locator('.article-content p').first();
  assert.equal(await p.evaluate(e=>getComputedStyle(e).cursor),'text');
  assert.equal(await page.locator('.game-back').evaluate(e=>getComputedStyle(e).cursor),'pointer');
  const selected=await p.evaluate(e=>{
   const range=document.createRange();range.selectNodeContents(e);const s=getSelection();s.removeAllRanges();s.addRange(range);
   const css=getComputedStyle(e,'::selection');return {text:s.toString(),bg:css.backgroundColor,color:css.color};
  });
  assert.ok(selected.text.length>0);assert.equal(selected.bg,'rgba(156, 232, 223, 0.5)');assert.equal(selected.color,'rgb(48, 50, 79)');
  assert.equal(await page.locator('.article-content a').first().evaluate(e=>getComputedStyle(e).borderBottomWidth),'0px');
  await page.screenshot({path:'backups/verification/text-selection.png'});
  console.log('All 11 main categories have matching tags; vulnerability tags, text/pointer cursors and selection colors passed.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
