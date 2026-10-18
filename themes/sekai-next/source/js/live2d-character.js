/* One persistent renderer/model. Scene-page mounts own only DOM and listeners. */
(()=>{
 const scriptURL=document.currentScript.src,base=new URL('../',scriptURL);
 const names={ichika:'星乃一歌',rin:'镜音铃',len:'镜音连',miku:'初音未来'};
 const state={app:null,model:null,key:null,host:null,talks:[],config:null,loading:0,busy:false,nextTalk:0,clock:0};
 let libraries,observer;
 function loadScript(file){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL('vendor/live2d/'+file,base);s.onload=resolve;s.onerror=()=>{s.remove();reject(Error('无法加载 '+file));};document.head.append(s);});}
 function prepare(){return libraries||(libraries=(async()=>{await loadScript('cubismcore-05.min.js');await loadScript('pixi-7.4.3.min.js');await loadScript('mulmotion-0.5.1.min.js');})().catch(e=>{libraries=null;throw e;}));}
 const paused=()=>!state.host||state.host.dataset.ready!=='true'||document.hidden||document.documentElement.classList.contains('title-entry-pending');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function renderOnce(){if(!state.app||!state.model)return;state.model.update(16.67);state.app.renderer.render(state.app.stage);}
 function warmPose(){
  const m=state.model;
  // update() only accumulates time in mulmotion 0.5.1; _render normally evaluates it.
  // Evaluate every hidden step explicitly, without 90 unnecessary GPU draws.
  for(let i=0;i<45;i++){
   state.clock+=1/60;m.update(1000/60);
   m.internalModel.update(m.deltaTime,m.elapsedTime);m.deltaTime=0;
  }
 }
 function visibility(){if(!state.app)return;if(paused()||reduced.matches)state.app.stop();else state.app.start();}
 function fit(){if(!state.host||!state.app)return;const box=state.host.querySelector('.live2d-viewport');const w=box.clientWidth,h=box.clientHeight;if(!w||!h)return;state.app.renderer.resize(w,h);if(state.model){const m=state.model,mobile=innerWidth<=700;const scale=Math.min(w/m.internalModel.originalWidth,h/m.internalModel.originalHeight)*(mobile?1.55:2.6);m.scale.set(scale);m.anchor.set(.5,0);m.position.set(w*.5,h*(mobile?-.065:-.38));renderOnce();}}
 function setLine(text){if(state.host)state.host.querySelector('.live2d-line').textContent=text;}
 function idle(){if(!state.model)return Promise.resolve();return state.model.parallelMotion([{group:'Idle',index:0,priority:3},{group:'Expression',index:0,priority:3,toLastFrame:true}]);}
 const voiceURL=t=>new URL('game-assets/live2d/'+state.key+'/'+t.voice+'.ogg',base).href;
 async function playTalk(){
  const m=state.model,host=state.host,t=state.talks[state.nextTalk++%state.talks.length];state.busy=true;
  try{
   const refs=state.config.FileReferences.Motions;
   // Adjacent lines can share an expression; clear reservations so it can restart.
   for(const manager of m.internalModel.parallelMotionManager)manager.stopAllMotions();
   const result=await m.parallelMotion([{group:'Motion',index:refs.Motion.findIndex(r=>r.Name===t.motion),priority:3},{group:'Expression',index:refs.Expression.findIndex(r=>r.Name===t.expression),priority:3}]);
   if(m!==state.model||host!==state.host)return;
   if(result.some(v=>!v))throw Error('动作未能开始');
   setLine(t.serif);host.dataset.talkId=t.id;host.dataset.motion=t.motion;host.dataset.expression=t.expression;
   host.dataset.voice=t.voice;
   if(host.dataset.ready==='true'){window.sekaiAudio?.stopVoice();if(t.voice)window.sekaiAudio?.playVoice(voiceURL(t));}
   if(reduced.matches)renderOnce();
  }finally{state.busy=false;}
 }
 async function talk(){
  if(!state.model||state.busy||!state.host||state.host.dataset.ready!=='true')return;
  try{await playTalk();}catch(e){console.warn('Live2D interaction',e);}
 }
 async function select(key){
  const host=state.host;if(!host)return;
  const ticket=++state.loading;host.dataset.ready='false';host.dataset.character=key;host.querySelector('.live2d-fallback').hidden=false;delete host.dataset.talkId;delete host.dataset.motion;delete host.dataset.expression;
  window.sekaiAudio?.stopVoice();state.app?.stop();host.querySelector('.live2d-tap').setAttribute('aria-label',names[key]+'：点击播放动作和台词');setLine('正在加载模型…');
  try{
   await prepare();if(ticket!==state.loading||host!==state.host)return;
   if(!state.app){
    state.app=new PIXI.Application({width:1,height:1,backgroundAlpha:0,antialias:true,autoDensity:true,resolution:Math.min(devicePixelRatio,1.5),autoStart:false,sharedTicker:false});
    state.app.view.setAttribute('aria-hidden','true');state.app.ticker.maxFPS=60;
    state.app.ticker.add(()=>{if(paused()||!state.model)return;const dt=Math.min(state.app.ticker.deltaMS,50);state.clock+=dt/1000;state.model.update(dt);});
   }
   host.querySelector('.live2d-viewport').append(state.app.view);
   if(state.key!==key||!state.model){
    const dir=new URL('game-assets/live2d/'+key+'/',base);
    const get=async file=>{const r=await fetch(new URL(file,dir));if(!r.ok)throw Error(file+' '+r.status);return r.json();};
    const [config,talkData]=await Promise.all([get(key+'.model3.json'),get('talks.json')]);
    if(ticket!==state.loading||host!==state.host)return;
    config.url=new URL(key+'.model3.json',dir).href;
    for(const t of talkData.items)if(t.voice)window.sekaiAudio?.preloadVoice(new URL(t.voice+'.ogg',dir).href).catch(()=>{});
    const model=await PIXI.live2d.Live2DModel.from(config,{autoUpdate:false,autoFocus:false,autoHitTest:false,idleMotionGroup:'__manual__',motionPreload:'ALL'});
    if(ticket!==state.loading||host!==state.host){model.destroy({children:true,texture:true,baseTexture:true});return;}
    if(state.model){state.app.stage.removeChild(state.model);state.model.destroy({children:true,texture:true,baseTexture:true});}
    state.model=model;state.key=key;state.config=config;state.talks=talkData.items;state.nextTalk=0;
    const internal=model.internalModel;
    internal.coreModel.setOverwriteFlagForModelCullings?.(true);
    // A small Web idle breath, not a claim about the game's controller parameters.
    const ids=internal.coreModel._parameterIds||[];
    const breathId=['PARAM_BREATH','ParamBreath'].find(id=>ids.includes(id));
    internal.breath?.setParameters(breathId?[{parameterId:breathId,offset:0,peak:.5,cycle:3.2,weight:.5}]:[]);
    // Original model JSON has an empty EyeBlink group. Web timing, real eye parameters.
    const eyes=['PARAM_EYE_L_OPEN','PARAM_EYE_R_OPEN','ParamEyeLOpen','ParamEyeROpen'].filter(id=>ids.includes(id));
    internal.on('beforeModelUpdate',()=>{if(reduced.matches)return;const phase=state.clock%4.5;const openness=phase<.15?1-phase/.15:phase<.30?(phase-.15)/.15:1;for(const id of eyes)internal.coreModel.setParameterValueById(id,internal.coreModel.getParameterValueById(id)*openness);});
    state.app.stage.addChild(model);
   }
   // Dialogue clips may animate only head/face. Seed the body's base pose first.
   await idle();
   if(ticket!==state.loading||host!==state.host)return;
   warmPose();
   state.nextTalk=0;
   await playTalk();
   if(ticket!==state.loading||host!==state.host)return;
   // Resolve the first dialogue's .5s motion fade and physics offscreen, not Idle.
   warmPose();
   fit();
   // Do not spend the reveal underneath the title's white route veil.
   while(document.querySelector('.title-entry-route-veil')||document.hidden){
    await new Promise(resolve=>setTimeout(resolve,50));
    if(ticket!==state.loading||host!==state.host)return;
   }
   host.dataset.ready='true';host.querySelector('.live2d-fallback').hidden=true;
   if(state.talks[0].voice)window.sekaiAudio?.playVoice(voiceURL(state.talks[0]));
   visibility();
  }catch(e){if(host!==state.host||ticket!==state.loading)return;console.warn('Live2D loading failed',e);host.dataset.ready='error';host.querySelector('.live2d-fallback').hidden=false;setLine('模型加载失败，点击立绘或文字框重试。');}
 }
 window.SekaiPages.register('live2d-character',scope=>{
  const host=document.querySelector('[data-live2d-host]');if(!host)return;
  state.host=host;let started=false;
  const start=()=>{if(started||document.documentElement.classList.contains('title-entry-pending'))return;started=true;select('miku');};
  observer=new ResizeObserver(fit);observer.observe(host.querySelector('.live2d-viewport'));
  const entryObserver=new MutationObserver(()=>{start();visibility();});entryObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  const interact=()=>host.dataset.ready==='error'?select(host.dataset.character):talk();
  scope.listen(host.querySelector('.live2d-tap'),'click',interact);scope.listen(host.querySelector('.live2d-talk'),'click',interact);
  scope.listen(document,'visibilitychange',visibility);scope.listen(reduced,'change',()=>{visibility();renderOnce();});
  start();
  scope.cleanup(()=>{window.sekaiAudio?.stopVoice();state.loading++;state.host=null;state.app?.stop();state.app?.view.remove();observer.disconnect();entryObserver.disconnect();});
 });
 // Read-only diagnostics for local regression tests; no model mutation interface.
 window.sekaiLive2DDiagnostics=()=>({character:state.key,loaded:!!state.model,running:!!state.app?.ticker.started,clock:state.clock,parameters:state.model?Array.from(state.model.internalModel.coreModel._parameterValues):[],renderer:state.app?.renderer,model:state.model});
 addEventListener('pagehide',()=>state.app?.stop());addEventListener('pageshow',visibility);
})();
