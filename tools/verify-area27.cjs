const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {parseHTML}=require('../pjskapk/analysis-tools/dom/node_modules/linkedom');
const root='public/game-assets/map/area27',data=JSON.parse(fs.readFileSync(root+'/effects.json','utf8'));
assert.equal(data.groups.filter(g=>g.kind==='cloud').length,15);
assert.equal(data.groups.filter(g=>g.kind==='tree').length,6);
assert.equal(data.groups.filter(g=>g.kind==='field').length,6);
for(const g of data.groups){
 assert.equal(typeof g.id,'string','64-bit Unity IDs must not lose JS precision');
 for(const tex of Object.values(g.textures))assert(fs.existsSync(path.join(root,tex)),tex);
 assert(g.path.startsWith('area27/Background/')||g.path.startsWith('wish_tree_ppr_idle/'));
}
const cloud=data.groups.find(g=>g.id==='-8841350809274218037');
assert.equal(cloud.life.mode,0);assert.equal(cloud.life.max,30);assert.equal(cloud.life.min,200,'inactive minimum retained, not used');
assert.equal(cloud.uv.x,2);assert.equal(cloud.uv.y,4);
const big=data.groups.find(g=>g.path.endsWith('fx_tri_bottom/pt_tri'));
assert.equal(big.size.mode,3);assert.equal(big.size.min,35);assert.equal(big.size.max,20);assert.equal(big.mesh.vertices.length,30);
const glow=data.groups.find(g=>g.name==='pt_seedling_glow_01');assert.equal(glow.mesh,null,'Billboard must ignore stale mesh binding');
assert.equal(glow.additive,true);
const {document}=parseHTML(fs.readFileSync('public/index.html','utf8'));
assert(document.querySelector('.unknown-landscape canvas.unknown-clouds'));
assert(document.querySelector('.unknown-landscape canvas.unknown-effects'));
assert(document.querySelector('script[src="/js/home-effects.js"]'));
assert.equal(document.querySelector('.world-motes'),null);
console.log('PASS: 15 cloud emitters, 6 field groups, 6 tree groups, atlas/assets, active constant mode, large mesh, billboard renderer, homepage wiring.');
