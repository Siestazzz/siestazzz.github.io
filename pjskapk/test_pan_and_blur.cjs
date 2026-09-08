const {parseHTML}=require('./analysis-tools/dom/node_modules/linkedom');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {document,window}=parseHTML('<html><body><div class="street-scene"></div><main class="game-home"><a href="/live/">LIVE</a></main></body></html>');
const home=document.querySelector('main'),street=document.querySelector('.street-scene');
let capture=false,stored='';
home.setPointerCapture=()=>{capture=true;};home.hasPointerCapture=()=>capture;home.releasePointerCapture=()=>{capture=false;};
street.getBoundingClientRect=()=>({width:1000});
vm.runInNewContext(fs.readFileSync('themes/sekai-next/source/js/street-pan.js','utf8'),{document,sessionStorage:{getItem:()=>null,setItem:(k,v)=>{stored=v;}}});
function event(type,target,x){const e=new window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{button:0,pointerId:1,clientX:x});target.dispatchEvent(e);return e;}
event('pointerdown',home,0);event('pointermove',home,100);event('pointerup',home,100);
assert.equal(stored,'10');assert.ok(event('click',home,100).defaultPrevented);
event('pointerdown',home,0);event('pointermove',home,100);event('pointerup',home,100);
const link=home.querySelector('a');event('pointerdown',link,0);
assert.equal(event('click',link,0).defaultPrevented,false,'new control gesture must not be swallowed');
// No-WebGL fallbacks must not throw, create broken canvases, or break other pages.
for(const file of ['jacket-blur.js','street-blur.js']){
 const {document}=parseHTML('<html><body class="page-type-search"><div class="street-scene"></div><div class="phone-jacket-wash"><img></div></body></html>');
 const create=document.createElement.bind(document);document.createElement=name=>{const el=create(name);if(name==='canvas')el.getContext=()=>null;return el;};
 vm.runInNewContext(fs.readFileSync('themes/sekai-next/source/js/'+file,'utf8'),{document});
 assert.equal(document.querySelectorAll('canvas').length,0);
}
console.log('PASS: pan persistence, drag click suppression, next button click, no-WebGL graceful fallback');
