/* Original sekai_PT_05 mesh + mat_sekai_01_1 GLES shading. See pjskapk/TAP-EFFECT.md. */
(() => {
  'use strict';
  const base = new URL('../game-assets/', document.currentScript.src);
  const canvas = document.createElement('canvas');
  canvas.className = 'tap-mesh-layer';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', {alpha:true, antialias:true, premultipliedAlpha:false});
  if (!gl) return;
  let ready = false, frame = 0, mesh, program, buffer;
  const bursts = [];
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
  function draw(now) {
    frame = 0;
    const w = innerWidth, h = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w*dpr) || canvas.height !== Math.round(h*dpr)) {
      canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr);
    }
    gl.viewport(0,0,canvas.width,canvas.height); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const vertices = [];
    for (let b = bursts.length-1; b >= 0; b--) {
      const burst = bursts[b], elapsed = now-burst.start;
      if (elapsed > 700) { bursts.splice(b,1); continue; }
      for (const p of burst.particles) {
        const t = elapsed/p.life; if (t < 0 || t >= 1) continue;
        const alpha = t < .05 ? t/.05 : t <= .7 ? 1 : (1-t)/.3;
        const travel = 1-Math.pow(1-t,3);
        // separateAxes=false: only the Z curve is active, 0.2617994 rad/s.
        // Apply spin in mesh space before its randomly tilted initial orientation.
        const spin = [0,0,elapsed/1000*.261799395];
        for (const face of mesh.faces) for (const index of face) {
          const position = rotate(rotate(mesh.vertices[index],spin),p.rotation);
          const normal = rotate(rotate(mesh.normals[index],spin),p.rotation);
          const size = p.size/10.054;
          const px = burst.x+p.dx*travel+position[0]*size;
          const py = burst.y+p.dy*travel-position[1]*size;
          const z = position[2]*size;
          const uv = mesh.uvs[index];
          vertices.push(px/w*2-1, 1-py/h*2, z/500,
            (uv[0]+p.tile%2)/2, (uv[1]+Math.floor(p.tile/2))/2,
            Math.max(0,(normal[0]+normal[1]*2+normal[2])/Math.sqrt(6)), alpha);
        }
      }
    }
    if (vertices.length) {
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.TRIANGLES,0,vertices.length/7);
    }
    if (bursts.length) frame = requestAnimationFrame(draw);
  }
  function clear() {
    bursts.length=0; cancelAnimationFrame(frame); frame=0;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
  window.SekaiTapMesh = {
    emit(x,y) {
      if (!ready) return false;
      const particles = Array.from({length:15}, (_,i) => {
        const angle = Math.PI*2*i/15+Math.random()*.3, distance = 48+Math.random()*84;
        return {dx:Math.cos(angle)*distance,dy:Math.sin(angle)*distance,
          life:i<8?100+Math.random()*600:200+Math.random()*500,
          // Device recording: large shards span ~1/4 of the outer ring, not 1/2.
          // 10–22 CSS px at the retained 72px ring size (before 3D projection).
          tile:Math.floor(Math.random()*4),size:10+i%5*3,
          rotation:Array.from({length:3},()=>Math.random()*Math.PI*4-Math.PI*2)};
      });
      if (bursts.length>=8) bursts.shift();
      bursts.push({x,y,start:performance.now(),particles});
      if (!frame) frame=requestAnimationFrame(draw);
      return true;
    }, clear
  };
  canvas.addEventListener('webglcontextlost', e => {e.preventDefault(); ready=false; clear();});
  Promise.all([
    fetch(new URL('tap-mesh.json',base)).then(r=>{if(!r.ok) throw new Error('Tap mesh unavailable');return r.json();}),
    texture('tex_sekai_01_1-original.png',0), texture('tex_sekai_aura_01_1-original.png',1)
  ]).then(([data]) => {
    mesh=data; program=gl.createProgram();
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
    gl.clearColor(0,0,0,0); document.body.append(canvas); ready=true;
  }).catch(error=>console.warn('3D tap effect unavailable; using CSS fallback.',error));
})();
