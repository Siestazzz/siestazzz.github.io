/* Original title ParticleSystems; projection adaptations documented in TITLE-ENTRY.md. */
(()=>{
 const base=new URL('../game-assets/entry/',document.currentScript.src);
 const clamp=v=>Math.max(0,Math.min(1,v));
 function curve(c,t=0,r=.5){
  if(!c)return 1;
  if(c.mode===3)return c.min+(c.max-c.min)*r;
  if(c.mode!==1||!c.keys.length)return c.max;
  const k=c.keys;if(t<=k[0].time)return k[0].value*c.max;
  for(let i=1;i<k.length;i++)if(t<=k[i].time){const a=k[i-1],b=k[i],d=b.time-a.time,u=(t-a.time)/d;
   return ((2*u**3-3*u*u+1)*a.value+(u**3-2*u*u+u)*d*a.outSlope+(-2*u**3+3*u*u)*b.value+(u**3-u*u)*d*b.inSlope)*c.max;}
  return k.at(-1).value*c.max;
 }
 function alpha(keys,t){if(!keys.length)return 1;for(let i=1;i<keys.length;i++)if(t<=keys[i][0]){const a=keys[i-1],b=keys[i];return a[1]+(b[1]-a[1])*clamp((t-a[0])/(b[0]-a[0]||1));}return keys.at(-1)[1];}
 function meshPoint(mesh){
  const weighted=mesh.faces.map(f=>{const [a,b,c]=f.map(i=>mesh.vertices[i]);return {a,b,c,area:Math.abs((b[0]-a[0])*(c[2]-a[2])-(c[0]-a[0])*(b[2]-a[2]))};});
  let pick=Math.random()*weighted.reduce((s,f)=>s+f.area,0),f=weighted.at(-1);
  for(const v of weighted){pick-=v.area;if(pick<=0){f=v;break;}}
  const u=Math.sqrt(Math.random()),v=Math.random();return [0,2].map(axis=>(1-u)*f.a[axis]+u*(1-v)*f.b[axis]+u*v*f.c[axis]);
 }
 window.createSekaiTitleFX=async entry=>{
  const response=await fetch(new URL('title-fx.json',base));if(!response.ok)throw Error('title particles');const data=await response.json();
  const images={};await Promise.all([...new Set([...data.intro,...data.exit].map(g=>g.texture))].map(async name=>{const img=new Image();img.src=new URL(name,base);await img.decode();images[name]=img;}));
  const canvas=document.createElement('canvas');canvas.className='title-entry-particles';canvas.setAttribute('aria-hidden','true');entry.append(canvas);
  const lightCanvas=canvas.cloneNode();lightCanvas.classList.add('title-entry-particle-light');entry.append(lightCanvas);
  const mainContext=canvas.getContext('2d'),lightContext=lightCanvas.getContext('2d');let frame=0,start=0,exitStart=null,dead=false,paused=0,hiddenAt=0;
  const particles=[];const reduced=matchMedia('(prefers-reduced-motion: reduce)');let introRate=1;
  function make(g,birth,kind){
   const r=Math.random(),p={g,birth,kind,life:curve(g.life,0,r),size:curve(g.size,0,Math.random()),speed:curve(g.speed,0,Math.random()),angle:Math.random()*Math.PI*2,rotation:curve(g.rotation,0,Math.random()),spin:g.spin?curve(g.spin,0,Math.random()):0,tile:Math.floor(curve(g.uv.start,0,Math.random())*g.uv.x*g.uv.y),opacity:g.startAlpha[0]+Math.random()*(g.startAlpha[1]-g.startAlpha[0])};
   if(g.mesh){const [x,z]=meshPoint(g.mesh);p.x=x/1000;p.y=-z/1000;}
   else{p.x=Math.random()-.5;p.y=(Math.random()-.5)*.65;}
   particles.push(p);
  }
  function sprite(p,t,w,h){
   const g=p.g,age=t-p.birth,u=age/p.life;if(u<0||u>=1)return;
   const ctx=g.shader.includes('Additive')&&!g.shader.includes('AlphaBlend')?lightContext:mainContext;
   let opacity=alpha(g.alpha,u)*p.opacity,size=curve(g.sizeLife,u)*p.size,x,y;
   if(p.kind==='mask'){
    if(t>=3.883333)return;
    const width=Math.max(w,h*2048/1244);x=w/2+p.x*width;y=h/2+p.y*width;
    size*=width/4.65*(g.id===20?.8:1);
   }else if(p.kind==='wash'){
    if(t>=3.883333)return;
    ctx.fillStyle='white';ctx.globalAlpha=clamp(opacity);ctx.fillRect(0,0,w,h);return;
   }else if(p.kind==='glow'){
    const width=Math.max(w,h*2048/1244);x=w/2+p.x*width;y=h/2+p.y*width-age*p.speed*width/4.65;size*=width/4.65;
   }else{
    // Viewport projection for the original cone burst; not a Unity camera reconstruction.
    const unit=Math.max(w,h)/35,travel=age*p.speed*unit;
    x=w/2+Math.cos(p.angle)*travel;y=h*.62+Math.sin(p.angle)*travel;
    size*=unit;opacity*=clamp((1.5-t)/.35);
   }
   const img=images[g.texture],tw=img.width/g.uv.x,th=img.height/g.uv.y;
   const tile=Math.min(g.uv.x*g.uv.y-1,Math.max(0,p.tile+Math.floor(curve(g.uv.frame,u)*g.uv.x*g.uv.y)));
   ctx.save();ctx.globalAlpha=clamp(opacity);ctx.globalCompositeOperation=g.shader.includes('Additive')&&!g.shader.includes('AlphaBlend')?'lighter':'source-over';ctx.translate(x,y);ctx.rotate(p.rotation+p.spin*age);
   ctx.drawImage(img,(tile%g.uv.x)*tw,Math.floor(tile/g.uv.x)*th,tw,th,-size/2,-size/2,size,size);ctx.restore();
  }
  function render(now){
   frame=0;if(dead||document.hidden||reduced.matches)return;
   const w=entry.clientWidth,h=entry.clientHeight,dpr=Math.min(devicePixelRatio||1,1.5);
   for(const layer of [canvas,lightCanvas]){if(layer.width!==Math.round(w*dpr)||layer.height!==Math.round(h*dpr)){layer.width=Math.round(w*dpr);layer.height=Math.round(h*dpr);}const ctx=layer.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);}
   const t=(now-start-paused)/1000,exitT=exitStart===null?null:(now-exitStart)/1000;
   if(exitT===null){const glow=data.intro.find(g=>g.id===16);if(t>=nextGlow){make(glow,t,'glow');nextGlow=t+1/glow.rate;}}
   for(let i=particles.length-1;i>=0;i--){const p=particles[i],clock=p.kind==='exit'?exitT:p.kind==='glow'?t:t*introRate;if(clock===null)continue;if(clock-p.birth>p.life){particles.splice(i,1);continue;}}
   for(const p of particles.filter(p=>p.kind!=='exit').sort((a,b)=>a.g.order-b.g.order))sprite(p,p.kind==='glow'?t:t*introRate,w,h);
   if(exitT!==null)for(const p of particles.filter(p=>p.kind==='exit').sort((a,b)=>a.g.order-b.g.order))sprite(p,exitT,w,h);
   frame=requestAnimationFrame(render);
  }
  let nextGlow=0;
  const visible=()=>{if(document.hidden){hiddenAt=performance.now();cancelAnimationFrame(frame);frame=0;}else{const delta=performance.now()-hiddenAt;paused+=delta;if(exitStart!==null)exitStart+=delta;if(start&&!dead)frame=requestAnimationFrame(render);}};
  document.addEventListener('visibilitychange',visible);
  return {
   start(rate=1){if(dead||reduced.matches)return;introRate=rate;start=performance.now();for(const g of data.intro.filter(g=>g.id!==16))for(const b of g.bursts)for(let i=0;i<b.count;i++)make(g,.016667+b.time,g.id===21?'wash':'mask');canvas.dataset.state='intro';frame=requestAnimationFrame(render);},
   exit(){if(dead||reduced.matches)return;exitStart=performance.now();particles.length=0;for(const layer of [canvas,lightCanvas])layer.classList.add('title-entry-particles-exit');canvas.dataset.state='exit';for(const g of data.exit)for(const b of g.bursts)for(let c=0;c<b.cycles;c++)for(let i=0;i<b.count;i++)make(g,.25+g.delay+b.time+c*b.interval,'exit');if(!start)start=performance.now();if(!frame)frame=requestAnimationFrame(render);},
   destroy(){dead=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visible);particles.length=0;canvas.remove();lightCanvas.remove();}
  };
 };
})();
