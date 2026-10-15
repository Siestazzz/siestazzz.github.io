const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 for(const [key,random] of [['ichika',.05],['rin',.3],['len',.55],['miku',.8]]){
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  await page.addInitScript(r=>{window.testRandom=r;Math.random=()=>window.testRandom;},random);
  await page.addInitScript(()=>{
   window.firstLive2D=null;
   new MutationObserver(()=>{
    const h=document.querySelector('[data-live2d-host][data-ready=true]');
    if(h&&!window.firstLive2D){
     window.firstLive2D={id:h.dataset.talkId,motion:h.dataset.motion,expression:h.dataset.expression,text:h.querySelector('.live2d-line').textContent};
     const m=sekaiLive2DDiagnostics().model.internalModel.coreModel;
     window.firstPose=Object.fromEntries(m._parameterIds.map(id=>[id,m.getParameterValueById(id)]));
    }
   }).observe(document,{subtree:true,attributes:true,attributeFilter:['data-ready']});
  });
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:4100/');await page.waitForSelector('[data-ready=true]',{timeout:60000});
  assert.equal(await page.locator('[data-live2d-host]').getAttribute('data-character'),key);
  assert.equal(await page.locator('.live2d-choices,.live2d-name,.live2d-talk i').count(),0);
  assert.equal((await page.locator('.live-content h1').innerText()).trim(),'READING');
  const fade=await page.locator('.live2d-viewport').evaluate(el=>{
   const a=el.getAnimations().find(a=>a.animationName==='live2d-ready-in');
   if(!a)return null;
   a.pause();const values=[0,125,250].map(t=>{a.currentTime=t;return Number(getComputedStyle(el).opacity);});a.finish();return values;
  });
  assert(fade&&fade[0]===0&&Math.abs(fade[1]-.5)<.01&&fade[2]===1,'Ready reveal must fade linearly over 250ms');
  await page.screenshot({path:'pjskapk/analysis-6.8.1/live2d-'+key+'-ready.png'});
  const posed=await page.evaluate(()=>{const m=sekaiLive2DDiagnostics().model.internalModel.coreModel;return Array.from(m._parameterValues).some((v,i)=>Math.abs(v-m.getParameterDefaultValue(i))>.01);});
  assert(posed,'First visible frame must not be default pose');
  const first=await page.evaluate(()=>window.firstLive2D);
  const opening=await page.evaluate(async k=>(await(await fetch('/game-assets/live2d/'+k+'/talks.json')).json()).items[0],key);
  assert.deepEqual(first,{id:String(opening.id),motion:opening.motion,expression:opening.expression,text:opening.serif});
  if(key==='ichika'){
   await page.evaluate(()=>{
    window.unrequestedMotions=[];const m=sekaiLive2DDiagnostics().model,original=m.parallelMotion.bind(m);
    m.parallelMotion=(list)=>{window.unrequestedMotions.push(list);return original(list);};
   });
   await page.waitForTimeout(6500);
   assert.deepEqual(await page.evaluate(()=>window.unrequestedMotions),[],'No automatic return to Idle after 5 seconds');
   assert.equal(await page.locator('.live2d-line').innerText(),opening.serif);
  }
  const arms=await page.evaluate(async k=>{
   const motion=await(await fetch('/game-assets/live2d/'+k+'/motions/'+window.firstLive2D.motion+'.motion3.json')).json();
   const core=sekaiLive2DDiagnostics().model.internalModel.coreModel;
   return motion.Curves.filter(c=>/^ParamArm/.test(c.Id)&&c.Segments.length===5&&Math.abs(c.Segments[1])>.1).map(c=>{
    const i=core.getParameterIndex(c.Id),expected=Math.max(core.getParameterMinimumValue(i),Math.min(core.getParameterMaximumValue(i),c.Segments[1]));
    return {id:c.Id,expected,actual:window.firstPose[c.Id]};
   });
  },key);
  assert(arms.length>0);for(const arm of arms)assert(Math.abs(arm.actual-arm.expected)<.1,`${key} first rendered ${arm.id}: ${arm.actual} != ${arm.expected}`);
  await page.locator('.live2d-tap').click({position:{x:220,y:220}});await page.waitForFunction(id=>document.querySelector('[data-live2d-host]').dataset.talkId!==id,first.id);
  const expected=await page.evaluate(async k=>{const d=await(await fetch('/game-assets/live2d/'+k+'/talks.json')).json();return d.items.find(t=>String(t.id)===document.querySelector('[data-live2d-host]').dataset.talkId);},key);
  assert.equal(await page.locator('.live2d-line').innerText(),expected.serif);
  await page.waitForTimeout(700);await page.screenshot({path:'pjskapk/analysis-6.8.1/live2d-'+key+'.png'});
  await page.evaluate(()=>{window.keptRenderer=sekaiLive2DDiagnostics().renderer;window.testRandom=(window.testRandom+.25)%1;});
  await page.locator('.live-menu-reading').click();await page.waitForSelector('.song-row');assert.equal(await page.evaluate(()=>sekaiLive2DDiagnostics().running),false);
  await page.locator('.game-back').click();await page.waitForSelector('[data-ready=true]');assert.notEqual(await page.locator('[data-live2d-host]').getAttribute('data-character'),key);
  assert(await page.evaluate(()=>window.keptRenderer===sekaiLive2DDiagnostics().renderer));assert.equal(await page.locator('.live2d-viewport canvas').count(),1);
  if(key==='miku'){await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);await page.screenshot({path:'pjskapk/analysis-6.8.1/live2d-mobile.png'});}
  assert.deepEqual(errors,[]);console.log('PASS random/posed first frame/talk/re-entry',key);await page.close();
 }
 const retry=await browser.newPage({reducedMotion:'reduce'});await retry.route('**/*.moc3',r=>r.fulfill({status:503,body:'Test'}));await retry.goto('http://localhost:4100/');await retry.waitForSelector('[data-ready=error]');await retry.unroute('**/*.moc3');await retry.locator('.live2d-talk').click();await retry.waitForSelector('[data-ready=true]');assert.equal(await retry.evaluate(()=>sekaiLive2DDiagnostics().running),false);
 console.log('PASS reduced motion and click-to-retry');
 const covered=await browser.newPage();
 await covered.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{
  const veil=document.createElement('div');veil.className='title-entry-route-veil';document.body.append(veil);
 }));
 await covered.goto('http://localhost:4100/');
 await covered.waitForFunction(()=>window.sekaiLive2DDiagnostics?.().clock>=1.49);
 assert.equal(await covered.locator('[data-live2d-host]').getAttribute('data-ready'),'false');
 await covered.locator('.title-entry-route-veil').evaluate(el=>el.remove());
 await covered.waitForSelector('[data-ready=true]');
 console.log('PASS reveal waits for entry route veil');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
