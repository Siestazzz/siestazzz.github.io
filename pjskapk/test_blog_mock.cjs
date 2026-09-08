// Non-browser DOM unit tests against the generated Hexo pages.
const {parseHTML} = require('./analysis-tools/dom/node_modules/linkedom');
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root,'themes/sekai-next/source/js/main.js'),'utf8');
const posts = JSON.parse(fs.readFileSync(path.join(root,'public/search.json'),'utf8'));
const tick = () => new Promise(resolve => setImmediate(resolve));
async function setup(page, options={}) {
  const {window, document} = parseHTML(fs.readFileSync(path.join(root,'public',page,'index.html'),'utf8'));
  if (options.oldLayout) document.querySelector('.phone-jacket-wash')?.remove();
  window.HTMLElement.prototype.animate = () => ({});
  window.HTMLElement.prototype.scrollIntoView = () => {};
  const memory = new Map(Object.entries(options.stored || {}));
  const storage = {getItem:k=>{if(options.blocked) throw Error('blocked');return memory.get(k)||null;},setItem:(k,v)=>{if(options.blocked) throw Error('blocked');memory.set(k,v);}};
  const location = {origin:'http://localhost:4100',pathname:'/'+page+'/',search:options.query||'',href:'http://localhost:4100/'+page+'/',assign:()=>{}};
  const context = vm.createContext({document,window,localStorage:storage,sessionStorage:storage,location,history:{replaceState:(_,__,url)=>{location.search=url.includes('?')?'?'+url.split('?')[1]:'';}},URL,URLSearchParams,matchMedia:()=>({matches:true}),setTimeout,console,fetch:async()=>({ok:!options.fail,json:async()=>posts})});
  vm.runInContext(source,context);await tick();await tick();
  return {document,window,memory,location};
}
function click(env, selector) { const element=env.document.querySelector(selector);assert.ok(element,selector);element.dispatchEvent(new env.window.Event('click',{bubbles:true})); }
(async()=>{
  const env=await setup('search');
  const legacy=await setup('search',{oldLayout:true});
  assert.ok(legacy.document.querySelector('.read-start'),'old HTML must still render the article');
  click(legacy,'.song-row:nth-child(2)');
  assert.ok(legacy.document.querySelector('.read-start').getAttribute('href').endsWith(posts[1].path));
  assert.equal(env.document.querySelectorAll('.song-row').length,posts.length);
  assert.ok(env.document.querySelector('.read-start').getAttribute('href').endsWith(posts[0].path));
  const initial=env.document.querySelector('.selected').dataset.path;
  click(env,'.random-post');assert.notEqual(env.document.querySelector('.selected').dataset.path,initial);
  const query=env.document.querySelector('#song-query');
  query.value='不存在的关键词xyz';query.dispatchEvent(new env.window.Event('input'));
  assert.equal(env.document.querySelectorAll('.song-row').length,0);assert.ok(env.document.querySelector('#clear-query'));
  click(env,'#clear-query');assert.equal(env.document.querySelectorAll('.song-row').length,posts.length);
  query.value=posts[0].title;query.dispatchEvent(new env.window.Event('input'));assert.equal(env.document.querySelectorAll('.song-row').length,1);assert.ok(env.document.querySelector('.random-post').disabled);
  query.value='';query.dispatchEvent(new env.window.Event('input'));click(env,'#unit-tabs button:nth-child(2)');
  assert.equal(env.document.querySelectorAll('.song-row').length,posts.filter(p=>p.categories.includes(posts[0].categories[0])).length);
  const restored=await setup('search',{query:'?post='+encodeURIComponent(posts[1].path)});assert.equal(restored.document.querySelector('.selected').dataset.path,posts[1].path);
  const failed=await setup('search',{fail:true});assert.match(failed.document.querySelector('#song-state').textContent,/加载失败/);
  const noStore=await setup('search',{blocked:true});assert.equal(noStore.document.querySelectorAll('.song-row').length,posts.length);
  const read=await setup(posts[0].path.replace(/\/$/,''));assert.equal(read.document.querySelector('[data-post-views]').textContent,'1');
  const bad=await setup('search',{stored:{'sekai-demo-views':'not-json'}});assert.equal(bad.document.querySelector('[data-total-views]').textContent,'0');
  const live=await setup('live');const before=live.document.querySelector('#len-line').textContent;click(live,'.len-talk');assert.notEqual(live.document.querySelector('#len-line').textContent,before);
  const friends=await setup('friends');assert.equal(friends.document.querySelectorAll('.friend-card').length,7);
  // Check every generated local resource link resolves in the output directory.
  for(const page of ['','live','search','friends',posts[0].path]) {
    const {document}=parseHTML(fs.readFileSync(path.join(root,'public',page,'index.html'),'utf8'));
    for(const el of document.querySelectorAll('[src],a[href],link[rel="stylesheet"]')) {
      const raw=el.getAttribute('src')||el.getAttribute('href');if(!raw||!raw.startsWith('/'))continue;
      const rel=decodeURIComponent(raw.split(/[?#]/)[0]);const dest=path.join(root,'public',rel);
      assert.ok(fs.existsSync(dest),raw);
    }
  }
  console.log('PASS: list, selection, random, search, empty state, categories, URL restore, failure, storage, views, dialogue, friends, local assets');
})().catch(e=>{console.error(e);process.exitCode=1;});
