const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.join(__dirname,'../themes/sekai-next/source/game-assets/map/area9');
const read=n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'));
const scene=read('scene.json'),effects=read('effects.json'),items=read('items.json');
assert.equal(scene.sha256,'e1783986d6663d163be625673356a312f41e10c58b2df031eb5b87e6fd1c84e4');
assert.deepEqual(scene.coordinateSize,[3378,1600]);assert.equal(scene.groundFile,'sky-base.png');
assert.equal(scene.sprites.length,11);assert.equal(items.sprites.length,9);
assert.equal(effects.groups.length,28);assert.equal(effects.groups.filter(g=>g.kind==='cloud').length,2);
assert.equal(scene.motion.length,2);assert.deepEqual(scene.motion.map(m=>m.duration).sort(),[3,4]);
for(const m of scene.motion){assert.equal(m.type,'TweenPosition');assert.equal(m.loopType,2);assert(scene.sprites.some(s=>s.path===m.path||s.path.startsWith(m.path+'/')));}
for(const s of [...scene.sprites,...items.sprites]){
 assert(!/miku|character/.test(s.file));assert(fs.existsSync(path.join(dir,s.file)),s.file);
 assert(['back','front'].includes(s.webLayer));assert.equal(typeof s.renderer,'string');
 for(const n of [...s.position,...s.size,...s.pivot,...s.scale])assert(Number.isFinite(n));
}
for(const g of effects.groups){assert([1,600].includes(g.webUnitScale));for(const file of Object.values(g.textures))assert(fs.existsSync(path.join(dir,file)));}
assert.equal(effects.groups.find(g=>g.name==='ParticleCloudfront').uv.x,4);
assert.equal(effects.groups.find(g=>g.name==='ParticleCloudback').uv.x,3);
assert.equal(effects.groups.find(g=>g.name==='fx_attraction_tri_03').shape.type,17);
assert(scene.sprites.find(s=>s.file==='jetcoaster.png'));assert(!scene.motion.some(m=>m.path.includes('jetcoaster')));
console.log('area9 source package verified: 11 sprites, 9 items, 28 particle groups, 2 original tweens; browser validation is separate.');
