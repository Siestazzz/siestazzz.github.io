/* fx_Tap_single assets/alpha: pjskapk/TAP-EFFECT.md. Motion scaled for the web. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['#77eedd', '#ff83bc', '#ffe98a', '#83cfff', '#c7a2ff'];
  const bursts = new Set();
  const ambient = document.createElement('div');
  ambient.className = 'ambient-field';
  ambient.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 24; i++) {
    const piece = document.createElement('i');
    piece.style.cssText = '--x:' + ((i * 37) % 100) + '%;--y:' + ((i * 23) % 100) +
      '%;--size:' + (i % 6 === 0 ? 65 : 8 + i % 19) + 'px;--color:' + colors[i % 5] +
      ';--duration:' + (12 + i % 9) + 's;--delay:-' + (i * 1.7) + 's';
    ambient.append(piece);
  }
  document.body.append(ambient);
  function clear() { bursts.forEach(node => node.remove()); bursts.clear(); globalThis.SekaiTapMesh?.clear(); }
  reduced.addEventListener('change', clear);
  document.addEventListener('visibilitychange', () => {
    ambient.classList.toggle('paused', document.hidden);
    if (document.hidden) clear();
  });
  document.addEventListener('pointerdown', event => {
    if (reduced.matches || (event.button !== undefined && event.button !== 0)) return;
    // Capture phase includes empty space, text, overlays and controls alike.
    if (bursts.size >= 8) { const oldest = bursts.values().next().value; oldest.remove(); bursts.delete(oldest); }
    const burst = document.createElement('div');
    burst.className = 'tap-burst';
    burst.setAttribute('aria-hidden', 'true');
    burst.style.left = event.clientX + 'px';
    burst.style.top = event.clientY + 'px';
    // PT_01 emits one atlas particle: cyan AND white rings are baked into it.
    const ring = document.createElement('i'); ring.className = 'tap-atlas'; burst.append(ring);
    // Original particle2 / particle2_1 bursts contain 8 + 7 colored pieces.
    const renderedMesh = globalThis.SekaiTapMesh?.emit(event.clientX, event.clientY);
    for (let i = 0; !renderedMesh && i < 15; i++) {
      const shard = document.createElement('i');
      shard.className = 'tap-shard';
      const angle = i * Math.PI * 2 / 15 + Math.random() * .3;
      const distance = 48 + Math.random() * 84;
      const tile = Math.floor(Math.random() * 4);
      const lifetime = i < 8 ? 100 + Math.random() * 600 : 200 + Math.random() * 500;
      shard.style.cssText = '--dx:' + Math.cos(angle) * distance + 'px;--dy:' +
        Math.sin(angle) * distance + 'px;--turn:' + (90 + i * 41) +
        'deg;--tile-x:' + (tile % 2 * 100) + '%;--tile-y:' + (Math.floor(tile / 2) * 100) +
        '%;--life:' + lifetime + 'ms;--size:' + (10 + (i % 5) * 3) + 'px';
      burst.append(shard);
    }
    document.body.append(burst); bursts.add(burst);
    setTimeout(() => { burst.remove(); bursts.delete(burst); }, 750);
  }, {capture: true, passive: true});
})();
