const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require(process.env.SEKAI_NODE_DEPS?process.env.SEKAI_NODE_DEPS+'/playwright':'C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'}),results=[];
 try{
  for(const world of [5,7,8,9,10,27]){
   const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&m.text().startsWith('SEKAI characters:'))errors.push(m.text());});
   await page.goto('http://127.0.0.1:4100/?world='+world);
   await page.waitForFunction(()=>document.querySelector('.unknown-scene').dataset.charactersReady==='true',{},{timeout:30000});
   const count=Number(await page.locator('.unknown-scene').getAttribute('data-character-count'));assert(count>0);
   const clockBefore=await page.evaluate(()=>document.querySelector('.home-characters canvas').sekaiCharacters[0].clock);
   const hit=await page.evaluate(()=>document.querySelector('.home-characters canvas').sekaiCharacters[0].hit);
   await page.mouse.click(hit.x+hit.w/2,hit.y+hit.h*.65);await page.waitForTimeout(150);
   const clockAfter=await page.evaluate(()=>document.querySelector('.home-characters canvas').sekaiCharacters[0].clock);
   assert(clockAfter-clockBefore<2,'Click must not seek to speech');
   const initial=Number(await page.locator('.home-characters canvas').getAttribute('data-elapsed'));
   await page.waitForFunction(()=>[...document.querySelectorAll('.character-balloon')].some(b=>!b.hidden),{},{timeout:25000});
   const bubble=await page.locator('.character-balloon:not([hidden]) .character-text-measure').first().textContent();assert(bubble&&!bubble.includes('\ufffd'));
   await page.waitForFunction(()=>[...document.querySelectorAll('.character-balloon')].some(b=>!b.hidden&&b.querySelector('.character-words').textContent===b.querySelector('.character-text-measure').textContent));
   const elapsed=Number(await page.locator('.home-characters canvas').getAttribute('data-elapsed'));assert(elapsed>initial);
   const facing=await page.evaluate(()=>document.querySelector('.home-characters canvas').sekaiCharacters.map(a=>({cell:a.detail.ActionPaths[a.pathIndex].CellPosition,direction:a.detail.ActionPaths[a.pathIndex].Direction,flip:a.skeleton.scaleX<0,hit:a.hit})));
   for(const a of facing)assert.equal(a.flip,a.direction===4);
   if(facing.length>1){const ordered=[...facing].sort((a,b)=>a.cell.x-b.cell.x);assert.equal(ordered[0].direction,4);assert.equal(ordered.at(-1).direction,3);}
   await page.screenshot({path:`pjskapk/analysis-6.8.1/characters-audit/world${world}-browser.png`});
   if(world===5){
    await page.waitForFunction(()=>document.querySelector('.character-balloon').hidden);
    await page.waitForFunction(()=>!document.querySelector('.character-balloon').hidden);
   }
   const locationBefore=page.url();await page.mouse.click(facing[0].hit.x+facing[0].hit.w/2,facing[0].hit.y+facing[0].hit.h*.6);await page.waitForTimeout(120);assert.equal(page.url(),locationBefore);
   const before=await page.locator('.unknown-ground').boundingBox();
   await page.mouse.move(640,520);await page.mouse.down();await page.mouse.move(790,520,{steps:8});await page.mouse.up();
   const after=await page.locator('.unknown-ground').boundingBox();assert.notEqual(before.x,after.x);
   await page.waitForTimeout(80);
   const movedX=await page.evaluate(()=>document.querySelector('.home-characters canvas').sekaiCharacters[0].hit.x);
   assert(Math.abs((movedX-facing[0].hit.x)-(after.x-before.x))<1,'Characters must pan with the ground');
   assert.equal(new URL(page.url()).pathname,'/');
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);
   const frozen=await page.locator('.home-characters canvas').getAttribute('data-elapsed');await page.waitForTimeout(200);assert.equal(await page.locator('.home-characters canvas').getAttribute('data-elapsed'),frozen);
   assert.deepEqual(errors,[]);
   results.push({world,count,bubble,elapsed,facing,errors});console.log(JSON.stringify(results.at(-1)));await page.close();
  }
  fs.writeFileSync('pjskapk/analysis-6.8.1/characters-audit/browser-results.json',JSON.stringify(results,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
