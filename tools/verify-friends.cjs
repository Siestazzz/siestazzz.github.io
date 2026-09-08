const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {parseHTML}=require('../pjskapk/analysis-tools/dom/node_modules/linkedom');
const html=fs.readFileSync('public/friends/index.html','utf8');
const {document,window}=parseHTML(html);
const rows=[...document.querySelectorAll('.friends-row')];
assert.equal(rows.length,7);
const honors=document.querySelectorAll('.friend-honor');
assert.equal(honors.length,3);
assert.equal(document.querySelectorAll('.friend-honor-fill').length,3);
assert.equal(document.querySelectorAll('.friend-honor-texture').length,0);
assert.equal(document.querySelectorAll('.friend-honor.is-main').length,1);
assert.equal(document.querySelectorAll('.friend-honor.is-sub').length,2);
for(const honor of honors){assert.equal(honor.querySelectorAll('a,button').length,0);assert.ok(honor.getAttribute('title').includes('自定义博客称号'));}
for(const row of rows){
  assert.equal(row.tagName,'DIV');
  assert.equal(row.hasAttribute('href'),false);
  const link=row.querySelector('a');
  assert.equal(row.querySelectorAll('a').length,1);
  assert.match(link.getAttribute('href'),/^https:\/\//);
  assert.equal(link.getAttribute('target'),'_blank');
  assert.match(link.getAttribute('rel'),/noopener/);
  assert.equal(row.querySelector('.friends-badges'),null);
  assert.equal(row.querySelector('.friends-online').textContent,'前往');
  assert.equal(row.querySelector('.friends-comment').querySelector('a'),null,'URL is display-only');
}
assert.ok(!html.includes('btn_friend_fav')&&!html.includes('friend-detail'));
for(const img of document.querySelectorAll('.friends-screen img')) assert.ok(fs.existsSync(path.join('public',img.getAttribute('src'))));
const css=fs.readFileSync('themes/sekai-next/source/css/friends.css','utf8');
for(const match of css.matchAll(/url\(['"]?([^)'"\s]+)/g)) {
  if(match[1].startsWith('#')) assert.ok(document.getElementById(match[1].slice(1)),match[1]);
  else assert.ok(fs.existsSync(path.resolve('themes/sekai-next/source/css',match[1])),match[1]);
}
for(const slice of ['21 fill / 10px','16 fill / 8px','24 fill / 12px']) assert.ok(css.replace(/\s+/g,' ').includes(slice),slice);
for(const id of ['friend-comment-tint','friend-online-tint','friend-panel-tint']) assert.equal(document.getElementById(id).getAttribute('color-interpolation-filters'),'sRGB');
assert.match(css,/--friend-online:#00ccbb/);
assert.match(css,/overflow-y:auto/);
assert.ok(css.includes('line_dot_h4_wh.png'));
assert.ok(css.includes('112 * var(--tab-unit)'));
assert.ok(css.includes('220 * var(--count-unit)'));
assert.ok(!css.includes('background:#44446680'));
let copied='';
vm.runInNewContext(fs.readFileSync('themes/sekai-next/source/js/friends.js','utf8'),{document,navigator:{clipboard:{writeText:async text=>{copied=text;}}},Date});
const click=s=>document.querySelector(s).dispatchEvent(new window.Event('click',{bubbles:true}));
click('[data-friends-tab="exchange"]');
assert.equal(document.querySelector('#friends-list-panel').hidden,true);
assert.equal(document.querySelector('#friends-exchange-panel').hidden,false);
assert.equal(document.querySelector('[data-friends-toolbar]').hidden,true);
click('[data-friends-tab="list"]');
assert.equal(document.querySelector('#friends-list-panel').hidden,false);
const names=()=>[...document.querySelectorAll('.friends-row')].map(r=>r.dataset.friendName);
assert.deepEqual(names(),rows.map(r=>r.dataset.friendName).sort((a,b)=>a.localeCompare(b,'zh-CN')));
const asc=names();click('[data-friends-order]');assert.deepEqual(names(),asc.reverse());
click('[data-friends-sort]');click('[data-friends-order]');
assert.deepEqual(names(),rows.map(r=>r.dataset.friendName));
assert.equal(document.querySelector('[data-friends-sort]').textContent,'加入顺序');
click('[data-friends-sort]');
assert.equal(document.querySelector('[data-friends-sort]').textContent,'名称顺序');
click('[data-friends-copy]');
setImmediate(()=>{assert.ok(copied.includes('https://siestazzz.github.io'));assert.match(document.querySelector('[data-friends-feedback]').textContent,/已复制/);console.log('PASS: 7 direct links, original assets, no hearts/details, tabs, sorting, copy, scroll rules.');});
