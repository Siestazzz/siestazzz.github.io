(() => {
  'use strict';
  const map = document.querySelector('.unknown-scene'), home = document.body;
  if (!map || !home) return;
  const world=['5','7','8','9','10'].includes(document.documentElement.dataset.homeWorld)?document.documentElement.dataset.homeWorld:'27';map.dataset.homeWorld=world;
  const assets = (document.body.dataset.root || '/') + 'game-assets/map/';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const currentWorld = true;
  let pan = 0, gesture = null, moved = false;
  const ground=map.querySelector('.unknown-ground');
  function panLimit(viewWidth,imageWidth){
    // Keep a one-CSS-pixel safety inset for fractional zoom/layout rounding.
    return Math.max(0,Math.floor(Math.min(viewWidth*.12,(imageWidth-viewWidth)/2-1)));
  }
  function setPan(value){
    const limit=panLimit(map.getBoundingClientRect().width,ground.getBoundingClientRect().width);
    pan=Math.max(-limit,Math.min(limit,value));
    map.style.setProperty('--pan',pan+'px');
  }
  const reframe=()=>{
    const box=map.getBoundingClientRect(),size=map.sekaiSceneData?.coordinateSize||[3378.144396322671,1600];
    // One uniform scene scale: min-width + fixed height previously stretched the image box.
    const scale=Math.max(box.width*1.25/size[0],box.height*1.1/size[1]);
    Object.assign(ground.style,{width:(size[0]*scale)+'px',height:(size[1]*scale)+'px',top:((box.height-size[1]*scale)/2)+'px'});
    setPan(pan);gesture=null;home.classList.remove('is-panning');
  };
  ground.addEventListener('load',reframe);
  addEventListener('resize',reframe);
  const cameraResize=new ResizeObserver(reframe);cameraResize.observe(map);cameraResize.observe(ground);
  reframe();
  home.addEventListener('dragstart',e=>{if(home.classList.contains('page-type-index'))e.preventDefault();});
  home.addEventListener('pointerdown', e => {
    moved = false;
    if(!e.target.closest('.game-home') || e.button !== 0 || e.target.closest('a,button,input')) return;
    e.preventDefault(); // Background pan must not start browser text/image selection.
    gesture = {x:e.clientX, pan};e.target.closest('.game-home').setPointerCapture(e.pointerId);
  });
  home.addEventListener('pointermove', e => {
    if(!gesture) return;
    const dx=e.clientX-gesture.x;
    if(Math.abs(dx)>5) moved=true;
    if(!moved) return;
    setPan(gesture.pan+dx);home.classList.add('is-panning');
  });
  const finish=()=>{gesture=null;home.classList.remove('is-panning');};
  home.addEventListener('pointerup',finish);home.addEventListener('pointercancel',finish);
  home.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopImmediatePropagation();}},true);
  if(world==='27')startTree().catch(error=>console.error('SEKAI tree:',error));
  else startClassroom().catch(error=>console.error('SEKAI classroom:',error));
  async function startClassroom(){
    const ground=map.querySelector('.unknown-ground'),layer=map.querySelector('.classroom-furniture');
    const response=await fetch(assets+'area'+world+'/scene.json');if(!response.ok)throw Error('Sprite scene unavailable');
    const data=await response.json();
    const groundFile=data.groundFile||'background.png',coordinateSize=data.coordinateSize||[3378.144396322671,1600];
    ground.src=assets+'area'+world+'/'+groundFile;
    if(world!=='27'){
      const items=await fetch(assets+'area'+world+'/items.json');if(!items.ok)throw Error('Area items unavailable');
      data.sprites.push(...(await items.json()).sprites);
    }
    const sprites=data.sprites.filter(s=>s.file!==groundFile).sort((a,b)=>a.order-b.order).map(s=>{const img=document.createElement('img');img.src=assets+'area'+world+'/'+s.file;img.alt='';img.draggable=false;img.dataset.source=s.renderer;img.dataset.scenePath=s.path;(s.webLayer==='back'||(!s.webLayer&&s.order<100)?map.querySelector('.scene-back-layers'):layer).append(img);return {s,img};});
    map.sekaiSceneData=data;
    reframe();
    const paint=()=>{const bg=ground.getBoundingClientRect(),box=map.getBoundingClientRect(),sx=bg.width/coordinateSize[0],sy=bg.height/coordinateSize[1];
      map.sekaiProjection={left:bg.left-box.left,top:bg.top-box.top,width:bg.width,height:bg.height,scaleX:sx,scaleY:sy};
      for(const {s,img} of sprites){const width=s.size[0]*s.scale[0]*sx,height=s.size[1]*s.scale[1]*sy;Object.assign(img.style,{width:width+'px',height:height+'px',left:(bg.left-box.left+s.position[0]*sx-width*s.pivot[0])+'px',top:(bg.top-box.top-s.position[1]*sy-height*(1-s.pivot[1]))+'px',opacity:String(s.opacity??1),transformOrigin:`${s.pivot[0]*100}% ${(1-s.pivot[1])*100}%`,transform:s.rotation?`rotate(${-s.rotation}deg)`:''});}
      map.dispatchEvent(new Event('sekai-scene-project'));
      layer.dataset.ready='true';};
    ground.addEventListener('load',paint);addEventListener('resize',paint);new MutationObserver(paint).observe(map,{attributes:true,attributeFilter:['style']});paint();
    await Promise.all([ground,...sprites.map(s=>s.img)].map(img=>img.decode().catch(()=>{})));
    map.dataset.spritesReady='true';map.dispatchEvent(new Event('sekai-scene-ready'));
    if(world==='9'){const script=document.createElement('script');script.src=(document.body.dataset.root||'/')+'js/area9-motion.js';document.body.append(script);}
  }
  async function startTree() {
    const canvas = map.querySelector('.unknown-tree');
    const context = new spine.ManagedWebGLRenderingContext(canvas, {alpha:true, premultipliedAlpha:true});
    const gl = context.gl;
    const manager = new spine.AssetManager(context, assets);
    const name = 'sd_world_link_wish_tree';
    manager.loadBinary(name + '.skel');manager.loadTextureAtlas(name + '.atlas');
    await new Promise((resolve, reject) => {
      function check() {
        if (manager.hasErrors()) return reject(new Error(JSON.stringify(manager.getErrors())));
        if (manager.isLoadingComplete()) return resolve();
        requestAnimationFrame(check);
      } check();
    });
    const loader = new spine.SkeletonBinary(new spine.AtlasAttachmentLoader(manager.require(name + '.atlas')));
    const data = loader.readSkeletonData(manager.require(name + '.skel'));
    const skeleton = new spine.Skeleton(data);
    skeleton.setToSetupPose();skeleton.updateWorldTransform();
    const offset = new spine.Vector2(), size = new spine.Vector2();skeleton.getBounds(offset, size, []);
    const state = new spine.AnimationState(new spine.AnimationStateData(data));
    const idle = data.animations.find(a => /idle|wait|loop/i.test(a.name)) || data.animations[0];
    if (idle) state.setAnimation(0, idle.name, true);
    const sway = data.findAnimation('wish_tree_common_sway_01');
    home.addEventListener('click', e => {
      if(!e.target.closest('.game-home'))return;
      const box = canvas.getBoundingClientRect();
      if (reduced.matches || !sway || e.clientX < box.left + box.width * .12 || e.clientX > box.right - box.width * .12 || e.clientY > box.bottom) return;
      state.setAnimation(0, sway.name, false);
      if (idle) state.addAnimation(0, idle.name, true, 0);
    });
    canvas.dataset.animations = data.animations.map(a => a.name).join(',');
    canvas.dataset.animation = idle?.name || 'setup';
    const shader = spine.Shader.newTwoColoredTextured(context), batcher = new spine.PolygonBatcher(context);
    const renderer = new spine.SkeletonRenderer(context), matrix = new spine.Matrix4();
    renderer.premultipliedAlpha = true;
    let previous = performance.now();
    function frame(now) {
      requestAnimationFrame(frame);
      const delta = Math.min((now - previous) / 1000, .05);previous = now;
      if (!currentWorld || document.hidden) return;
      const width = Math.round(canvas.clientWidth * Math.min(devicePixelRatio,2)), height = Math.round(canvas.clientHeight * Math.min(devicePixelRatio,2));
      if (canvas.width !== width || canvas.height !== height) {canvas.width = width;canvas.height = height;}
      const aspect = width / height, viewHeight = Math.max(size.y * 1.05, size.x / aspect * 1.05), viewWidth = viewHeight * aspect;
      matrix.ortho2d(offset.x + size.x / 2 - viewWidth / 2, offset.y + size.y / 2 - viewHeight / 2, viewWidth, viewHeight);
      // The independently loaded original idle FX share this skeleton-space camera.
      canvas.sekaiProjection = {left:offset.x+size.x/2-viewWidth/2,bottom:offset.y+size.y/2-viewHeight/2,width:viewWidth,height:viewHeight};
      gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      if (!reduced.matches) state.update(delta);
      state.apply(skeleton);skeleton.updateWorldTransform();
      shader.bind();shader.setUniformi(spine.Shader.SAMPLER,0);shader.setUniform4x4f(spine.Shader.MVP_MATRIX,matrix.values);
      batcher.begin(shader);renderer.draw(batcher,skeleton);batcher.end();shader.unbind();
      if(canvas.dataset.loaded!=='true'){canvas.dataset.loaded='true';canvas.dispatchEvent(new Event('sekai-tree-ready'));}
    }
    requestAnimationFrame(frame);
  }

})();
