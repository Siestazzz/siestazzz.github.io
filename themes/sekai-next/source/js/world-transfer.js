/* Original PlayMark texture; device-observed zoom/white-out/reveal sequence.
 * Timings and CSS particle projection are web adaptations, see CLASSROOM.md. */
(()=>{
 const root=document.body.dataset.root||'/',reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function overlay(){
  const el=document.createElement('div');el.className='world-transfer';el.setAttribute('aria-hidden','true');
  const play=new Image();play.src=root+'game-assets/map/transition/btn_play_h264_gn.png';play.className='world-transfer-play';el.append(play);
  for(let i=0;i<28;i++){const shard=new Image();shard.src=root+'game-assets/map/area5/tex_sekai_02.png';shard.className='world-transfer-shard';shard.style.cssText=`--x:${(i*37)%115-8}%;--y:${(i*29)%110-5}%;--turn:${i*53}deg;--delay:${-(i%7)*.2}s;--hue:${i*47}deg`;el.append(shard);}
  document.body.append(el);return el;
 }
 window.sekaiWorldTransfer=async(button,world)=>{
  const cover=overlay(),rect=button.getBoundingClientRect(),selection=document.querySelector('.sekai-selection');
  selection.style.transformOrigin=`${rect.left+rect.width/2}px ${rect.top+rect.height/2}px`;
  selection.animate([{transform:'scale(1)'},{transform:'scale(2.5)'}],{duration:reduced.matches?1:950,easing:'ease-in',fill:'forwards'});
  await cover.animate([{opacity:0},{opacity:1}],{duration:reduced.matches?1:1200,easing:'ease-in',fill:'forwards'}).finished;
  try{sessionStorage.setItem('sekai-world-transfer',Date.now());}catch{}
  location.assign(root+'?world='+world);
 };
 if(document.documentElement.classList.contains('world-arriving')){
  const cover=overlay();cover.style.opacity='1';document.documentElement.classList.remove('world-arriving');
  try{sessionStorage.removeItem('sekai-world-transfer');}catch{}
  const start=performance.now();
  function reveal(){
   const scene=document.querySelector('.unknown-scene'),ground=scene?.querySelector('.unknown-ground'),fx=scene?.querySelector('.unknown-effects');
   const ready=ground?.complete&&ground.naturalWidth&&fx?.dataset.ready==='true'&&['true','error'].includes(scene.dataset.charactersReady)&&(scene.dataset.homeWorld==='27'?scene.querySelector('.unknown-tree').dataset.loaded==='true':scene.dataset.spritesReady==='true');
   if(!ready&&performance.now()-start<8000){requestAnimationFrame(reveal);return;}
   cover.animate([{opacity:1},{opacity:0}],{duration:reduced.matches?1:1000,easing:'ease-out',fill:'forwards'}).finished.then(()=>cover.remove());
  }requestAnimationFrame(reveal);
 }
 addEventListener('pageshow',e=>{if(e.persisted){document.querySelectorAll('.world-transfer').forEach(el=>el.remove());document.querySelector('.sekai-selection')?.getAnimations().forEach(a=>a.cancel());}});
})();
