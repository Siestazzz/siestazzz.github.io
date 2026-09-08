const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {parseHTML}=require('../pjskapk/analysis-tools/dom/node_modules/linkedom');
const posts=JSON.parse(fs.readFileSync('public/search.json','utf8'));
(async()=>{
 let chapters=0;const images=new Set();
 for(const post of posts){
  const {document}=parseHTML(fs.readFileSync(path.join('public',post.path,'index.html'),'utf8'));
  const nav=document.querySelector('.chapter-index nav');assert.ok(nav,post.title);
  assert.ok(nav.querySelectorAll('a').length>0,post.title+' missing chapter/fallback');
  for(const a of nav.querySelectorAll('a')){
   assert.ok(document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))),a.getAttribute('href'));chapters++;
  }
  assert.ok(document.querySelector('.reader-card[tabindex="0"]'));
  for(const img of document.querySelectorAll('.article-content img')){
   assert.ok(img.getAttribute('src').startsWith('/media/posts/'));images.add(img.getAttribute('src'));
  }
 }
 const urls=[...images];let i=0;
 await Promise.all(Array.from({length:8},async()=>{while(i<urls.length){const url=urls[i++],res=await fetch('http://localhost:4100'+url,{method:'HEAD'});assert.equal(res.status,200,url);assert.ok(res.headers.get('content-type').startsWith('image/'),url);}}));
 const live=await(await fetch('http://localhost:4100/'+posts[0].path)).text();
 assert.ok(live.includes('chapter-index')&&live.includes('/js/reader.js'),'server returned stale article layout');
 console.log(`PASS: ${posts.length} chapter indexes, ${chapters} valid anchors, ${images.size} locally served images, current server article layout.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
