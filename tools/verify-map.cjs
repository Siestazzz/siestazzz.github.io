const fs=require('node:fs'),assert=require('node:assert/strict');
const {parseHTML}=require('../pjskapk/analysis-tools/dom/node_modules/linkedom');
const {document}=parseHTML(fs.readFileSync('public/map/index.html','utf8'));
assert.equal(document.querySelectorAll('.orbit-world').length,5);
assert.equal(document.querySelectorAll('[data-enter-world]').length,6);
for(const world of document.querySelectorAll('.orbit-world')) {
  assert.equal(world.getAttribute('aria-disabled'),'false');
  assert.equal(world.getAttribute('href'),null);
}
for(const el of document.querySelectorAll('img[src],script[src]')) {
  const url=el.getAttribute('src');assert(fs.existsSync('public'+url),url);
}
for(const ext of ['skel','atlas','png']) assert(fs.existsSync('public/game-assets/map/sd_world_link_wish_tree.'+ext));
const home=parseHTML(fs.readFileSync('public/index.html','utf8')).document;
assert.equal(home.querySelector('.map-globe').getAttribute('href'),'/map/');
assert(home.querySelector('.unknown-scene[data-home-world="27"]'));
assert(home.querySelector('.game-home .home-gacha'));
assert(home.querySelector('.game-home .home-featured'));
assert.equal(home.querySelector('.street-scene'),null);
assert.equal(document.querySelector('.sekai-inside'),null);
assert.equal(document.querySelectorAll('.world-glow').length,6);
assert(document.querySelector('.map-ambient-particles'));
assert(document.querySelector('.orbit-prev img[src$="btn_arrow_switching_wh.png"]'));
const particleData=JSON.parse(fs.readFileSync('public/game-assets/map/motion-runtime.json','utf8'));
assert.equal(particleData.length,3);
assert(particleData.every(g=>g.mesh.vertices.length===30&&g.spin>0&&g.alpha.length===5));
assert(!document.querySelector('.sekai-map').textContent.includes('現実世界'));
assert(!document.querySelector('.sekai-map').textContent.includes('記憶'));
console.log('PASS: globe route, all six SEKAI worlds open, original local assets.');
