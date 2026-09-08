/* 6.8.1 UIGaussianBlur: one cross-kernel blit, NOT two separable passes.
 * Source: a7c3a9f13160e49a7b62548fbaa258ae GLES program; see pjskapk/IL2CPP.md.
 */
window.SekaiPages.register('jacket', (scope) => {
  const host = document.querySelector('.phone-jacket-wash');
  const source = host?.querySelector('img');
  if (!source) return;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', {alpha:false, depth:false, antialias:false, preserveDrawingBuffer:true});
  if (!gl) return; // Keep the source cover visible on devices without WebGL.
  const shader = (type, code) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, code); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, `
      attribute vec2 position; varying vec2 uv;
      void main(){uv=(position+1.0)*0.5;gl_Position=vec4(position,0.0,1.0);}`));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `
      precision mediump float; uniform sampler2D cover; uniform vec2 texel;
      varying vec2 uv;
      vec4 pair(float offset){return (texture2D(cover,uv+vec2(offset,0.0)*texel)
        +texture2D(cover,uv+vec2(0.0,offset)*texel))*0.5;}
      void main(){gl_FragColor=pair(-8.4)*0.036+pair(-5.6)*0.113
        +pair(-2.8)*0.216+pair(0.0)*0.269+pair(2.8)*0.216
        +pair(5.6)*0.113+pair(8.4)*0.036;}`));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  } catch { return; }
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  host.append(canvas);
  // LoadJacketAsync calls GetMusicJacketThumbnailName(): the actual cached inputs
  // are 256x256, NOT the full-size 2048px images used as web article covers.
  const thumbnail = document.createElement('canvas');
  thumbnail.width = thumbnail.height = 256;
  const thumbnailContext = thumbnail.getContext('2d');
  if (!thumbnailContext) return;
  const render = () => {
    host.classList.remove('has-blur');
    if (!source.getAttribute('src') || !source.complete || !source.naturalWidth) return;
    try {
      const side = Math.min(source.naturalWidth, source.naturalHeight);
      thumbnailContext.clearRect(0,0,256,256);
      thumbnailContext.drawImage(source,(source.naturalWidth-side)/2,(source.naturalHeight-side)/2,side,side,0,0,256,256);
      canvas.width=canvas.height=256;
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,thumbnail);
      // Blog tuning requested by the user: retain the decoded kernel but use
      // 35% of its sampling radius so the cover silhouette stays recognizable.
      gl.uniform2f(gl.getUniformLocation(program,'texel'),0.35/canvas.width,0.35/canvas.height);
      gl.drawArrays(gl.TRIANGLES,0,6);
      if (gl.getError() !== gl.NO_ERROR) return;
      host.classList.add('has-blur');
    } catch { /* Cross-origin covers remain ordinary images, without crashing selection. */ }
  };
  source.addEventListener('load',render);
  source.addEventListener('error',()=>host.classList.remove('has-blur'));
  const observer=new MutationObserver(()=>{host.classList.remove('has-blur');render();});observer.observe(source,{attributes:true,attributeFilter:['src']});
  scope.cleanup(()=>{observer.disconnect();gl.getExtension('WEBGL_lose_context')?.loseContext();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();host.classList.remove('has-blur');});
  render();
});
