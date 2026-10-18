(()=>{
 'use strict';
 if(window.sekaiAudio)return;
 const root=document.body.dataset.root||'/',base=root+'game-assets/audio/';
 const controls=document.getElementById('site-audio-controls'),button=controls.querySelector('button'),status=controls.querySelector('.audio-status');
 let enabled=true;
 let context,gain,source,current='',version=0,starting=false,lastEffect=0,lastScroll=0,trackStartedAt=0,effectCount=0,lastEffectName='';
 const buffers=new Map(),effects=new Set();
 let voiceSource=null,voiceVersion=0,voiceName='',lastVoice='';
 const voiceBuffers=new Map();
 function stopVoice(){voiceVersion++;if(voiceSource){voiceSource.stop();voiceSource.disconnect();voiceSource=null;}voiceName='';}
 function preloadVoice(url){
  setup();
  if(!voiceBuffers.has(url))voiceBuffers.set(url,fetch(url).then(r=>{if(!r.ok)throw Error('voice '+r.status);return r.arrayBuffer();}).then(b=>context.decodeAudioData(b)).catch(e=>{voiceBuffers.delete(url);throw e;}));
  return voiceBuffers.get(url);
 }
 async function playVoice(url){
  stopVoice();const ticket=voiceVersion;
  if(!enabled||document.hidden)return;
  try{const data=await preloadVoice(url);if(ticket!==voiceVersion||!enabled||document.hidden)return;
   const s=context.createBufferSource(),v=context.createGain();s.buffer=data;v.gain.value=.4;s.connect(v);v.connect(context.destination);
   voiceSource=s;voiceName=url;lastVoice=url;s.onended=()=>{s.disconnect();v.disconnect();if(voiceSource===s){voiceSource=null;voiceName='';}};s.start();
  }catch(e){console.warn('Live2D voice unavailable',e);}
 }
 let manifestPromise;
 const manifest=()=>manifestPromise||(manifestPromise=fetch(base+'manifest.json').then(r=>{if(!r.ok)throw Error('audio manifest');return r.json();}).catch(e=>{manifestPromise=null;throw e;}));
 let challengeTrack='ctf-default';
 const wanted=()=>challengeTrack;
 const title=()=> '一緒に歌おう！';
 function ui(message=''){
  const playing=enabled&&context?.state==='running'&&!!source;
  button.setAttribute('aria-pressed',String(playing));button.setAttribute('aria-label',(playing?'静音':'取消静音')+'背景音乐与音效：'+title());button.title=(playing?'静音':'取消静音')+' · '+title();
  controls.inert=document.body.classList.contains('menu-open');
  if(message)status.textContent=message;
 }
 function setup(){if(context)return;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Web Audio unavailable');context=new Audio();gain=context.createGain();gain.gain.value=enabled?.112:0;gain.connect(context.destination);context.onstatechange=()=>ui();}
 async function buffer(key){
  if(!buffers.has(key))buffers.set(key,(key==='ctf-default'?fetch(root+'game-assets/ctf/theme.ogg'):manifest().then(m=>fetch(base+m[key].file))).then(r=>{if(!r.ok)throw Error('audio file');return r.arrayBuffer();}).then(data=>context.decodeAudioData(data)).catch(e=>{buffers.delete(key);throw e;}));
  return buffers.get(key);
 }
 function stop(){if(source){source.stop();source.disconnect();source=null;}current='';}
 async function sync(){
  ui();if(!context)return;
  const key=wanted();if(current===key&&(source||starting))return;
  const ticket=++version;stop();current=key;starting=true;
  try{
   const [data,m]=await Promise.all([buffer(key),manifest()]);
   if(ticket!==version)return;
   const node=context.createBufferSource();node.buffer=data;node.loop=true;
   node.loopStart=0;node.loopEnd=data.duration;
   node.connect(gain);node.start();trackStartedAt=context.currentTime;source=node;ui('正在播放 '+title());
  }catch{if(ticket===version){current='';ui('音乐加载失败，点击按钮重试');}}
  finally{if(ticket===version)starting=false;}
 }
 async function unlock(){if(document.hidden)return;try{setup();sync();await context.resume();ui();}catch{ui('点击音乐按钮开启声音');}}
 function mute(){enabled=false;stopVoice();if(gain)gain.gain.setValueAtTime(0,context.currentTime);for(const s of effects)s.stop();effects.clear();try{localStorage.setItem('sekai-audio-enabled','0');}catch{}ui('已静音，音乐继续播放');}
 button.addEventListener('click',e=>{e.stopPropagation();if(enabled&&context?.state==='running'){mute();return;}enabled=true;try{localStorage.setItem('sekai-audio-enabled','1');}catch{}setup();gain.gain.setValueAtTime(.112,context.currentTime);unlock();});
 async function effect(key){
  const now=performance.now();if(!enabled||document.hidden||now-lastEffect<65)return;lastEffect=now;
  try{setup();await context.resume();const data=await buffer(key);if(!enabled||document.hidden||performance.now()-now>450)return;
   const s=context.createBufferSource(),volume=context.createGain();s.buffer=data;volume.gain.value=key==='SE_MUSIC_SCROLL'?.064:.12;s.connect(volume);volume.connect(context.destination);
   while(effects.size>=3){const old=effects.values().next().value;effects.delete(old);old.stop();}
   effects.add(s);s.onended=()=>{effects.delete(s);s.disconnect();volume.disconnect();};s.start();effectCount++;lastEffectName=key;
  }catch{}
 }
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('#site-audio-controls'))unlock();},{capture:true,passive:true});
 document.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)&&!e.target.closest('#site-audio-controls'))unlock();},{capture:true});
 document.addEventListener('click',e=>{
  if(e.target.closest('#site-audio-controls')||!e.isTrusted)return;
  const target=e.target.closest('a,button,.menu-scrim');if(!target||target.matches(':disabled,[aria-disabled=true]'))return;
  effect(target.matches('.title-entry-enter')?'SE_TITLE_ENTER':target.matches('.game-back,.menu-close,.menu-scrim')?'SE_CANCEL_old2':target.matches('.song-row,#unit-tabs button')?'SE_MUSIC_SCROLL':'SE_DECIDE1_MUSIC');
 },true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('menu-open'))effect('SE_CANCEL_old2');},true);
 let scrollNode=null,scrollPosition=0;
 document.addEventListener('scroll',e=>{
  const node=e.target===document?document.scrollingElement:e.target;
  if(!(node instanceof Element)||(!node.matches('#song-list')&&!document.body.classList.contains('page-type-post')))return;
  const pos=node.scrollTop;if(scrollNode!==node){scrollNode=node;scrollPosition=pos;return;}
  if(Math.abs(pos-scrollPosition)<64||performance.now()-lastScroll<160)return;
  scrollPosition=pos;lastScroll=performance.now();effect('SE_MUSIC_SCROLL');
 },true);
 addEventListener('sekai-page-ready',()=>{scrollNode=null;sync();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)context?.suspend();else unlock();});
 addEventListener('pagehide',()=>context?.suspend());addEventListener('pageshow',()=>{ui();if(context)unlock();});
 async function useChallengeAudio(bytes){setup();const decoded=await context.decodeAudioData(bytes.slice(0));buffers.set('ctf-stage',Promise.resolve(decoded));challengeTrack='ctf-stage';await sync();context.resume().catch(()=>{});}
 window.sekaiAudio={useChallengeAudio,preloadVoice,playVoice,stopVoice,get state(){return {enabled,voice:voiceName,lastVoice,bgmGain:gain?.gain.value||0,track:current,playing:!!source&&context?.state==='running',contextTime:context?.currentTime||0,trackStartedAt,loopStart:source?.loopStart,loopEnd:source?.loopEnd,effects:effects.size,effectCount,lastEffectName};}};
 ui();unlock();if(wanted()==='music0001'&&context)buffer('SE_TITLE_ENTER').catch(()=>{});
})();
