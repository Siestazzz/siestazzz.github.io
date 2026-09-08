const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {parseHTML}=require('../pjskapk/analysis-tools/dom/node_modules/linkedom');
const root=path.resolve(__dirname,'..');
const report=JSON.parse(fs.readFileSync(path.join(root,'docs/local-post-import.json'),'utf8'));
const posts=JSON.parse(fs.readFileSync(path.join(root,'public/search.json'),'utf8'));
let local=0,remote=0;
for(const record of report){
 const original=fs.readFileSync(path.join(root,'..',record.source));
 assert.equal(crypto.createHash('sha256').update(original).digest('hex'),record.source_sha256,'original changed');
 const post=posts.find(p=>p.title===record.title);assert.ok(post,record.title);
 assert.deepEqual([...post.tags].sort(),[...record.tags].sort());
 const html=fs.readFileSync(path.join(root,'public',post.path,'index.html'),'utf8');
 const {document}=parseHTML(html);
 for(const image of document.querySelectorAll('.article-content img')){
  const src=image.getAttribute('src');
  if(/^https?:/.test(src)){remote++;continue;}
  assert.ok(src.startsWith('/media/posts/'),src);
  assert.ok(fs.existsSync(path.join(root,'public',decodeURIComponent(src))),src);local++;
 }
 const imported=fs.readFileSync(path.join(root,record.target),'utf8');
 const fences=s=>[...s.matchAll(/^(`{3,}|~{3,})[^\n]*\n([\s\S]*?)^\1\s*$/gm)].map(m=>m[2].replace(/\r/g,''));
 assert.deepEqual(fences(imported),fences(original.toString('utf8')),'code blocks modified: '+record.title);
}
assert.equal(report.length,10);assert.equal(posts.length,13);
console.log(`PASS: ${report.length} imports, ${posts.length} total posts, tags, original hashes, code blocks, ${local} local image references; ${remote} remote image references retained.`);
