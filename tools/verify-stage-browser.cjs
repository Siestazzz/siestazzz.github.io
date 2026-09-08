const {chromium}=require(process.env.SEKAI_NODE_DEPS+'/playwright');
const assert=require('node:assert/strict');
const world=process.argv.find(v=>v.startsWith('--world='))?.split('=')[1]||(process.argv.includes('--classroom')?'5':'7');
const fs=require('node:fs'),base='public/game-assets/map/area'+world+'/';
const sceneData=JSON.parse(fs.readFileSync(base+'scene.json')),itemsData=JSON.parse(fs.readFileSync(base+'items.json')),fxData=JSON.parse(fs.readFileSync(base+'effects.json'));
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:4100/map/');
  await page.locator('[data-enter-world="'+world+'"]').click();
  assert(page.url().endsWith('/map/'));
  await page.waitForFunction(()=>document.querySelector('.sekai-map').dataset.rotating!=='true');
  assert.equal(await page.locator('[data-enter-world="'+world+'"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-enter-world="'+world+'"]').click();
  await page.waitForURL('**/?world='+world);
  await page.waitForFunction(()=>document.querySelector('.unknown-effects').dataset.ready==='true'&&document.querySelector('.classroom-furniture').dataset.ready==='true');
  await page.waitForFunction(()=>!document.documentElement.classList.contains('world-arriving')&&!document.querySelector('.world-transfer'));
  assert.equal(await page.locator('.unknown-effects').getAttribute('data-groups'),String(fxData.groups.filter(g=>g.kind!=='cloud').length));
  assert.equal(await page.locator('.scene-back-layers img,.classroom-furniture img').count(),sceneData.sprites.length-1+itemsData.sprites.length);
  await page.waitForFunction(()=>[...document.querySelectorAll('.unknown-landscape img')].every(i=>i.complete&&i.naturalWidth>0));
  const before=await page.locator('.unknown-effects').getAttribute('data-frame');
  await page.waitForFunction(value=>document.querySelector('.unknown-effects').dataset.frame!==value,before);
  if(world==='9')await page.waitForFunction(()=>document.querySelector('.unknown-scene').dataset.area9Tweens==='2');
  await page.screenshot({path:'pjskapk/analysis-6.8.1/world'+world+'-browser.png'});
  for(const [width,height] of [[1280,720],[1920,1080],[699,842]]){
   await page.setViewportSize({width,height});
   for(const x of [width-5,5]){
    await page.mouse.move(width/2,height*.5);await page.mouse.down();await page.mouse.move(x,height*.5,{steps:15});await page.mouse.up();
    const bounds=await page.evaluate(()=>{const b=document.querySelector('.unknown-ground').getBoundingClientRect();return {left:b.left,right:b.right,w:innerWidth};});
    assert(bounds.left<=0&&bounds.right>=bounds.w,JSON.stringify(bounds));
   }
  }
  await page.goto('http://localhost:4100/');
  assert.equal(await page.locator('html').getAttribute('data-home-world'),world);
  await page.goto('http://localhost:4100/map/');
  assert.equal(await page.locator('[data-world="'+world+'"] .world-here').isVisible(),true);
  assert.deepEqual(errors,[]);
  console.log(`PASS: world ${world} transition, particles advancing, ${sceneData.sprites.length} scene layers + ${itemsData.sprites.length} items, wide/narrow drag bounds, persistence, HERE, no page errors.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
