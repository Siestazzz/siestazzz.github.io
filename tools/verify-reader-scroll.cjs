const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const classes = new Set(), events = {}, headerEvents = {};
const classList = {
  contains: name => classes.has(name),
  remove: name => classes.delete(name),
  toggle(name, on) { if (on) classes.add(name); else classes.delete(name); }
};
const card = { querySelectorAll: () => [] };
const nav = { querySelectorAll: () => [], addEventListener() {} };
const header = { contains: () => false, addEventListener: (name, fn) => headerEvents[name] = fn };
const document = {
  body: { classList }, documentElement: { scrollHeight: 5000 },
  querySelector: selector => ({ '.reader-card': card, '.chapter-index nav': nav, '.topbar': header })[selector]
};
let pending;
const window = { scrollY: 0, innerHeight: 800, addEventListener: (name, fn) => events[name] = fn };
vm.runInNewContext(fs.readFileSync('themes/sekai-next/source/js/reader.js', 'utf8'), {
  document, window, matchMedia: () => ({ matches: false }),
  requestAnimationFrame: fn => { pending = fn; return 1; }
});
function scroll(y) { window.scrollY = y; events.scroll(); pending(); }
const hidden = () => classes.has('reader-nav-hidden');
scroll(80); assert.equal(hidden(), false, 'near top stays visible');
scroll(180); assert.equal(hidden(), true, 'down hides navigation');
scroll(178); assert.equal(hidden(), true, 'tiny reversal does not flicker');
scroll(160); assert.equal(hidden(), false, 'up reveals navigation');
scroll(250); assert.equal(hidden(), true);
headerEvents.focusin(); assert.equal(hidden(), false, 'keyboard focus reveals navigation');
classes.add('menu-open'); scroll(350); assert.equal(hidden(), false, 'open menu keeps navigation visible');
classes.delete('menu-open'); scroll(450); assert.equal(hidden(), true);
scroll(0); assert.equal(hidden(), false, 'returning to top reveals navigation');
console.log('PASS: document-scroll navigation threshold, direction, jitter, focus, menu and top reset.');
