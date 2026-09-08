/* Original UIEffect two-pass kernel. Page parameter selection remains a documented
 * adaptation: LIVE uses UIBlurController's serialized 1.5, selection the parameter
 * constructor's 3.0; a live runtime read is still needed to prove that mapping. */
(() => {
  const scene=document.querySelector('.street-scene');
  const search=document.body.classList.contains('page-type-search') || document.body.classList.contains('page-type-post');
  if (!scene || document.body.classList.contains('page-type-index')) return;
  const canvas=document.createElement('canvas');
  canvas.className='street-blur'; canvas.setAttribute('aria-hidden','true');
  const gl=canvas.getContext('webgl',{alpha:false,depth:false,antialias:false});
  if (!gl) return;
  const compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('blur shader');return s;};
  const program=gl.createProgram();
  try {
    gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=(p+1.0)*0.5;gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(program,compile(gl.FRAGMENT_SHADER,`precision mediump float;uniform sampler2D source;uniform vec2 stepUV;varying vec2 uv;
      vec3 pair(float d){return texture2D(source,uv+stepUV*d).rgb+texture2D(source,uv-stepUV*d).rgb;}
      void main(){gl_FragColor=vec4(pair(.65)*.204+pair(2.43)*.198+pair(4.37)*.098,1.);}`));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;
  } catch{return;}
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
  const textures=[gl.createTexture(),gl.createTexture()];
  for(const t of textures){gl.bindTexture(gl.TEXTURE_2D,t);for(const k of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,k,gl.LINEAR);for(const k of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE);}
  const fb=gl.createFramebuffer(),step=gl.getUniformLocation(program,'stepUV');
  const capture=document.createElement('canvas'),ctx=capture.getContext('2d');
  if(!ctx)return;
  const images=[...scene.querySelectorAll('img')];
  const draw=()=>{
    if(images.some(img=>!img.complete || !img.naturalWidth))return;
    try{
      // CaptureResolutionScale .5. Limit DPR to 2 to bound web GPU memory.
      const ratio=Math.min(devicePixelRatio||1,2)*.5;
      const w=Math.max(1,Math.round(innerWidth*ratio)),h=Math.max(1,Math.round(innerHeight*ratio));
      canvas.width=capture.width=w;canvas.height=capture.height=h;
      ctx.fillStyle='#4ac5eb';ctx.fillRect(0,0,w,h);
      for(const img of images){const r=img.getBoundingClientRect();ctx.drawImage(img,r.left*ratio,r.top*ratio,r.width*ratio,r.height*ratio);}
      gl.viewport(0,0,w,h);gl.bindTexture(gl.TEXTURE_2D,textures[0]);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,capture);
      gl.bindTexture(gl.TEXTURE_2D,textures[1]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
      gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,textures[1],0);
      if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)return;
      const distance=search?3:1.5;
      // ExecuteBlur reads RenderingData+0xF0: cameraData(0x18)+descriptor(0xD8),
      // i.e. full camera dimensions, not the half-resolution render target.
      gl.bindTexture(gl.TEXTURE_2D,textures[0]);gl.uniform2f(step,distance/(w*2),0);gl.drawArrays(gl.TRIANGLES,0,6);
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindTexture(gl.TEXTURE_2D,textures[1]);gl.uniform2f(step,0,distance/(h*2));gl.drawArrays(gl.TRIANGLES,0,6);
      canvas.classList.add('ready');
    }catch{canvas.classList.remove('ready');}
  };
  scene.parentElement.append(canvas);
  let frame;
  const queue=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);};
  // Home dragging changes --street-pan; redraw the blurred capture with it.
  new MutationObserver(queue).observe(scene,{attributes:true,attributeFilter:['style']});
  images.forEach(img=>img.addEventListener('load',queue));
  window.addEventListener('resize',queue);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();canvas.classList.remove('ready');});
  queue();
})();
