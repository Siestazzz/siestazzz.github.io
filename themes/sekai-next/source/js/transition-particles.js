/* Original UIParticle billboard atlas/curves. Screen cone projection is a web adaptation. */
(()=>{
 const base=new URL('../game-assets/map/transition/',document.currentScript.src);
 let pending;
 const load=()=>pending||(pending=fetch(new URL('particles-raw.json',base)).then(r=>{if(!r.ok)throw Error('Transition data');return r.json();}).then(async data=>{
   const groups=data.groups.filter(g=>g.id!==23),images=new Map();
   await Promise.all([...new Set(groups.map(g=>g.textures[0].file))].map(file=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{images.set(file,image);resolve();};image.onerror=reject;image.src=new URL(file,base);})));return {groups,images};
 }));
 if(document.querySelector('.sekai-map'))load().catch(console.warn);
 function sample(keys,t){
   if(!keys.length)return 1;if(t<=keys[0].time)return keys[0].value;
   for(let i=1;i<keys.length;i++)if(t<=keys[i].time){const a=keys[i-1],b=keys[i],dt=b.time-a.time,u=(t-a.time)/dt;
     return (2*u*u*u-3*u*u+1)*a.value+(u*u*u-2*u*u+u)*dt*a.outSlope+(-2*u*u*u+3*u*u)*b.value+(u*u*u-u*u)*dt*b.inSlope;
   }return keys.at(-1).value;
 }
 function curve(c,t,r){if(c.minMaxState===0)return c.scalar;if(c.minMaxState===3)return c.minScalar+(c.scalar-c.minScalar)*r;
   const hi=sample(c.maxCurve.m_Curve,t)*c.scalar;return c.minMaxState===2?sample(c.minCurve.m_Curve,t)*c.scalar*(1-r)+hi*r:hi;}
 function opacity(gradient,t){
   for(let i=1;i<gradient.m_NumAlphaKeys;i++){const a=gradient['atime'+(i-1)]/65535,b=gradient['atime'+i]/65535;if(t<=b)return gradient['key'+(i-1)].a+(gradient['key'+i].a-gradient['key'+(i-1)].a)*Math.max(0,(t-a)/(b-a||1));}
   return gradient['key'+(gradient.m_NumAlphaKeys-1)].a;
 }
 window.sekaiTransitionParticles=(host,epoch)=>{
   const canvas=document.createElement('canvas');canvas.className='world-transfer-particles';host.prepend(canvas);
   const ctx=canvas.getContext('2d');let frame=0,stopped=false;
   const dispose=()=>{stopped=true;cancelAnimationFrame(frame);};host.disposeParticles=dispose;
   if(!ctx||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   load().then(({groups,images})=>{
     if(stopped||!host.isConnected)return;
     const particles=[];
     for(const g of groups){const d=g.data,ini=d.InitialModule,emit=d.EmissionModule;
       const births=[];
       for(const burst of emit.m_Bursts)for(let cycle=0;cycle<Math.max(1,burst.cycleCount);cycle++)for(let i=0;i<burst.countCurve.scalar;i++)births.push(burst.time+cycle*burst.repeatInterval);
       if(emit.enabled&&emit.rateOverTime.scalar>0)for(let t=0;t<d.lengthInSec;t+=1/emit.rateOverTime.scalar)births.push(t);
       births.forEach((birth,i)=>{const r=Math.random(),angle=2*Math.PI*(i+Math.random())/births.length;
         particles.push({g,r,angle,birth:birth+curve(d.startDelay,0,r),life:curve(ini.startLifetime,0,r),speed:curve(ini.startSpeed,0,r),size:curve(ini.startSize,0,r),rotation:curve(ini.startRotation,0,r),radius:d.ShapeModule.radius.value*Math.sqrt(Math.random()),tile:Math.floor(curve(d.UVModule.startFrame,0,Math.random())*d.UVModule.tilesX*d.UVModule.tilesY)});
       });
     }
     canvas.dataset.particles=particles.length;
     function draw(){
       if(stopped||!host.isConnected)return;
       const time=(Date.now()-epoch)/1000,w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio,1.5),unit=Math.min(w,h)/20;
       if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
       ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);let visible=0;
       for(const p of particles){const age=time-p.birth;if(age<0||age>p.life)continue;const t=age/p.life,d=p.g.data,uv=d.UVModule;
         const radial=p.g.id===21||p.g.id===24,dist=radial?(p.radius+p.speed*age*Math.sin(d.ShapeModule.angle*Math.PI/180))*unit:0;
         const size=p.size*(d.SizeModule.enabled?curve(d.SizeModule.curve,t,p.r):1)*unit;
         const alpha=d.InitialModule.startColor.maxColor.a*(d.ColorModule.enabled?opacity(d.ColorModule.gradient.maxGradient,t):1);
         const image=images.get(p.g.textures[0].file),cols=uv.enabled?uv.tilesX:1,rows=uv.enabled?uv.tilesY:1;
         const tile=(p.tile+(uv.enabled?Math.floor(curve(uv.frameOverTime,t,p.r)*cols*rows):0))%(cols*rows),tw=image.width/cols,th=image.height/rows;
         ctx.save();ctx.translate(w/2+Math.cos(p.angle)*dist,h/2+Math.sin(p.angle)*dist);
         ctx.rotate(p.rotation+(d.RotationModule.enabled?curve(d.RotationModule.curve,t,p.r)*age:0));ctx.globalAlpha=Math.max(0,Math.min(1,alpha));
         ctx.globalCompositeOperation=radial?'source-over':'lighter';
         ctx.drawImage(image,tile%cols*tw,Math.floor(tile/cols)*th,tw,th,-size/2,-size/2,size,size);ctx.restore();visible++;
       }
       canvas.dataset.elapsed=time.toFixed(3);canvas.dataset.visible=visible;
       if(time<5)frame=requestAnimationFrame(draw);
     }draw();
   }).catch(error=>console.warn('Transition particles unavailable',error));
 };
})();
