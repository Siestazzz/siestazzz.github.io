window.SekaiPages.register('home', (scope) => {
  'use strict';
  const home=document.querySelector('.game-home');if(!home)return;
  const paths=JSON.parse(document.querySelector('#home-post-paths').textContent);
  const gacha=home.querySelector('.home-gacha');
  gacha.addEventListener('click',()=>{
    if(!paths.length||gacha.disabled)return;
    let last='';try{last=sessionStorage.getItem('sekai-home-last-draw')||'';}catch{}
    const pool=paths.length>1?paths.filter(p=>p!==last):paths;
    const selected=pool[Math.floor(Math.random()*pool.length)];
    try{sessionStorage.setItem('sekai-home-last-draw',selected);}catch{}
    gacha.disabled=true;window.sekaiNavigate(selected);
  });
  scope.listen(window,'pageshow',()=>{gacha.disabled=!paths.length;});
  const carousel=home.querySelector('.home-featured');if(!carousel)return;
  const track=carousel.querySelector('.home-featured-track'),slides=[...track.children],dots=[...carousel.querySelectorAll('[data-slide]')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let index=0,timer=null,hover=false,focused=false,start=null,suppressClick=false;
  let wrapping=false;
  if(slides.length>1){const clone=slides[0].cloneNode(true);clone.inert=true;clone.setAttribute('aria-hidden','true');track.append(clone);}
  track.addEventListener('transitionend',e=>{if(e.target!==track||!wrapping)return;wrapping=false;track.style.transition='none';track.style.transform='translateX(0%)';requestAnimationFrame(()=>requestAnimationFrame(()=>track.style.removeProperty('transition')));});
  function schedule(){clearTimeout(timer);if(!scope.signal.aborted&&slides.length>1&&!hover&&!focused&&!document.hidden&&!reduced.matches)timer=setTimeout(()=>show(index+1),3000);}
  scope.cleanup(()=>clearTimeout(timer));
  function show(next){wrapping=next===slides.length&&!reduced.matches;index=(next+slides.length)%slides.length;track.style.transform=`translateX(${-(wrapping?slides.length:index)*100}%)`;slides.forEach((s,i)=>{s.inert=i!==index;s.setAttribute('aria-hidden',String(i!==index));});dots.forEach((d,i)=>d.setAttribute('aria-pressed',String(i===index)));schedule();}
  dots.forEach((d,i)=>d.addEventListener('click',()=>show(i)));
  carousel.addEventListener('mouseenter',()=>{hover=true;schedule();});carousel.addEventListener('mouseleave',()=>{hover=false;schedule();});
  carousel.addEventListener('focusin',()=>{focused=true;schedule();});carousel.addEventListener('focusout',()=>{queueMicrotask(()=>{focused=carousel.contains(document.activeElement);schedule();});});
  carousel.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show(index+(e.key==='ArrowRight'?1:-1));dots[index].focus();}});
  const viewport=carousel.querySelector('.home-featured-window');
  viewport.addEventListener('dragstart',e=>e.preventDefault());
  viewport.addEventListener('pointerdown',e=>{if(e.button!==0)return;start={x:e.clientX,y:e.clientY};suppressClick=false;clearTimeout(timer);});
  viewport.addEventListener('pointerup',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>25&&Math.abs(dx)>Math.abs(dy)){suppressClick=true;show(index+(dx<0?1:-1));}else schedule();});
  viewport.addEventListener('pointercancel',()=>{start=null;schedule();});
  viewport.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopPropagation();suppressClick=false;}},true);
  scope.listen(document,'visibilitychange',schedule);scope.listen(reduced,'change',schedule);
  carousel.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{if(!img.dataset.fallback){img.dataset.fallback='1';img.src=(document.body.dataset.root||'/')+'game-assets/bg_sekai.png';}}));
  show(0);
});
