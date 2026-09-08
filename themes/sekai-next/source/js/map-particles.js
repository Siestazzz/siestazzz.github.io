/* Original WorldMapPlayListBG particle data/sekai_PT_05 geometry. See MAP.md. */
(()=>{
'use strict';
const canvas=document.querySelector('.map-ambient-particles');if(!canvas)return;
const base=new URL('../game-assets/map/',document.currentScript.src);
const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});if(!gl)return;
let program,buffer,groups,frame=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function shader(type, source) {
    const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function texture(name, unit) {
    return new Promise((resolve, reject) => {
      const img = new Image(); img.onload = () => {
        gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        resolve();
      }; img.onerror = reject; img.src = new URL(name, base).href;
    });
  }
  // Unity Euler order Z → X → Y. Initial orientation is random on all three axes.
  function rotate(v, a) {
    const [x,y,z] = v, [rx,ry,rz] = a;
    const x1 = x*Math.cos(rz)-y*Math.sin(rz), y1 = x*Math.sin(rz)+y*Math.cos(rz);
    const y2 = y1*Math.cos(rx)-z*Math.sin(rx), z2 = y1*Math.sin(rx)+z*Math.cos(rx);
    return [x1*Math.cos(ry)+z2*Math.sin(ry), y2, -x1*Math.sin(ry)+z2*Math.cos(ry)];
  }

function mix(a,b,t){return a+(b-a)*t;}
function alpha(keys,t){for(let i=1;i<keys.length;i++){if(t<=keys[i][0])return mix(keys[i-1][1],keys[i][1],(t-keys[i-1][0])/(keys[i][0]-keys[i-1][0]));}return keys.at(-1)[1];}
function draw(now){
 frame=0;if(document.hidden)return;
 const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,2);
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
 gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 const clock=reduced.matches?0:now/1000,unit=Math.max(w/6.2,h/2.75);
 for(const [gi,g] of groups.entries()){
  const vertices=[],mesh=g.mesh;
  for(const p of g.particles){
   const age=(clock+p.offset)%p.life,t=age/p.life;
   // The original emitter extends beyond the camera window; do not squeeze its
   // entire live population into the visible viewport.
   const orbit=p.angle+age*g.orbit,px=w*.5+Math.cos(orbit)*p.radius*w*1.1,py=h*.5+Math.sin(orbit)*p.radius*h*1.1;
   const spin=[0,0,age*g.spin],size=p.size*unit,opacity=alpha(g.alpha,t);
   for(const face of mesh.faces)for(const index of face){
    const v=rotate(rotate(mesh.vertices[index],spin),p.rotation);
    const n=rotate(rotate(mesh.normals[index],spin),p.rotation);
    const uv=mesh.uvs[index],light=gi===0?[.85,1,.85]:[-1,2,1],len=Math.hypot(...light);
    vertices.push((px+v[0]*size)/w*2-1,1-(py-v[1]*size)/h*2,v[2]*size/1000,(uv[0]+p.tile%2)/2,(uv[1]+Math.floor(p.tile/2))/2,Math.max(0,(n[0]*light[0]+n[1]*light[1]+n[2]*light[2])/len),opacity);
   }
  }
  gl.uniform1i(gl.getUniformLocation(program,'mainTex'),gi*2);gl.uniform1i(gl.getUniformLocation(program,'lightTex'),gi*2+1);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,vertices.length/7);
 }
 canvas.dataset.ready='true';canvas.dataset.frame=String(Math.round(now));
 if(!reduced.matches)frame=requestAnimationFrame(draw);
}
fetch(new URL('motion-runtime.json',base)).then(r=>{if(!r.ok)throw Error('Particle data unavailable');return r.json();}).then(async data=>{
 groups=data;
 await Promise.all(groups.flatMap((g,i)=>g.textures.map((name,j)=>texture(name,i*2+j))));
 program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER, `
      attribute vec3 position; attribute vec2 uv; attribute vec2 lightAlpha;
      varying vec2 vUv; varying vec2 vLightAlpha;
      void main(){gl_Position=vec4(position,1.0);vUv=uv;vLightAlpha=lightAlpha;}`));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER, `
      precision mediump float; uniform sampler2D mainTex; uniform sampler2D lightTex;
      varying vec2 vUv; varying vec2 vLightAlpha;
      void main(){vec4 c=mix(texture2D(mainTex,vUv),texture2D(lightTex,vUv),vLightAlpha.x);
        gl_FragColor=vec4(c.rgb,c.a*vLightAlpha.y);}`));
    gl.linkProgram(program); if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Tap shader link failed');
    gl.useProgram(program); buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    for (const [name,count,offset] of [['position',3,0],['uv',2,12],['lightAlpha',2,20]]) {
      const location=gl.getAttribLocation(program,name); gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location,count,gl.FLOAT,false,28,offset);
    }
    gl.uniform1i(gl.getUniformLocation(program,'mainTex'),0); gl.uniform1i(gl.getUniformLocation(program,'lightTex'),1);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    
 gl.clearColor(0,0,0,0);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
 groups.forEach(g=>{g.particles=Array.from({length:Math.round(g.rate*(g.life[0]+g.life[1])/2)},()=>({life:mix(...g.life,Math.random()),size:mix(...g.size,Math.random()),offset:Math.random()*35,radius:Math.sqrt(Math.random()),angle:Math.random()*Math.PI*2,tile:Math.floor(Math.random()*4),rotation:Array.from({length:3},()=>Math.random()*Math.PI*4-Math.PI*2)}));});
 frame=requestAnimationFrame(draw);
 const resume=()=>{cancelAnimationFrame(frame);frame=0;if(!document.hidden)frame=requestAnimationFrame(draw);};
 document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);window.addEventListener('resize',resume);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);canvas.dataset.ready='false';});
 canvas.addEventListener('webglcontextrestored',()=>location.reload());
}).catch(error=>console.error('Map particles unavailable',error));
})();
