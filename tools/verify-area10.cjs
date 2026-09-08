// Source-package checks only; browser/visual integration is separately performed by root.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'themes/sekai-next/source/game-assets/map/area10');
const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const scene=read('scene.json'),fx=read('effects.json'),items=read('items.json');
assert.equal(scene.source,'area/area10');assert.equal(scene.groundFile,'bg.png');assert.equal(scene.sprites.length,3);
assert(Math.abs(scene.coordinateSize[0]-3378.1444)<.001);assert(Math.abs(scene.coordinateSize[1]-1600)<.001);
assert.equal(scene.sha256,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'pjskapk/analysis-6.8.1/map-bundles/32dd412a0dd00548b821556b585e4ed6'))).digest('hex'));
assert.equal(scene.areaController.id,'3946379252017081923');assert.equal(scene.areaController.defaultPosition.x,1689);
assert.equal(items.sprites.length,8);assert.equal(fx.groups.length,15);assert.equal(fx.textures.length,6);
for(const sprite of [...scene.sprites,...items.sprites]){
 assert(fs.existsSync(path.join(dir,sprite.file)),sprite.file);assert(!/miku/i.test(sprite.file));
 assert.equal(typeof sprite.renderer,'string');assert.equal(typeof sprite.sprite,'string');
 assert(['front','back'].includes(sprite.webLayer));assert.equal(sprite.opacity,1);
}
for(const g of fx.groups){
 assert.equal(typeof g.id,'string');assert(g.path.startsWith('area10/Background/'));
 for(const f of Object.values(g.textures))assert(fs.existsSync(path.join(dir,f)),f);
 assert.equal(g.additive,g.shaderId==='6228555572980372533');
 assert.equal(g.cullBack,g.shaderId==='-1595268760865149387');
 if(g.name.startsWith('fx_light_')){assert.equal(g.webUnits,600);assert.equal(g.mesh.vertices.length,4);assert(g.size3D);}
 else assert.equal(g.webUnits,1);
}
const sun=fx.groups.find(g=>g.name==='fx_light_sun_front');
assert.deepEqual(sun.position,[2823,101]);assert.equal(sun.rateCurve.min,0);assert.equal(sun.rateCurve.max,1);
assert.equal(sun.startColor.mode,4);assert(Math.abs(sun.color.alpha[1][1]-.3137255)<.000001);
console.log('area10 source checks passed: 3 scene layers, 8 items, 15 particle groups; no browser claim.');
