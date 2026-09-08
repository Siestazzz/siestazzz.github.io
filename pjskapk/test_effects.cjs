const {parseHTML} = require('./analysis-tools/dom/node_modules/linkedom');
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = fs.readFileSync('themes/sekai-next/source/js/effects.js','utf8');
function setup(reduce = false) {
  const {document,window} = parseHTML('<html><body><button>test</button></body></html>');
  const timers = [];
  const media = {matches:reduce,addEventListener:()=>{}};
  vm.runInNewContext(code,{document,matchMedia:()=>media,setTimeout:fn=>timers.push(fn),Math});
  const tap = (target,button=0) => {
    const e = new window.Event('pointerdown',{bubbles:true});
    Object.assign(e,{clientX:123,clientY:234,button});target.dispatchEvent(e);
  };
  return {document,timers,tap};
}
const test = setup();
assert.equal(test.document.querySelectorAll('.ambient-field i').length,24);
test.tap(test.document.body);
assert.equal(test.document.querySelectorAll('.tap-burst').length,1,'blank space emits');
assert.equal(test.document.querySelectorAll('.tap-shard').length,15);
assert.equal(test.document.querySelectorAll('.tap-atlas').length,1,'one original atlas contains both rings');
assert.equal(test.document.querySelectorAll('.tap-atlas-outline').length,0,'no extra white ring');
for(const shard of test.document.querySelectorAll('.tap-shard')) {
  assert.match(shard.style.cssText,/--tile-x:/,'original gradient atlas tile');
  const lifetime = parseFloat(shard.style.getPropertyValue('--life'));
  assert.ok(lifetime >= 100 && lifetime <= 700);
  const size = parseFloat(shard.style.getPropertyValue('--size'));
  assert.ok(size >= 10 && size <= 22, 'fallback uses calibrated shard size');
}
const meshCode=fs.readFileSync('themes/sekai-next/source/js/tap-mesh.js','utf8');
assert.ok(meshCode.includes('size:10+i%5*3'), '3D renderer uses the same 10–22px size range');
const css=fs.readFileSync('themes/sekai-next/source/css/refinements.css','utf8');
assert.ok(css.includes('tex_sekai_01_1-original.png'));
assert.ok(css.includes('5%,70%{opacity:1}'),'original opaque plateau');
test.tap(test.document.querySelector('button'));
assert.equal(test.document.querySelectorAll('.tap-burst').length,2,'button emits once');
for(let i=0;i<20;i++) test.tap(test.document.body);
assert.equal(test.document.querySelectorAll('.tap-burst').length,8,'bounded particle nodes');
test.timers.forEach(fn=>fn());
assert.equal(test.document.querySelectorAll('.tap-burst').length,0,'cleanup');
test.tap(test.document.body,2);
assert.equal(test.document.querySelectorAll('.tap-burst').length,0,'ignore right button');
const reduced=setup(true);reduced.tap(reduced.document.body);
assert.equal(reduced.document.querySelectorAll('.tap-burst').length,0);
const home=fs.readFileSync('public/index.html','utf8');
assert.ok(home.includes('btn_friend.png'));
assert.ok(!home.includes('home-characters'));
assert.ok(home.includes('refinements.css') && home.includes('effects.js'));
const live=fs.readFileSync('public/live/index.html','utf8');
assert.ok(live.includes('live-spectrum'));
console.log('PASS: blank/control taps, colored shards, cleanup/cap, reduced motion, original icon and shared assets.');
