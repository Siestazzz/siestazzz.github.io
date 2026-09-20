(() => {
 'use strict';
 const map=document.querySelector('.sekai-map');if(!map)return;
 const worlds=[...map.querySelectorAll('.orbit-world')],selection=map.querySelector('.sekai-selection');
 let rotation=0,gesture=null,moved=false,busy=false,rotating=false;
 const instruction=map.querySelector('.map-instruction');
 function focusWorld(button){
  map.querySelectorAll('[data-enter-world]').forEach(w=>w.setAttribute('aria-pressed',String(w===button)));
  instruction.textContent=button?'正在进入「'+button.querySelector('.world-name').textContent+'」':'点击世界进入';
 }
 function paint(){
  const scale=Math.min(innerWidth/1920,innerHeight/1080);
  map.style.setProperty('--map-scale',scale);
  worlds.forEach((world,i)=>{
   const angle=(i*72+rotation)*Math.PI/180,depth=Math.cos(angle);
   world.style.left=(960+Math.sin(angle)*345*1.85)+'px';
   world.style.top=(550+depth*345*.85*Math.min(2.25,Math.max(1,innerHeight/innerWidth)))+'px';
   world.style.setProperty('--depth',.78+.22*depth);
   world.style.zIndex=Math.round(10+depth*5);
  });
 }
 paint();window.addEventListener('resize',paint);
 // PlayListWorldCell.Update: sin((defaultAnimateValue + animateValue)/180*PI)*15;
 // animateValue increments once per frame. Normalize to 60 Hz for browsers.
 const planets=[...map.querySelectorAll('.sekai-world')],motion=matchMedia('(prefers-reduced-motion: reduce)');
 let bobFrame;
 function bob(now){
  planets.forEach((planet,i)=>planet.style.setProperty('--world-bob',motion.matches?'0px':(-Math.sin(now/1000*Math.PI/3+i*1.1)*15)+'px'));
  if(!document.hidden&&!motion.matches)bobFrame=requestAnimationFrame(bob);
 }
 const resumeBob=()=>{cancelAnimationFrame(bobFrame);bobFrame=requestAnimationFrame(bob);};
 resumeBob();document.addEventListener('visibilitychange',resumeBob);motion.addEventListener('change',resumeBob);
 let orbitFrame=0;
 function rotateTo(target){
  cancelAnimationFrame(orbitFrame);
  rotating=true;map.dataset.rotating='true';
  const finishRotation=()=>{rotating=false;map.dataset.rotating='false';};
  if(motion.matches){rotation=target;paint();finishRotation();return;}
  const from=rotation,start=performance.now();
  const tick=now=>{const t=Math.min(1,(now-start)/100);rotation=from+(target-from)*t;paint();if(t<1)orbitFrame=requestAnimationFrame(tick);else finishRotation();};
  orbitFrame=requestAnimationFrame(tick);
 }
 map.querySelector('.orbit-prev').onclick=()=>{if(busy||rotating)return;focusWorld(null);rotateTo(Math.round(rotation/72)*72-72);};
 map.querySelector('.orbit-next').onclick=()=>{if(busy||rotating)return;focusWorld(null);rotateTo(Math.round(rotation/72)*72+72);};
 worlds.filter(w=>!w.hasAttribute('data-enter-world')).forEach(w=>w.onclick=()=>{map.querySelector('.map-instruction').textContent=w.querySelector('.world-name').textContent+' 暂未开放';});
 selection.addEventListener('pointerdown',e=>{
  moved=false;
  if(busy||rotating||e.button!==0||e.target.closest('.orbit-arrow'))return;
  cancelAnimationFrame(orbitFrame);
  gesture={x:e.clientX,rotation};moved=false;
 });
 selection.addEventListener('pointermove',e=>{
  if(!gesture)return;const dx=e.clientX-gesture.x;
  if(Math.abs(dx)>5){moved=true;focusWorld(null);}
  if(moved){selection.setPointerCapture(e.pointerId);rotation=gesture.rotation+dx/innerWidth*240;paint();}
 });
 const finish=()=>{if(!gesture)return;gesture=null;if(moved)rotateTo(Math.round(rotation/72)*72);};
 selection.addEventListener('pointerup',finish);selection.addEventListener('pointercancel',finish);
 selection.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopPropagation();}},true);
 function markCurrent(){let selected='27';try{const saved=localStorage.getItem('sekai-home-world');selected=['5','7','8','9','10'].includes(saved)?saved:'27';}catch{}map.querySelectorAll('.world-here').forEach(el=>el.hidden=el.closest('[data-world]').dataset.world!==selected);}
 markCurrent();
 map.querySelectorAll('[data-enter-world]').forEach(button=>button.onclick=()=>{
  if(busy||rotating)return;
  busy=true;
  focusWorld(button);
  const world=button.dataset.enterWorld;try{localStorage.setItem('sekai-home-world',world);}catch{}
  window.sekaiWorldTransfer(button,world);
 });
 focusWorld(null);
 window.addEventListener('pageshow',()=>{busy=false;focusWorld(null);markCurrent();});
 // Compatibility with the first prototype URL: a world is the homepage, not a separate screen.
 if(new URLSearchParams(location.search).get('area')==='27')location.replace(document.body.dataset.root||'/');
})();
