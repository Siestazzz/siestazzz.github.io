const {parseHTML}=require('./analysis-tools/dom/node_modules/linkedom');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {document}=parseHTML('<html><body><div class="phone-jacket-wash"><img src="/cover.png"></div></body></html>');
const source=document.querySelector('img');
Object.assign(source,{complete:true,naturalWidth:2048,naturalHeight:1170});
const uploads=[],uniforms=[],crops=[];
let repaint;
const gl=new Proxy({NO_ERROR:0,getError:()=>0,getShaderParameter:()=>true,getProgramParameter:()=>true,
 texImage2D:(...args)=>uploads.push(args.at(-1)),uniform2f:(...args)=>uniforms.push(args.slice(1))},
 {get:(target,key)=>key in target?target[key]:key.toUpperCase()===key?key:()=>({})});
const create=document.createElement.bind(document);
document.createElement=name=>{const el=create(name);if(name==='canvas')el.getContext=type=>type==='webgl'?gl:{clearRect:()=>{},drawImage:(...args)=>crops.push(args)};return el;};
vm.runInNewContext(fs.readFileSync('themes/sekai-next/source/js/jacket-blur.js','utf8'),{
 document,MutationObserver:class{constructor(fn){repaint=fn;}observe(){}}});
assert.equal(uploads.length,1);
assert.equal(uploads[0].width,256);assert.equal(uploads[0].height,256);
assert.deepEqual(uniforms[0],[1/256,1/256]);
assert.equal(crops[0][3],1170);assert.equal(crops[0][4],1170);
assert.ok(document.querySelector('.phone-jacket-wash').classList.contains('has-blur'));
source.removeAttribute('src');repaint();
assert.ok(!document.querySelector('.phone-jacket-wash').classList.contains('has-blur'));
console.log('PASS: cover crop, original 256px thumbnail input, texel scale, blur activation and clearing (WebGL API mock; not GPU visual QA)');
