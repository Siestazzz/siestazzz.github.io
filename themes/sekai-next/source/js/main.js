window.SekaiPages.register('main', function (scope) {
'use strict';
const root = document.body.dataset.root || '/';
const asset = name => root + 'game-assets/' + name;
const panel = document.querySelector('.menu-panel');
const toggle = document.querySelector('.menu-toggle');
const close = document.querySelector('.menu-close');
function menu(open) {
  document.body.classList.toggle('menu-open', open);
  toggle?.setAttribute('aria-expanded', String(open));
  panel?.setAttribute('aria-hidden', String(!open));
  if (panel) panel.inert = !open;
  const entryPending=document.documentElement.classList.contains('title-entry-pending');
  for(const selector of ['.site-main','.topbar']){const node=document.querySelector(selector);if(node)node.inert=open||entryPending;}
  const entry=document.querySelector('.title-entry');if(entry)entry.inert=open;
  const audioControls=document.getElementById('site-audio-controls');if(audioControls)audioControls.inert=open;
  (open ? close : entryPending?document.querySelector('.title-entry-menu'):toggle)?.focus();
}
if (panel) panel.inert = true;
toggle?.addEventListener('click', () => menu(true));
close?.addEventListener('click', () => menu(false));
document.querySelector('.menu-scrim')?.addEventListener('click', () => menu(false));
scope.listen(document,'keydown', e => {
  if (e.key === 'Escape' && document.body.classList.contains('menu-open')) menu(false);
  if (e.key === 'Tab' && document.body.classList.contains('menu-open')) {
    const items = [...panel.querySelectorAll('a,button')];
    if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === items.at(-1)) { e.preventDefault(); items[0].focus(); }
  }
});
const views = id => window.SekaiStats?.views(id) ?? '—';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
scope.listen(window,'pageshow', () => document.body.classList.remove('page-leaving'));
const line = document.querySelector('#len-line');
const lines = ['代码先放一边……要不要读点有趣的东西？','报错不是消失了，只是换了一个地方。','今天的目标：写完这篇，然后光速下班。','这不是摸鱼，是在给灵感加载缓存。'];
let lineIndex = 0;
document.querySelector('.len-talk:not(.live2d-talk)')?.addEventListener('click', () => {
  line.textContent = lines[++lineIndex % lines.length];
  line.animate([{opacity:0},{opacity:1}], {duration:reduced.matches ? 0 : 167});
});
const input = document.querySelector('#song-query');
if (!input) return;
const state = document.querySelector('#song-state'), list = document.querySelector('#song-list'), preview = document.querySelector('#song-preview'), tabs = document.querySelector('#unit-tabs');
let params = new URLSearchParams(location.search);
if(!params.size){try{const saved=new URL(sessionStorage.getItem('sekai-select-return')||location.href,location.origin);if(saved.pathname===location.pathname)params=saved.searchParams;}catch{}}
input.value = params.get('q') || '';
let category = params.get('category') || '', selected = params.get('post') || '', posts = [], matched = [];
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unitIcons = ['vs','ln','mj','vb','ws','25'];
const spectrum = '<span class="row-spectrum" aria-hidden="true">' + Array.from({length:6},(_,i) => '<i style="--bar:' + i + '"></i>').join('') + '</span>';

function remember() {
  const p = new URLSearchParams();
  if (input.value.trim()) p.set('q',input.value.trim());
  if (category) p.set('category',category);
  if (selected) p.set('post',selected);
  history.replaceState(history.state,'',location.pathname + (p.size ? '?' + p.toString() : ''));
  try { sessionStorage.setItem('sekai-select-return', location.pathname + location.search); } catch {}
}
function select(post) {
  selected = post.path;
  list.querySelectorAll('.song-row').forEach(el => { const active = el.dataset.path === selected; el.classList.toggle('selected', active); el.setAttribute('aria-pressed', String(active)); });
  preview.innerHTML = '<p class="preview-category">' + esc(post.categories.join(' / ') || 'RECORD') + '</p><h1>' + esc(post.title) + '</h1><p class="preview-date">' + esc(post.date) + '</p><div class="preview-tags">' + (post.tagLinks || post.tags.map(name=>({name,path:'tags/'+encodeURIComponent(name)+'/'}))).map(t => '<a href="' + esc(root+t.path) + '">' + esc(t.name) + '</a>').join('') + '</div><p class="preview-excerpt">' + esc(post.excerpt) + '</p><a class="read-start" href="' + esc(root + post.path) + '">开始阅读</a><button class="random-post" type="button"><img src="' + asset('btn_random_lgr.png') + '" alt="">随机一篇</button>';
  preview.querySelector('.random-post').addEventListener('click', random);
  preview.querySelector('.random-post').disabled = matched.length < 2;
  if (!reduced.matches) preview.animate([{opacity:.1, transform:'translateX(20px)'},{opacity:1,transform:'translateX(0)'}],{duration:250,easing:'ease-out'});
  remember();
}
function random() {
  const pool = matched.filter(p => p.path !== selected);
  if (!pool.length) return;
  select(pool[Math.floor(Math.random() * pool.length)]);
  list.querySelector('.selected')?.scrollIntoView({block:'nearest',behavior:reduced.matches?'instant':'smooth'});
}
function render() {
  const q = input.value.trim().toLocaleLowerCase();
  matched = posts.filter(p => (!category || p.categories.includes(category)) && [p.title,p.text,p.excerpt,...p.tags].join(' ').toLocaleLowerCase().includes(q));
  state.textContent = matched.length + ' 篇文章';
  const diamonds = '<span class="diamonds" aria-hidden="true">' + ('<img src="' + asset('icon_allPerfect.png') + '" alt="">').repeat(5) + '</span>';
list.innerHTML = matched.map(p => '<button type="button" class="song-row" data-path="' + esc(p.path) + '"><span class="view-medal"><small>阅读量</small><b data-post-views="' + esc(p.statsId) + '">' + views(p.statsId) + '</b></span>' + spectrum + '<span class="song-info"><strong>' + esc(p.title) + '</strong><time>' + esc(p.date) + '</time>' + diamonds + '</span><span class="row-tag">' + esc(p.tags[0] || 'NOTE') + '</span></button>').join('');
  list.querySelectorAll('button').forEach(el => el.addEventListener('click', () => select(matched.find(p => p.path === el.dataset.path))));
  tabs.querySelectorAll('button').forEach(el => { const active = el.dataset.category === category; el.classList.toggle('active',active); el.setAttribute('aria-pressed',String(active)); const img = el.querySelector('img[data-unit]'); if (img) img.src = asset('icon_tab_unit_' + img.dataset.unit + '_' + (active ? 'on' : 'off') + '.png'); });
  if (matched.length) { select(matched.find(p => p.path === selected) || matched[0]); preview.querySelector('.random-post').disabled = matched.length < 2; }
  else { selected = ''; preview.innerHTML = '<div class="empty-selection"><h2>没有匹配的文章</h2><p>试试其他标题、标签或正文关键词。</p><button class="read-start" id="clear-query">清空搜索和分类</button></div>'; preview.querySelector('button').addEventListener('click',()=>{input.value='';category='';render();input.focus();});remember(); }
}
const postData=window.sekaiPostData||(window.sekaiPostData=fetch(root+'search.json').then(r=>{if(!r.ok)throw Error('index');return r.json();}).catch(error=>{window.sekaiPostData=null;throw error;}));
postData.then(data => {
  if(scope.signal.aborted)return;
  if (!Array.isArray(data)) throw Error('index');
  posts = data;
  const categories = ['CTF', 'Android', '漏洞挖掘', '逆向工程', 'AI', '其他'];
  if (!categories.includes(category)) category = '';
  tabs.innerHTML = '<button type="button" data-category="">全部<small>ALL</small></button>' + categories.map((c,i) => '<button type="button" data-category="' + esc(c) + '"><img data-unit="' + unitIcons[i%6] + '" src="' + asset('icon_tab_unit_' + unitIcons[i%6] + '_off.png') + '" alt=""><span>' + esc(c) + '</span></button>').join('');
  tabs.querySelectorAll('button').forEach(b => b.addEventListener('click',()=>{category=b.dataset.category;render();}));
  render();
}).catch(() => { if(scope.signal.aborted)return;state.textContent='文章加载失败，请刷新重试。'; preview.innerHTML='<a class="read-start" href="' + root + 'archives/">查看文章归档</a>'; });
input.addEventListener('input',render);
document.querySelector('.song-search').addEventListener('submit',e=>{e.preventDefault();render();});
});
