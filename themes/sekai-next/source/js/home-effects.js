/* area5/area27 particle groups. Evidence: pjskapk/CLASSROOM.md, AREA27-EFFECTS.md.
 * Original atlases/meshes/curves; Unity-to-browser projection is explicitly adapted. */
(() => {
  'use strict';
  const scene=document.querySelector('.unknown-scene');if(!scene)return;
  const cloudCanvas=scene.querySelector('.unknown-clouds'),cloud=cloudCanvas.getContext('2d');
  const canvas=scene.querySelector('.unknown-effects'),gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});
  const world=['5','7','8','9','10'].includes(document.documentElement.dataset.homeWorld)?document.documentElement.dataset.homeWorld:'27';
  const base=new URL('../game-assets/map/area'+world+'/',document.currentScript.src);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const images=new Map(),textures=new Map();let groups=[],raf=0,elapsed=0,previous=0,program,lost=false;
  const mix=(a,b,t)=>a+(b-a)*t;
  function keys(list,t,column=1,step=false){
    if(!list?.length)return 1;if(t<=list[0][0])return list[0][column];
    for(let i=1;i<list.length;i++)if(t<=list[i][0])return step?list[i-1][column]:mix(list[i-1][column],list[i][column],(t-list[i-1][0])/(list[i][0]-list[i-1][0]||1));
    return list.at(-1)[column];
  }
  function curve(c,t,r){
    if(c.mode===0)return c.max;if(c.mode===3)return mix(c.min,c.max,r);
    const sample=k=>keys(k.map(v=>[v.time,v.value]),t)*c.max;
    return c.mode===2?mix(sample(c.minKeys),sample(c.keys),r):sample(c.keys);
  }
  const vec=o=>[o.x,o.y,o.z||0];
  function rotate(v,a){
    const [x,y,z]=v,[rx,ry,rz]=a,x1=x*Math.cos(rz)-y*Math.sin(rz),y1=x*Math.sin(rz)+y*Math.cos(rz);
    const y2=y1*Math.cos(rx)-z*Math.sin(rx),z2=y1*Math.sin(rx)+z*Math.cos(rx);
    return [x1*Math.cos(ry)+z2*Math.sin(ry),y2,-x1*Math.sin(ry)+z2*Math.cos(ry)];
  }
  function populate(g){
    // Stable mean for random emission rates; constant rates retain their original value.
    if(world!=='27'&&g.rateCurve)g.rate=(curve(g.rateCurve,0,0)+curve(g.rateCurve,0,1))/2;
    const lifeMean=(curve(g.life,0,0)+curve(g.life,0,1))/2;
    const burst=g.bursts.reduce((n,b)=>n+b.countCurve.scalar,0);
    const scheduled=world!=='27'&&g.rate>0&&!burst;
    const count=g.kind==='cloud'&&world==='27'?1:Math.min(g.maxParticles,Math.ceil(g.rate*(scheduled?Math.max(curve(g.life,0,0),curve(g.life,0,1)):lifeMean)+burst),200);
    g.particles=Array.from({length:count},(_,i)=>{
      const r=Math.random(),life=Math.max(.05,curve(g.life,0,r));
      return {r,life,sector:i,sectors:count,generation:-1,cycle:scheduled?count/g.rate:life,phase:scheduled?i/g.rate:Math.random()*life,xyz:[Math.random()-.5,Math.random()-.5,Math.random()-.5],spin:g.spin.map(c=>curve(c,0,Math.random())),rotation:g.rotation.map((c,i)=>i<2&&!g.rotation3D?0:curve(c,0,Math.random())),velocity:g.velocity.map(c=>curve(c,0,Math.random())),color:Math.random()};
    });
    if(['7','8','9','10'].includes(world)){
      const slots=[];
      for(let i=0;i<Math.ceil(g.rate*g.duration);i++)slots.push(i/g.rate);
      for(const b of g.bursts)for(let cycle=0;cycle<b.cycleCount;cycle++){
        const time=b.time+cycle*b.repeatInterval;
        if(time>=g.duration||Math.random()>b.probability)continue;
        const n=Math.round(b.countCurve.minMaxState===3?mix(b.countCurve.minScalar,b.countCurve.scalar,Math.random()):b.countCurve.scalar);
        for(let i=0;i<n;i++)slots.push(time);
      }
      // Repeat the authored emission timeline, including both 0s and 5s spotlight bursts.
      const prototype=g.particles[0],copies=Math.max(1,Math.ceil(Math.max(curve(g.life,0,0),curve(g.life,0,1))/g.duration)),period=g.duration*copies;
      const timeline=Array.from({length:copies},(_,i)=>slots.map(time=>time+i*g.duration)).flat();
      g.particles=timeline.slice(0,g.maxParticles).map((time,i)=>{
        const r=Math.random();return {...prototype,r,life:Math.max(.05,curve(g.life,0,r)),cycle:period,phase:period-time,sector:i,sectors:timeline.length,xyz:[Math.random()-.5,Math.random()-.5,Math.random()-.5],rotation:g.rotation.map((c,j)=>j<2&&!g.rotation3D?0:curve(c,0,Math.random())),velocity:g.velocity.map(c=>curve(c,0,Math.random())),color:Math.random()};
      });
    }
  }
  function tint(g,p,t){
    const s=g.startColor;let c=s.mode===4?[1,2,3].map(i=>keys(s.gradient.color,p.color,i,s.gradient.mode===1)):[s.color.r,s.color.g,s.color.b];
    let a=s.mode===4?keys(s.gradient.alpha,p.color):s.color.a;
    if(g.color){c=c.map((v,i)=>v*keys(g.color.color,t,i+1,g.color.mode===1));a*=keys(g.color.alpha,t);}
    return [...c,a];
  }
  function tile(g,p,t){
    if(!g.uv.enabled)return [0,0,1,1];const u=g.uv,n=u.x*u.y;
    const idx=Math.min(n-1,Math.floor(((curve(u.start,0,p.r)+curve(u.frame,t,p.r)*u.cycles)%1)*n));
    return [idx%u.x,Math.floor(idx/u.x),u.x,u.y];
  }
  function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  function setupGL(){
    if(!gl)return;
    program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,`attribute vec2 pos;attribute vec2 uv;attribute vec4 color;attribute float light;varying vec2 vUv;varying vec4 vColor;varying float vLight;void main(){gl_Position=vec4(pos,0.,1.);vUv=uv;vColor=color;vLight=light;}`));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision mediump float;uniform sampler2D mainTex;uniform sampler2D lightTex;uniform float additive;varying vec2 vUv;varying vec4 vColor;varying float vLight;void main(){vec4 c=mix(texture2D(mainTex,vUv),texture2D(lightTex,vUv),vLight)*vColor;c.rgb*=c.a;if(additive>.5)c.a=0.;gl_FragColor=c;}`));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
    for(const [name,n,offset] of [['pos',2,0],['uv',2,8],['color',4,16],['light',1,32]]){const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,n,gl.FLOAT,false,36,offset);}
    gl.uniform1i(gl.getUniformLocation(program,'mainTex'),0);gl.uniform1i(gl.getUniformLocation(program,'lightTex'),1);gl.enable(gl.BLEND);
    for(const [name,img] of images){const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);for(const [p,v] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,p,v);textures.set(name,tex);}
  }
  function draw(now){
    raf=0;if(document.hidden||lost)return;
    if(previous&&!reduced.matches)elapsed+=Math.min((now-previous)/1000,.1);previous=now;
    const w=scene.clientWidth,h=scene.clientHeight,dpr=Math.min(devicePixelRatio||1,2),origin=scene.getBoundingClientRect();
    for(const c of [canvas,cloudCanvas])if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
    cloud.setTransform(dpr,0,0,dpr,0,0);cloud.clearRect(0,0,w,h);
    const bg=scene.querySelector('.unknown-ground').getBoundingClientRect(),coords=scene.sekaiSceneData?.coordinateSize||[3378,1600],sx=bg.width/coords[0],sy=bg.height/coords[1];
    const tree=scene.querySelector('.unknown-tree'),tb=tree.getBoundingClientRect(),pr=tree.sekaiProjection;
    if(gl){gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);}
    for(const g of groups){
      if(g.kind==='tree'&&!pr)continue;
      const vertices=[];
      for(const p of g.particles){
        if(world==='5'&&g.path.includes('/fx_keion_sekai_stars_01/')){
          const generation=Math.floor((elapsed+p.phase)/p.cycle);
          if(p.generation!==generation){
            p.generation=generation;
            // Stratified random fan sampling: web adaptation for balanced sparse meteors.
            p.xyz[0]=(p.sector+Math.random())/p.sectors-.5;
            p.xyz[1]=Math.random()-.5;
          }
        }
        const age=(elapsed+p.phase)%p.cycle;if(age>=p.life)continue;
        const t=age/p.life,c=tint(g,p,t),uv=tile(g,p,t),size=curve(g.size,0,p.r)*(g.sizeLife?curve(g.sizeLife,t,p.r):1);
        if(g.kind==='cloud'&&world==='27'){
          const image=images.get(g.textures._MainTex),tw=image.width/uv[2],th=image.height/uv[3];
          // Per-emitter atlas tile, not the entire packed 2x4 sheet. 600 is web calibration.
          const width=size*600*sx*g.scale[0],height=width*(th/tw)*g.scale[1];
          const x=bg.left-origin.left+(g.position[0]+(p.velocity[0]||0)*age*600)*sx;
          const y=bg.top-origin.top-(g.position[1]+(p.velocity[1]||0)*age*600)*sy;
          cloud.globalAlpha=Math.max(0,Math.min(1,c[3]));cloud.drawImage(image,uv[0]*tw,uv[1]*th,tw,th,x-width/2,y-height/2,width,height);continue;
        }
        if(!gl&&g.kind!=='cloud')continue;
        const shape=g.shape,shapePos=vec(shape.m_Position),shapeScale=vec(shape.m_Scale),shRot=vec(shape.m_Rotation).map(a=>a*Math.PI/180);
        let shapePoint=p.xyz.map((v,i)=>v*shapeScale[i]);
        const circleAngle=(p.xyz[0]+.5)*(shape.arc?.value??360)*Math.PI/180;
        if(shape.type===10||shape.type===11){const a=circleAngle,r=shape.radius.value*(shape.type===11?1:Math.sqrt(p.xyz[1]+.5));shapePoint=[Math.cos(a)*r*shapeScale[0],Math.sin(a)*r*shapeScale[1],0];}
        if(shape.type===12)shapePoint=[p.xyz[0]*2*shape.radius.value,0,0];
        let spawn=rotate(shapePoint,shRot);spawn=spawn.map((v,i)=>v+shapePos[i]+(p.velocity[i]||0)*age);
        // Local-unit stars use their original radial StartSpeed; field triangles are already in area units.
        const localStars=world==='5'&&g.path.includes('/fx_keion_sekai_stars_01/');
        let direction=[0,0];
        if(localStars){direction=rotate([Math.cos(circleAngle),Math.sin(circleAngle),0],shRot);spawn[0]+=direction[0]*curve(g.speed,0,p.r)*age;spawn[1]+=direction[1]*curve(g.speed,0,p.r)*age;}
        let px,py,unitX,unitY;
        if(g.kind==='tree'){
          // Original effect local Y=480, circle emitters and scale=3; meter-to-skeleton web scale=1000.
          unitX=tb.width/pr.width;unitY=tb.height/pr.height;
          px=tb.left-origin.left+(spawn[0]*g.scale[0]*1000-pr.left)*unitX;
          py=tb.bottom-origin.top-(480+spawn[1]*g.scale[1]*1000-pr.bottom)*unitY;
          const meshScale=g.mesh?100:1000;
          unitX*=meshScale*g.scale[0];unitY*=meshScale*g.scale[1];
        }else{
          const units=g.webUnits??g.webUnitScale??(localStars||(world==='7'&&g.mesh?.vertices.length===4)?600:1); // Explicit local-unit web calibration, not a recovered game constant.
          const scale=['8','9','10'].includes(world)?g.scale:[1,1];
          px=bg.left-origin.left+(g.position[0]+spawn[0]*units*scale[0])*sx;py=bg.top-origin.top-(g.position[1]+spawn[1]*units*scale[1])*sy;unitX=sx*units*scale[0];unitY=sy*units*scale[1];
        }
        if(g.kind==='cloud'){
          const img=images.get(g.textures._MainTex),tw=img.width/uv[2],th=img.height/uv[3],width=size*unitX,height=size*unitY*th/tw;
          cloud.globalAlpha=Math.max(0,Math.min(1,c[3]));cloud.drawImage(img,uv[0]*tw,uv[1]*th,tw,th,px-width/2,py-height/2,width,height);continue;
        }
        let spin=p.spin.length===1?[0,0,p.spin[0]*age]:p.spin.map(v=>v*age);
        if(['7','8','9','10'].includes(world)){
          // RotationModule curves describe angular velocity: integrate, don't freeze at t=0.
          const integrated=g.spin.map(c=>{let sum=0;const steps=32;for(let k=0;k<steps;k++)sum+=curve(c,t*(k+.5)/steps,p.r)*age/steps;return sum;});
          spin=integrated.length===1?[0,0,integrated[0]]:integrated;
        }
        const mesh=g.mesh||{vertices:[[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]],uvs:[[0,0],[1,0],[1,1],[0,1]],faces:[[0,1,2],[0,2,3]]};
        if(localStars&&g.trail?.enabled){
          const length=curve(g.speed,0,p.r)*Math.min(age,curve(g.trail.life,0,p.r)),width=size*curve(g.trail.width,t,p.r);
          const points=[[0,-.5],[0,.5],[1,.5],[1,-.5]];
          for(const i of [0,1,2,0,2,3]){const [back,side]=points[i],x=px+(-direction[0]*length*back-direction[1]*width*side)*unitX,y=py-(-direction[1]*length*back+direction[0]*width*side)*unitY;
            vertices.push(x/w*2-1,1-y/h*2,back,side+.5,c[0],c[1],c[2],c[3]*(1-back),0);}
        }
        for(const face of mesh.faces)for(const i of face){
          const axes=g.size3D?[1,curve(g.sizeY,0,p.r)/(curve(g.size,0,p.r)||1),curve(g.sizeZ,0,p.r)/(curve(g.size,0,p.r)||1)]:[1,1,1];
          let v=rotate(rotate(mesh.vertices[i].map((v,j)=>v*axes[j]),spin.length?spin:[0,0,0]),p.rotation),light=0;
          if(g.light&&mesh.normals){const n=rotate(rotate(mesh.normals[i],spin.length?spin:[0,0,0]),p.rotation);light=Math.max(0,n.reduce((sum,n,j)=>sum+n*g.light[j],0)/Math.hypot(...g.light));}
          const tu=mesh.uvs[i];vertices.push((px+v[0]*size*unitX)/w*2-1,1-(py-v[1]*size*unitY)/h*2,(tu[0]+uv[0])/uv[2],(tu[1]+uv[3]-1-uv[1])/uv[3],...c,light);
        }
      }
      if(g.kind!=='cloud'&&gl){
        // SekaiEffect shader Cull Back; do not double-compose both sides of the thick mesh.
        if(g.cullBack){gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.frontFace(gl.CCW);}else gl.disable(gl.CULL_FACE);
        gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,textures.get(g.textures._MainTex));gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,textures.get(g.textures._LightTex||g.textures._MainTex));
        gl.uniform1f(gl.getUniformLocation(program,'additive'),g.additive?1:0);
        gl.blendFuncSeparate(gl.ONE,g.additive?gl.ONE:gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,vertices.length/9);
      }
    }
    canvas.dataset.ready=String(Boolean(gl));canvas.dataset.frame=String(Math.round(elapsed*1000));cloudCanvas.dataset.ready='true';cloudCanvas.dataset.pan=scene.style.getPropertyValue('--pan')||'0px';
    if(!reduced.matches)raf=requestAnimationFrame(draw);
  }
  const resume=()=>{cancelAnimationFrame(raf);previous=0;if(groups.length&&!document.hidden&&!lost)raf=requestAnimationFrame(draw);};
  fetch(new URL('effects.json',base)).then(r=>{if(!r.ok)throw Error('area'+world+' metadata unavailable');return r.json();}).then(async data=>{
    await Promise.all(data.textures.map(t=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{images.set(t.file,img);resolve();};img.onerror=reject;img.src=new URL(t.file,base).href;})));
    groups=data.groups;if(world==='7')groups.sort((a,b)=>a.order-b.order);groups.forEach(populate);setupGL();canvas.dataset.groups=String(groups.filter(g=>g.kind!=='cloud').length);cloudCanvas.dataset.groups=String(groups.filter(g=>g.kind==='cloud').length);resume();
    document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);addEventListener('resize',resume);
    scene.querySelector('.unknown-tree').addEventListener('sekai-tree-ready',()=>{if(reduced.matches)resume();});
    new MutationObserver(()=>{if(reduced.matches)resume();}).observe(scene,{attributes:true,attributeFilter:['style']});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);canvas.dataset.ready='false';});
    canvas.addEventListener('webglcontextrestored',()=>{lost=false;textures.clear();setupGL();resume();});
  }).catch(error=>{canvas.dataset.error=String(error);console.error('SEKAI area'+world+' effects:',error);});
})();
