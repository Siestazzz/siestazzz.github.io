/* Original area_sd Spine rigs + actionset timelines. Evidence: pjskapk/CHARACTERS.md. */
(() => {
  'use strict';
  const scene=document.querySelector('.unknown-scene'),home=document.querySelector('.game-home') || scene;
  if(!scene||!home)return;
  const world=document.documentElement.dataset.homeWorld||'27';
  const root=(document.body.dataset.root||'/')+'game-assets/characters/';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const layer=document.createElement('div');layer.className='home-characters';
  const canvas=document.createElement('canvas');layer.append(canvas);
  scene.querySelector('.unknown-landscape').append(layer);
  let stopped=false,frameId=0,resume=null;
  addEventListener('pagehide',()=>{stopped=true;cancelAnimationFrame(frameId);});
  addEventListener('pageshow',e=>{if(e.persisted){stopped=false;resume?.();}});
  start().catch(error=>{scene.dataset.charactersReady='error';console.error('SEKAI characters:',error);});
  async function start(){
    const response=await fetch(root+'plans.json');if(!response.ok)throw Error('Character plans unavailable');
    const plan=(await response.json())[world],v2=world==='27';
    const balloonImage=new Image();balloonImage.src=root+'bg_base_r30_wh.png';await balloonImage.decode();
    const base=v2?'base-v2/v2_sd_main':'base/sd_main';
    const context=new spine.ManagedWebGLRenderingContext(canvas,{alpha:true,premultipliedAlpha:true});
    const gl=context.gl,manager=new spine.AssetManager(context,root);
    manager.loadBinary(base+'.skel');manager.loadTextureAtlas(base+'.atlas');
    for(const a of plan.actors)manager.loadTextureAtlas(a.asset+'/sekai_atlas.atlas');
    await new Promise((resolve,reject)=>{function poll(){if(stopped)return resolve();if(manager.hasErrors())return reject(Error(JSON.stringify(manager.getErrors())));if(manager.isLoadingComplete())return resolve();requestAnimationFrame(poll);}poll();});
    if(stopped){manager.dispose();return;}
    const baseAtlas=manager.require(base+'.atlas');
    const actors=plan.actors.map((a,i)=>{
      const atlas=manager.require(a.asset+'/sekai_atlas.atlas');
      const loader=new spine.SkeletonBinary(new spine.AtlasAttachmentLoader({findRegion:name=>atlas.findRegion(name)||baseAtlas.findRegion(name)}));
      const data=loader.readSkeletonData(manager.require(base+'.skel'));
      const skeleton=new spine.Skeleton(data),stateData=new spine.AnimationStateData(data);stateData.defaultMix=.2;
      const state=new spine.AnimationState(stateData),detail=plan.script.Details[i];
      for(const path of detail.ActionPaths)if(!data.findAnimation(path.MotionName))throw Error('Missing original motion '+path.MotionName);
      const bubble=document.createElement('div');bubble.className='character-balloon';bubble.lang='ja';bubble.hidden=true;layer.append(bubble);
      const surface=document.createElementNS('http://www.w3.org/2000/svg','svg');surface.classList.add('character-surface');surface.setAttribute('aria-hidden','true');bubble.append(surface);
      const drawSurface=()=>{
        if(bubble.hidden)return;
        const {width:w,height:h}=bubble.getBoundingClientRect(),r=18;
        surface.setAttribute('viewBox',`0 0 ${w} ${h}`);surface.replaceChildren();
        function node(tag,attrs,parent=surface){const n=document.createElementNS(surface.namespaceURI,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));parent.append(n);return n;}
        // One composited surface: solid original-white center overlaps the four original 34px corners.
        node('path',{fill:'#fff',d:`M${r-1} 0H${w-r+1}V${h}H${r-1}ZM0 ${r-1}H${w}V${h-r+1}H0Z`});
        for(const [x,y,sx,sy]of [[0,0,0,0],[w-r,0,36,0],[0,h-r,0,36],[w-r,h-r,36,36]]){
          const corner=node('svg',{x,y,width:r,height:r,viewBox:`${sx} ${sy} 34 34`,overflow:'hidden'});
          node('image',{href:balloonImage.src,width:70,height:70},corner);
        }
      };
      new ResizeObserver(drawSurface).observe(bubble);
      const measure=document.createElement('span'),words=document.createElement('span');measure.className='character-text-measure';words.className='character-words';bubble.append(measure,words);
      skeleton.setToSetupPose();state.setAnimation(0,detail.ActionPaths[0].MotionName,true);state.apply(skeleton);skeleton.updateWorldTransform();
      const offset=new spine.Vector2(),size=new spine.Vector2();skeleton.getBounds(offset,size,[]);
      return {a,detail,data,skeleton,state,bubble,measure,words,size,offset,pathIndex:-1,clock:0};
    });
    const shader=spine.Shader.newTwoColoredTextured(context),batcher=new spine.PolygonBatcher(context),renderer=new spine.SkeletonRenderer(context),matrix=new spine.Matrix4();
    renderer.premultipliedAlpha=true;
    const grid=plan.grid[0].data;
    canvas.sekaiCharacters=actors;
    let previous=performance.now(),elapsed=0,contextLost=false;
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;});
    canvas.addEventListener('webglcontextrestored',()=>location.reload());
    // Only the original action timeline controls speech; clicks never seek/restart it.
    function frame(now){
      if(stopped)return;frameId=requestAnimationFrame(frame);
      const dt=Math.min((now-previous)/1000,.05);previous=now;
      if(document.hidden||contextLost)return;
      const box=scene.getBoundingClientRect(),bg=scene.querySelector('.unknown-ground').getBoundingClientRect();
      const coords=scene.sekaiSceneData?.coordinateSize||[3378.144396322671,1600];
      const sx=bg.width/coords[0],sy=bg.height/coords[1],left=bg.left-box.left,top=bg.top-box.top;
      const dpr=Math.min(devicePixelRatio,2),w=Math.round(box.width*dpr),h=Math.round(box.height*dpr);
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);matrix.ortho2d(0,0,box.width,box.height);
      shader.bind();shader.setUniformi(spine.Shader.SAMPLER,0);shader.setUniform4x4f(spine.Shader.MVP_MATRIX,matrix.values);batcher.begin(shader);
      // Draw the rear row first. The webpage uses shared 2D projection, not Unity's camera depth.
      for(const actor of [...actors].sort((a,b)=>a.detail.ActionPaths[0].CellPosition.y-b.detail.ActionPaths[0].CellPosition.y)){
        const {detail,skeleton,state,bubble}=actor;
        // AreaClock: timeSpeed=600, TICK_UNIT=300 => two ticks / second at TimeScale=1.
        actor.clock=(actor.clock+dt*2)%detail.TotalTick;
        const tick=actor.clock;
        let index=detail.ActionPaths.findIndex((p,i,ps)=>tick>=p.TickToPlayProgress&&(i===ps.length-1||tick<ps[i+1].TickToPlayProgress));if(index<0)index=0;
        const path=detail.ActionPaths[index];
        if(index!==actor.pathIndex){state.setAnimation(0,path.MotionName,true);actor.pathIndex=index;}
        if(!reduced.matches)state.update(dt);state.apply(skeleton);
        const pos=path.CellPosition;
        const x=left+(pos.x*grid.CellSize.x+grid.Offset.x)*sx,y=top+(pos.y*grid.CellSize.y-grid.Offset.y)*sy;
        // AreaObjectCharacter..cctor / BuildSpineModel: spineCharacterScaleRatio=(0.6,0.6).
        const scale=.6;
        // The original rig faces LEFT without a flip. UpdateDirectionSideView sets FlipX=true for Right(4).
        skeleton.scaleX=(path.Direction===4?-1:1)*scale*sx;skeleton.scaleY=scale*sy;skeleton.x=x;skeleton.y=box.height-y;
        skeleton.updateWorldTransform();renderer.draw(batcher,skeleton);
        const height=actor.size.y*scale*sy,width=actor.size.x*scale*sx;
        actor.hit={x:x-width/2,y:y-height,w:width,h:height};
        const b=detail.Balloons[path.BalloonIndex],local=tick-path.TickToPlayProgress;
        const show=b&&local>=b.DelayTick&&local<b.DelayTick+b.ShowTick;
        bubble.hidden=!show;
        // ShowDependAreaClock passes 0.75 * Size.y; base collision 720.46 * model scale .6.
        // AreaTalkBalloon adds BalloonPositionOffsetY=30. Camera projection remains a web adaptation.
        if(show){
          if(actor.measure.textContent!==b.Message)actor.measure.textContent=b.Message;
          // AreaTalkBalloon.ShowWords.MoveNext: 0.075 seconds per character at TimeScale=1.
          const copy=reduced.matches?b.Message:b.Message.slice(0,Math.floor((local-b.DelayTick)/2/.075));
          if(actor.words.textContent!==copy)actor.words.textContent=copy;
          Object.assign(bubble.style,{left:x+'px',top:(y-(720.46*.6*.75+30)*sy)+'px',fontSize:Math.max(11,32*sy)+'px',maxWidth:Math.max(140,420*sx)+'px'});
        }
      }
      batcher.end();shader.unbind();
      if(!reduced.matches)elapsed+=dt;
      canvas.dataset.elapsed=elapsed.toFixed(2);canvas.dataset.motions=actors.map(a=>a.detail.ActionPaths[a.pathIndex].MotionName).join(',');
      scene.dataset.charactersReady='true';scene.dataset.characterCount=String(actors.length);
    }
    resume=()=>{previous=performance.now();frameId=requestAnimationFrame(frame);};resume();
  }
})();
