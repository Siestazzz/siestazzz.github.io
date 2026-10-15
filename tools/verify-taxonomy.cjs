const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
 const browser = await chromium.launch({channel:'chrome',headless:true});
 try {
  const page = await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  async function hoverAndNavigate(selector) {
   const link=page.locator(selector).first();
   const before=await link.evaluate(e=>getComputedStyle(e).backgroundColor);
   const href=await link.evaluate(e=>e.href);
   await link.hover(); await page.waitForTimeout(200);
   assert.notEqual(await link.evaluate(e=>getComputedStyle(e).backgroundColor),before);
   await link.click(); await page.waitForURL(href);
  }
  await page.goto('http://localhost:4100/tags/');
  await hoverAndNavigate('.tag-cloud a');
  await page.goto('http://localhost:4100/categories/');
  await page.locator('.collection-card').first().hover(); await page.waitForTimeout(200);
  await page.screenshot({path:'pjskapk/analysis-6.8.1/taxonomy-hover.png'});
  await page.mouse.move(0,0);await page.waitForTimeout(200);
  await hoverAndNavigate('.collection-card');
  const post='http://localhost:4100/2026/08/09/android-root-frida-bypass/';
  await page.goto(post); await hoverAndNavigate('.tag-stack a');
  await page.goto(post); await hoverAndNavigate('.reader-meta .reader-category-link');
  await page.goto(post); await hoverAndNavigate('.article-head .reader-category-link');
  await page.goto('http://localhost:4100/about/');
  const avatar=page.locator('.profile-avatar img');
  await avatar.evaluate(img=>img.decode());
  assert.equal(await avatar.evaluate(img=>img.naturalWidth),400);
  await page.screenshot({path:'pjskapk/analysis-6.8.1/profile-avatar-review.png'});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'pjskapk/analysis-6.8.1/profile-avatar-mobile.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS tag/category hover, single-click navigation, article links, local avatar decode; desktop/mobile screenshots');
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
