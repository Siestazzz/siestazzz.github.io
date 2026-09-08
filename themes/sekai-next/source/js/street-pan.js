/* Horizontal camera window over the extracted area1 scenery, with no character input. */
(() => {
  const street = document.querySelector('.street-scene');
  if (!street) return;
  const clamp = n => Math.max(-59, Math.min(24, n));
  let pan = 0;
  try { const n = Number(sessionStorage.getItem('sekai-street-pan')); if (Number.isFinite(n)) pan = clamp(n); } catch {}
  const paint = () => street.style.setProperty('--street-pan', pan + '%');
  paint();
  const home = document.querySelector('.game-home');
  if (!home) return;
  let gesture = null, dragged = false;
  home.addEventListener('pointerdown', e => {
    dragged = false;
    if (e.button !== 0 || e.target.closest('a,button,input')) return;
    gesture = {id:e.pointerId, x:e.clientX, start:pan};
    dragged = false;
    home.setPointerCapture(e.pointerId);
  });
  home.addEventListener('pointermove', e => {
    if (!gesture || e.pointerId !== gesture.id) return;
    const dx = e.clientX - gesture.x;
    if (Math.abs(dx) > 5) dragged = true;
    if (!dragged) return;
    home.classList.add('is-panning');
    pan = clamp(gesture.start + dx / street.getBoundingClientRect().width * 100);
    paint();
  });
  const finish = e => {
    if (!gesture || e.pointerId !== gesture.id) return;
    gesture = null; home.classList.remove('is-panning');
    if (home.hasPointerCapture(e.pointerId)) home.releasePointerCapture(e.pointerId);
    try { sessionStorage.setItem('sekai-street-pan', String(pan)); } catch {}
  };
  home.addEventListener('pointerup', finish);
  home.addEventListener('pointercancel', finish);
  home.addEventListener('lostpointercapture', finish);
  home.addEventListener('click', e => {
    if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; }
  }, true);
})();
