const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const crypto = require('crypto');
const base = path.resolve(__dirname, '..');
const dir = path.join(base, 'themes/sekai-next/source/game-assets/map/area8');
const audit = path.join(base, 'pjskapk/analysis-6.8.1/area8-audit');
const read = (dir, file) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
const scene = read(dir, 'scene.json'), items = read(dir, 'items.json'), effects = read(dir, 'effects.json');
assert.equal(scene.groundFile, 'bg.png');
assert.deepEqual(scene.coordinateSize, [3378.144396322671, 1600.0000314614213]);
assert.equal(scene.sprites.length, 1);
assert.equal(items.sprites.length, 10);
assert.equal(effects.groups.length, 18);
assert.equal(effects.textures.length, 4);
assert.equal(effects.groups.filter(g => g.webUnits === 1).length, 6);
assert.equal(effects.groups.filter(g => g.webUnits === 600).length, 12);
const objects = read(audit, 'objects.json');
const byId = new Map(objects.map(x => [x.id, x]));
for (const sprite of [...scene.sprites, ...items.sprites]) {
  assert(fs.existsSync(path.join(dir, sprite.file)));
  assert(!/miku|character/i.test(sprite.file));
  assert(sprite.position.every(Number.isFinite));
  assert(sprite.size.every(n => Number.isFinite(n) && n > 0));
  assert.equal(typeof sprite.renderer, 'string');
  if (sprite.spawnTransform) {
    assert(byId.has(sprite.spawnTransform));
    const itemAudit = read(audit, `${sprite.source.split('/')[1]}.json`);
    assert(itemAudit.some(x => x.id === sprite.renderer));
    assert.equal(sprite.webLayer, 'front');
  }
}
for (const g of effects.groups) {
  const original = byId.get(g.id).data;
  assert.equal(original.InitialModule.startSize.scalar, g.size.max);
  assert.equal(original.InitialModule.startLifetime.scalar, g.life.max);
  assert.equal(original.lengthInSec, g.duration);
  assert.equal(typeof g.id, 'string');
  for (const file of Object.values(g.textures)) assert(fs.existsSync(path.join(dir, file)));
  if (g.webUnits === 1) { assert.equal(g.mesh.vertices.length, 30); assert(g.cullBack); }
  else { assert(g.additive); assert.equal(g.shaderId, '6228555572980372533'); }
}
for (const source of [{key: scene.source, sha256: scene.sha256}, ...items.sources, ...effects.sources]) {
  const name = crypto.createHash('md5').update(source.key).digest('hex');
  const candidates = [path.join(base, 'pjskapk/analysis-6.8.1/map-bundles', name), path.join(audit, 'bundles', name)];
  const filename = candidates.find(f => fs.existsSync(f));
  assert(filename, source.key);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex'), source.sha256);
}
console.log('area8 source contract verified: 1 background, 10 items, 18 particle groups, 4 atlases; source hashes and original parameters match. Browser checks belong to root integration.');
