/* Original PlayMark texture; device-observed zoom/white-out/reveal sequence.
 * Timings and canvas particle projection are web adaptations, see WORLD-TRANSITION.md. */
(()=>{
 const root=document.body.dataset.root||'/',reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function overlay(epoch=Date.now()){
  const el=document.createElement('div');el.className='world-transfer';el.setAttribute('aria-hidden','true');
  const play=new Image();play.src=root+'game-assets/map/transition/btn_play_h264_gn.png';play.className='world-transfer-play';el.append(play);
  document.body.append(el);window.sekaiTransitionParticles?.(el,epoch);return el;
 }
 window.sekaiWorldTransfer=async(button,world)=>{
  const epoch=Date.now(),cover=overlay(epoch),rect=button.getBoundingClientRect(),selection=document.querySelector('.sekai-selection');
  try{sessionStorage.setItem('sekai-transfer-fx-start',String(epoch));}catch{}
  const selectionRect=selection.getBoundingClientRect();
  selection.style.transformOrigin=`${rect.left+rect.width/2-selectionRect.left}px ${rect.top+rect.height/2-selectionRect.top}px`;
  selection.animate([{transform:'scale(1)'},{transform:'scale(2.5)'}],{duration:reduced.matches?1:950,easing:'ease-in',fill:'forwards'});
  cover.style.opacity='1';
  await cover.animate([{'--cover-alpha':'0'},{'--cover-alpha':'0',offset:.25},{'--cover-alpha':'1'}],{duration:reduced.matches?1:1500,easing:'linear',fill:'forwards'}).finished;
  try{sessionStorage.setItem('sekai-world-transfer',Date.now());}catch{}
  location.assign(root+'?world='+world);
 };
 if(document.documentElement.classList.contains('world-arriving')){
  let epoch=Date.now()-5000;try{epoch=Number(sessionStorage.getItem('sekai-transfer-fx-start'))||epoch;}catch{}
  const cover=overlay(epoch);cover.style.opacity='1';cover.style.setProperty('--cover-alpha','1');document.documentElement.classList.remove('world-arriving');
  try{sessionStorage.removeItem('sekai-world-transfer');}catch{}
  const start=performance.now();
  function reveal(){
   const scene=document.querySelector('.unknown-scene'),ground=scene?.querySelector('.unknown-ground'),fx=scene?.querySelector('.unknown-effects');
   const ready=ground?.complete&&ground.naturalWidth&&fx?.dataset.ready==='true'&&['true','error'].includes(scene.dataset.charactersReady)&&(scene.dataset.homeWorld==='27'?scene.querySelector('.unknown-tree').dataset.loaded==='true':scene.dataset.spritesReady==='true');
   if(!ready&&performance.now()-start<8000){requestAnimationFrame(reveal);return;}
   cover.animate([{opacity:1},{opacity:0}],{duration:reduced.matches?1:1000,easing:'ease-out',fill:'forwards'}).finished.then(()=>{cover.disposeParticles?.();cover.remove();});
  }requestAnimationFrame(reveal);
 }
 addEventListener('pagehide',()=>document.querySelectorAll('.world-transfer').forEach(el=>el.disposeParticles?.()));
 addEventListener('pageshow',e=>{if(e.persisted){document.querySelectorAll('.world-transfer').forEach(el=>{el.disposeParticles?.();el.remove();});document.querySelector('.sekai-selection')?.getAnimations().forEach(a=>a.cancel());}});
})();
