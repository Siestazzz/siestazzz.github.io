(()=>{
 const root=document.documentElement;
 if(document.currentScript.dataset.entry!=='true')return;
 const timelineURL=new URL('../game-assets/entry/title-timeline.json',document.currentScript.src);
 const introRate=2;
 const timelineReady=fetch(timelineURL).then(r=>{if(!r.ok)throw Error('timeline');return r.json();});
 timelineReady.catch(()=>{});
 const logoReady=fetch(new URL('title-logo-timeline.json',timelineURL)).then(r=>r.ok?r.json():null).catch(()=>null);
 root.classList.add('title-entry-pending');
 addEventListener('DOMContentLoaded',()=>{
  const entry=document.querySelector('.title-entry'),main=document.querySelector('.site-main'),top=document.querySelector('.topbar');
  if(!entry){root.classList.remove('title-entry-pending');return;}
  main.inert=true;top.inert=true;
  const button=entry.querySelector('.title-entry-enter');entry.tabIndex=-1;entry.focus({preventScroll:true});let entering=false,disposed=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,animations=[];
  const movie=entry.querySelector('.title-entry-movie'),loopStart=226/30;
  let movieActive=false,movieFrame=0,movieLoop=false;
  const stopMovie=()=>{movieActive=false;if(movieFrame&&movie.cancelVideoFrameCallback)movie.cancelVideoFrameCallback(movieFrame);movieFrame=0;movie.pause();movie.removeAttribute('src');movie.load();entry.classList.remove('title-entry-movie-active');};
  const movieFailed=()=>{if(!movieActive)return;stopMovie();if(!disposed&&!entering)settleIntro();};
  const movieTick=()=>{if(!movieActive||disposed)return;if(!movieLoop&&movie.currentTime>=loopStart){movieLoop=true;movie.playbackRate=1;}if(movie.requestVideoFrameCallback)movieFrame=movie.requestVideoFrameCallback(movieTick);};
  movie.addEventListener('timeupdate',()=>{if(!movie.requestVideoFrameCallback)movieTick();});
  // At ended, play() may rewind to zero before an asynchronous seek completes.
  // Resume only after the decoder has reached the original idle-loop frame.
  movie.addEventListener('ended',()=>{if(!movieActive||disposed)return;movieLoop=true;movie.playbackRate=1;movie.currentTime=loopStart;});
  movie.addEventListener('seeked',()=>{if(movieActive&&!disposed&&!document.hidden&&movie.paused)movie.play().catch(movieFailed);});
  movie.addEventListener('error',movieFailed);
  const movieReady=reduced?Promise.resolve(false):new Promise(resolve=>{
   let timer;
   const done=ok=>{clearTimeout(timer);movie.removeEventListener('loadeddata',loaded);movie.removeEventListener('error',failed);resolve(ok);};
   const loaded=()=>done(true),failed=()=>done(false);
   movie.addEventListener('loadeddata',loaded,{once:true});movie.addEventListener('error',failed,{once:true});
   timer=setTimeout(()=>{done(false);stopMovie();},6000);
   // Let the media element buffer and seek with HTTP Range requests.
   movie.src=movie.dataset.src;movie.load();
  });
  let fx=null;
  const fxReady=reduced?Promise.resolve():window.createSekaiTitleFX(entry).then(value=>{if(disposed)value.destroy();else fx=value;}).catch(error=>console.warn('Title particle fallback',error));
  const play=(element,frames,options)=>{const a=element.animate(frames,{fill:'forwards',...options});animations.push(a);return a.finished.catch(()=>{});};
  const visibility=()=>{for(const a of animations)if(a.playState!=='finished'&&a.playState!=='idle'){if(document.hidden)a.pause();else a.play();}if(movieActive){if(document.hidden)movie.pause();else if(!movie.seeking)movie.play().catch(movieFailed);}};
  document.addEventListener('visibilitychange',visibility);
  const settleIntro=()=>{entry.classList.add('title-entry-idle');};
  // Unity streamed coefficients are a cubic polynomial evaluated from each key time.
  const value=(keys,t)=>{let k=keys[0];for(const next of keys){if(next.t>t)break;k=next;}if(!k)return 0;const d=t-k.t,[a,b,c,v]=k.coeff;return ((a*d+b)*d+c)*d+v;};
  (async()=>{
   try{
    const [timeline,logo,hasMovie]=await Promise.all([timelineReady,logoReady,movieReady,fxReady]);
    if(disposed||entering)return;
    if(reduced){settleIntro();return;}
    if(hasMovie){
     movieActive=true;movie.playbackRate=introRate;
     try{await movie.play();if(disposed||entering){stopMovie();return;}entry.classList.add('title-entry-movie-active');movieTick();if(document.hidden)movie.pause();}catch{stopMovie();}
    }else stopMovie();
    if(disposed||entering)return;
    if(!movieActive)fx?.start(introRate);
    const frames=(index,property,convert=v=>v)=>Array.from({length:387},(_,i)=>{const t=Math.min(i/60,timeline.duration);return {offset:t/timeline.duration,[property]:convert(value(timeline.bindings.find(b=>b.index===index).curves[0],t))};});
    const options={duration:timeline.duration*1000/introRate,easing:'linear'};
    if(!movieActive){
     for(const [selector,index] of [['.title-entry-base',3],['.title-entry-tree',0]])play(entry.querySelector(selector),frames(index,'transform',v=>`scale(${v/.8})`),options);
     play(entry.querySelector('.title-entry-tree'),frames(12,'opacity'),options);
     play(entry.querySelector('.title-entry-characters'),frames(14,'opacity'),options);
     play(entry.querySelector('.title-entry-flash'),frames(19,'opacity'),options);
    }
    const heading=entry.querySelector('.title-entry-heading');
    if(logo){
     const binding=(node,attribute)=>logo.bindings.find(b=>b.node===node&&b.attribute===attribute);
     const sample=(b,axis,t,fallback=0)=>b?.curves[axis]?.length?value(b.curves[axis],Math.max(b.curves[axis][0].t,t)):fallback;
     const logoFrames=fn=>Array.from({length:80},(_,i)=>{const t=3.133333+i/79*(4.45-3.133333);return {offset:i/79,...fn(t)};});
     const logoOptions={duration:(4.45-3.133333)*1000/introRate,delay:3133.333/introRate};
     play(heading,[{opacity:1},{opacity:1}],logoOptions);
     play(entry.querySelector('.title-logo-wordmark'),logoFrames(t=>({transform:`scale(${sample(binding('Logo/Logo_mult',3),0,t,1)})`})),logoOptions);
     const letters=entry.querySelectorAll('.title-logo-letter');
     letters.forEach((letter,i)=>{const n=Math.round(i/Math.max(1,letters.length-1)*13)+1;const node=logo.bindings.find(b=>b.node.startsWith('Logo/Logo_mult/'+String(n).padStart(2,'0')+'_'))?.node;
      play(letter,logoFrames(t=>({opacity:t<3.216667?0:Math.min(1,sample(binding(node,304273561),0,Math.min(t,4.3),1)),transform:`rotateY(${sample(binding(node,4),1,t)}deg)`})),logoOptions);
     });
     play(entry.querySelector('.title-logo-flash'),logoFrames(t=>({opacity:t<3.683333?0:Math.max(0,Math.min(1,sample(binding('Logo/Logo_add',304273561),0,t)))})),logoOptions);
     entry.querySelectorAll('.title-logo-stars img').forEach((star,i)=>play(star,[{opacity:0,transform:'scale(0)'},{opacity:1,transform:'scale(1)'}],{fill:'both',duration:150/introRate,delay:(3800+i*50)/introRate}));
     play(heading.querySelector('em'),[{opacity:0,transform:'translateX(-12px)'},{opacity:1,transform:'translateX(0)'}],{fill:'both',duration:450/introRate,delay:4100/introRate});
    }else play(heading,[{opacity:0},{opacity:1}],{duration:650/introRate,delay:4800/introRate});
    const startFinished=play(entry.querySelector('.title-entry-start'),[{opacity:0},{opacity:1}],{duration:450/introRate,delay:5700/introRate});
    if(document.hidden)visibility();
    await startFinished;
    if(!disposed&&!entering)settleIntro();
   }catch{if(!disposed&&!entering)settleIntro();}
  })();
  const finish=()=>{
   disposed=true;animations.forEach(a=>a.cancel());
   stopMovie();
   fx?.destroy();
   document.removeEventListener('visibilitychange',visibility);
   root.classList.remove('title-entry-pending');main.inert=false;top.inert=false;entry.remove();
   window.sekaiDismissEntry=null;
  };
  window.sekaiDismissEntry=finish;
  button.addEventListener('click',async()=>{
   if(entering)return;entering=true;
   entry.inert=true;
   entry.classList.add('title-entry-exiting');
   await fxReady;if(disposed)return;fx?.exit();
   const white=play(entry.querySelector('.title-entry-wipe'),[{opacity:0},{opacity:1}],{duration:reduced?0:1500,easing:'linear'});
   const until=performance.now()+8000;
   while(!disposed&&performance.now()<until){
    const scene=document.querySelector('.unknown-scene'),ground=scene?.querySelector('.unknown-ground');
    if(ground?.complete&&ground.naturalWidth&&['true','error'].includes(scene.dataset.charactersReady)&&scene.querySelector('.unknown-effects')?.dataset.ready==='true')break;
    await new Promise(resolve=>setTimeout(resolve,80));
   }
   await white;
   if(disposed)return;
   // Keep the white transition above the UI while the router swaps to the real homepage.
   const veil=document.createElement('div');veil.className='title-entry-route-veil';veil.setAttribute('aria-hidden','true');document.body.append(veil);
   try{
    await window.sekaiNavigate((document.body.dataset.root||'/')+'live/');
    if(!reduced)await veil.animate([{opacity:1},{opacity:0}],{duration:350,easing:'ease-out',fill:'forwards'}).finished;
   }finally{veil.remove();if(!disposed)finish();}
   document.querySelector('.live-menu-reading')?.focus({preventScroll:true});
  });
  entry.querySelector('.title-entry-menu').addEventListener('click',()=>document.querySelector('.menu-toggle')?.click());
  // Keep entry keyboard access isolated, except while the menu owns its own focus trap.
  document.addEventListener('keydown',e=>{
   if(e.key!=='Tab'||!root.classList.contains('title-entry-pending')||document.body.classList.contains('menu-open'))return;
   const items=[button,entry.querySelector('.title-entry-menu'),document.querySelector('.bgm-toggle')].filter(Boolean);e.preventDefault();const index=items.indexOf(document.activeElement);items[(index+(e.shiftKey?-1:1)+items.length)%items.length].focus();
  });
 });
})();
