const{chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
 for(const mode of ['current-direct','current-soft','reconstructed-full-load']){
  const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1.25});const page=await context.newPage();
  if(mode==='reconstructed-full-load'){
   await page.route('**/js/page-router.js',route=>route.fulfill({contentType:'text/javascript',body:`const installed=new Set();window.SekaiPages={register(name,init){if(installed.has(name))return;installed.add(name);init({signal:new AbortController().signal,cleanup(){},listen:(target,type,fn,opts)=>target?.addEventListener(type,fn,opts)});}};window.sekaiNavigate=url=>location.assign(url);`}));
   await page.route('**/js/home-world.js',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace('home = document.body','home = document.querySelector(\'.game-home\') || map').replace("if(!e.target.closest('.game-home') || e.button",'if(e.button').replace("e.target.closest('.game-home').setPointerCapture(e.pointerId)",'home.setPointerCapture(e.pointerId)').replace("if(!e.target.closest('.game-home'))return;",'');await route.fulfill({response,body});});
  }
  await page.addInitScript(()=>{window.getFrameSample=()=>new Promise(resolve=>{const samples=[];let last=0,start=performance.now();function frame(t){if(last)samples.push(t-last);last=t;if(t-start<3000)requestAnimationFrame(frame);else{samples.sort((a,b)=>a-b);resolve({frames:samples.length,p50:samples[Math.floor(samples.length*.5)],p95:samples[Math.floor(samples.length*.95)],slow33:samples.filter(v=>v>33.5).length});}}requestAnimationFrame(frame);});});
  await page.goto('http://localhost:4100/live/',{waitUntil:'domcontentloaded'});await page.waitForSelector('.unknown-scene[data-characters-ready=true]');
  if(mode==='current-soft')for(const p of ['/search/','/friends/','/live/'])await page.evaluate(p=>sekaiNavigate(p),p);
  await page.waitForTimeout(1500);
  const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');await cdp.send('HeapProfiler.collectGarbage');
  const before=(await cdp.send('Performance.getMetrics')).metrics;const frames=await page.evaluate(()=>getFrameSample());const after=(await cdp.send('Performance.getMetrics')).metrics;
  const delta={};for(const key of ['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','RecalcStyleCount'])delta[key]=after.find(m=>m.name===key).value-before.find(m=>m.name===key).value;
  console.log(JSON.stringify({mode,...frames,delta}));await context.close();
 }
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
