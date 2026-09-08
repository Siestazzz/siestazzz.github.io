/* HOME-WONDERLAND-TWEEN: original TweenPosition fields; see pjskapk/AREA9.md. */
(() => {
  'use strict';
  const scene = document.querySelector('.unknown-scene');
  if (!scene || document.documentElement.dataset.homeWorld !== '9') return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let motions = [], elapsed = 0, previous = 0, raf = 0;
  // Original endpoints have zero tangents: cubic Hermite, not linear interpolation.
  const ease = t => t*t*(3-2*t);
  function paint() {
    const sy = scene.sekaiProjection?.scaleY;
    if (!sy) return;
    for (const {data, images} of motions) {
      const phase = (elapsed / data.duration) % 2;
      const t = ease(phase <= 1 ? phase : 2-phase);
      const y = data.from.y + (data.to.y-data.from.y)*t;
      for (const img of images) img.style.translate = `0 ${-y*sy}px`;
    }
    scene.dataset.area9MotionFrame = String(Math.round(elapsed*1000));
  }
  function frame(now) {
    raf=0;
    if (document.hidden) return;
    if (previous && !reduced.matches) elapsed += Math.min((now-previous)/1000,.1);
    previous=now; paint();
    if (!reduced.matches) raf=requestAnimationFrame(frame);
  }
  function resume() {
    cancelAnimationFrame(raf);previous=0;
    if (motions.length && !document.hidden) raf=requestAnimationFrame(frame);
  }
  function ready() {
    motions=(scene.sekaiSceneData?.motion || []).map(data=>({data,images:[...scene.querySelectorAll('img[data-scene-path]')].filter(img=>img.dataset.scenePath===data.path || img.dataset.scenePath.startsWith(data.path+'/'))}));
    scene.dataset.area9Tweens=String(motions.length);resume();
  }
  scene.addEventListener('sekai-scene-ready',ready);
  scene.addEventListener('sekai-scene-project',paint);
  document.addEventListener('visibilitychange',resume);
  reduced.addEventListener('change',resume);
  if (scene.sekaiSceneData) ready();
})();
