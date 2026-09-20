const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await browser.newPage({viewport:{width:1280,height:720}});
 await p.goto('http://localhost:4100/?world=5');await p.waitForSelector('.unknown-scene[data-characters-ready=true]');
 await p.evaluate(()=>sekaiNavigate('/live/'));await p.waitForTimeout(300);
 const frames=await p.evaluate(async()=>{
  const frames=[];let running=true;
  function sample(){const s=document.querySelector('.unknown-scene'),d=document.querySelector('.scene-dim');frames.push({blur:getComputedStyle(s).filter,alpha:+getComputedStyle(d).opacity,display:getComputedStyle(d).display});if(running)requestAnimationFrame(sample);}
  sample();await sekaiNavigate('/?world=5');await new Promise(r=>setTimeout(r,400));running=false;return frames;
 });
 assert(frames.some(f=>f.alpha>0&&f.alpha<.22));assert.equal(frames.at(-1).alpha,0);assert.equal(frames.at(-1).blur,'blur(0px)');assert(frames.every(f=>f.display!=='none'));
 console.log('PASS continuous veil -> clear',frames);
 await p.screenshot({path:'pjskapk/analysis-6.8.1/home-veil-clear.png'});
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
