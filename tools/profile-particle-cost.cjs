const{chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1.25});
 await page.route('**/js/home-effects.js',async route=>{
   const response=await route.fetch();let body=await response.text();
   body=body.replace('function rotate(v,a){','function rotate(v,a){window.rotationCalls=(window.rotationCalls||0)+1;');
   body=body.replace('setupGL();canvas.dataset.groups','window.particleCounts=groups.map(g=>({path:g.path,particles:g.particles.length,faces:g.mesh?.faces.length||2}));setupGL();canvas.dataset.groups');
   await route.fulfill({response,body});
 });
 await page.addInitScript(()=>{const raf=requestAnimationFrame;window.frameCosts=[];window.requestAnimationFrame=cb=>raf(t=>{const before=window.rotationCalls||0,start=performance.now();cb(t);if((window.rotationCalls||0)>before)window.frameCosts.push({ms:performance.now()-start,rotations:window.rotationCalls-before});});});
 for(const world of [27,5,7]){
   await page.goto('http://localhost:4100/live/?world='+world,{waitUntil:'domcontentloaded'});await page.waitForSelector('.unknown-effects[data-ready=true]');await page.waitForTimeout(2000);await page.evaluate(()=>window.frameCosts=[]);await page.waitForTimeout(2000);
   console.log(JSON.stringify(await page.evaluate(world=>({world,frames:frameCosts.length,averageMs:frameCosts.reduce((s,f)=>s+f.ms,0)/frameCosts.length,rotationsPerFrame:frameCosts.reduce((s,f)=>s+f.rotations,0)/frameCosts.length,particles:particleCounts.reduce((s,g)=>s+g.particles,0),groups:particleCounts.length}),world)));
 }
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
