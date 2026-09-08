const {chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1.25});
 await page.addInitScript(()=>{
   const native=requestAnimationFrame,keys=new WeakMap();window.perfSkip='';window.perfStats={};
   window.requestAnimationFrame=cb=>{
     if(!keys.has(cb))keys.set(cb,(new Error().stack.split('\n')[2]||'').trim());const key=keys.get(cb);
     const invoke=t=>{if(window.perfSkip&&key.includes(window.perfSkip))return native(invoke);const start=performance.now();cb(t);const ms=performance.now()-start;const s=window.perfStats[key]||(window.perfStats[key]={n:0,ms:0,max:0});s.n++;s.ms+=ms;s.max=Math.max(s.max,ms);};return native(invoke);
   };
   window.sample=()=>new Promise(resolve=>{window.perfStats={};const intervals=[];let last=0,start=performance.now();function tick(t){if(last)intervals.push(t-last);last=t;if(t-start<2500)native(tick);else{intervals.sort((a,b)=>a-b);resolve({frames:intervals.length,p50:intervals[Math.floor(intervals.length*.5)],p95:intervals[Math.floor(intervals.length*.95)],over33:intervals.filter(t=>t>33.5).length,callbacks:window.perfStats,canvases:[...document.querySelectorAll('canvas')].map(c=>[c.className,c.width,c.height])});}}native(tick);});
 });
 await page.goto('http://localhost:4100/live/',{waitUntil:'domcontentloaded'});await page.waitForSelector('.unknown-scene[data-characters-ready=true]');await page.waitForTimeout(2000);
 const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
 for(const name of ['baseline','no-blur','no-effects','no-characters','no-tree','restored','after-cycles']){
  if(name==='after-cycles'){for(let i=0;i<6;i++)for(const path of ['/search/','/friends/','/live/'])await page.evaluate(p=>sekaiNavigate(p),path);await page.waitForTimeout(1000);}
  await page.evaluate(name=>{document.querySelector('.unknown-scene').style.filter=name==='no-blur'?'none':'';window.perfSkip=({'no-effects':'home-effects.js','no-characters':'home-characters.js','no-tree':'home-world.js'})[name]||'';},name);
  const sample=await page.evaluate(()=>window.sample());const metrics=(await cdp.send('Performance.getMetrics')).metrics.filter(m=>['JSHeapUsedSize','Nodes','JSEventListeners'].includes(m.name));console.log(JSON.stringify({name,...sample,metrics}));
 }
 await cdp.send('Profiler.enable');await cdp.send('Profiler.start');await page.waitForTimeout(2500);const{profile}=await cdp.send('Profiler.stop');
 console.log('CPU',JSON.stringify(profile.nodes.filter(n=>n.hitCount).sort((a,b)=>b.hitCount-a.hitCount).slice(0,18).map(n=>({fn:n.callFrame.functionName,url:n.callFrame.url,line:n.callFrame.lineNumber,hits:n.hitCount}))));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
