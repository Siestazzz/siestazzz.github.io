const {chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({headless:true,channel:'chrome'});try{
 const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 for(const world of [5,7,8,9,10,27]){
  await p.goto('http://127.0.0.1:4100/?world='+world);
  await p.waitForFunction(()=>document.querySelector('.unknown-scene').dataset.charactersReady==='true');
  for(const [width,height]of [[1280,720],[1920,700],[800,900],[699,842]]){
   await p.setViewportSize({width,height});await p.waitForTimeout(150);
   const result=await p.evaluate(()=>{const s=document.querySelector('.unknown-scene'),g=s.querySelector('.unknown-ground').getBoundingClientRect(),box=s.getBoundingClientRect(),size=s.sekaiSceneData?.coordinateSize||[3378.144396322671,1600];return {ratio:(g.width/size[0])/(g.height/size[1]),cover:g.left<=box.left&&g.right>=box.right&&g.top<=box.top&&g.bottom>=box.bottom,actors:s.querySelector('.home-characters canvas').sekaiCharacters.map(a=>Math.abs(a.skeleton.scaleX/a.skeleton.scaleY)),items:[...s.querySelectorAll('[data-source]')].map(img=>{const d=s.sekaiSceneData.sprites.find(d=>d.renderer===img.dataset.source);return (parseFloat(img.style.width)/(d.size[0]*d.scale[0]))/(parseFloat(img.style.height)/(d.size[1]*d.scale[1]));})};});
   assert(Math.abs(result.ratio-1)<.001);assert(result.cover);for(const r of [...result.actors,...result.items])assert(Math.abs(r-1)<.001);
  }console.log('uniform scene',world);
 }
 await p.setViewportSize({width:1280,height:720});
 for(const path of ['/live/','/search/','/friends/','/2026/09/04/hello-world/','/about/','/tags/','/archives/']){
  await p.goto('http://127.0.0.1:4100'+path);await p.waitForFunction(()=>document.querySelector('.unknown-scene').dataset.charactersReady==='true');
  assert.equal(await p.locator('html').getAttribute('data-home-world'),'27');assert.equal(await p.locator('.street-scene').count(),0);
  assert.notEqual(await p.locator('.unknown-scene').evaluate(e=>getComputedStyle(e).filter),'none');console.log('world sync',path);
 }
 await p.goto('http://127.0.0.1:4100/live/');
 for(const [width,height] of [[1280,720],[1920,700],[800,900],[699,842]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(200);
  const scale=await p.locator('.live-content').evaluate(e=>{const m=new DOMMatrix(getComputedStyle(e).transform);return [m.a,m.d]});assert(Math.abs(scale[0]-scale[1])<.0001);
 }
 await p.setViewportSize({width:1280,height:720});await p.screenshot({path:'pjskapk/analysis-6.8.1/characters-audit/live-world-sync.png'});
 await p.goto('http://127.0.0.1:4100/?world=9');await p.waitForFunction(()=>document.querySelector('.unknown-scene').dataset.charactersReady==='true');await p.setViewportSize({width:1920,height:700});await p.waitForTimeout(300);await p.screenshot({path:'pjskapk/analysis-6.8.1/characters-audit/wide-world-scale.png'});
 assert.deepEqual(errors,[]);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
