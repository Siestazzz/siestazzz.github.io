"""Export original touch prefab/particle/material data for repeatable web mapping."""
import json
import re
from pathlib import Path
import UnityPy

ROOT = Path(__file__).resolve().parent / 'analysis-6.8.1'
DATA = ROOT / 'unpacked/assets/bin/Data'
OUT = ROOT / 'ui-data/tap-effect.json'
files = ['e5cd519baaf464685bf5e0a5bcc4d162', '89238adfbd2d1b046be2d83b53172fac', 'a0afb561621043b4e9a9dc9065b4c590']
files.append('568a878723d034146899b0eebd8ca058')
records = []
for file in files:
    for obj in UnityPy.load(str(DATA / file)).objects:
        if obj.type.name not in ['GameObject', 'Transform', 'ParticleSystem', 'ParticleSystemRenderer', 'Material']:
            continue
        tree = obj.read_typetree()
        records.append(dict(file=file, path_id=obj.path_id, type=obj.type.name, data=tree))
        if obj.type.name in ['GameObject', 'Material']:
            print(obj.path_id, obj.type.name, tree.get('m_Name'), tree.get('m_SavedProperties', ''))
OUT.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
print(OUT)
assets = ROOT.parent.parent / 'themes/sekai-next/source/game-assets'
for file in ['ec92a5114c5efd0439a94b59a4714420', 'f656653e67cd1fb4e9595a568ee20c3d']:
    for obj in UnityPy.load(str(DATA / file)).objects:
        if obj.type.name == 'Texture2D':
            texture = obj.read()
            target = assets / (texture.m_Name + '-original.png')
            texture.image.save(target)
            print(target)

# Preserve the actual 30-vertex, 18-face mesh including front/back/edge UVs.
env = UnityPy.load(str(DATA / 'c1590667986a4d94898b86969e44821e'))
mesh = next(o.read() for o in env.objects if o.type.name == 'Mesh')
lines = mesh.export().splitlines()
vertices = [[float(v) for v in line.split()[1:]] for line in lines if line.startswith('v ')]
uvs = [[float(v) for v in line.split()[1:]] for line in lines if line.startswith('vt ')]
normals = [[float(v) for v in line.split()[1:]] for line in lines if line.startswith('vn ')]
faces = [[int(v.split('/')[0])-1 for v in line.split()[1:]] for line in lines if line.startswith('f ')]
(assets / 'tap-mesh.json').write_text(json.dumps(dict(vertices=vertices, uvs=uvs, normals=normals, faces=faces)), encoding='utf-8')

# Original lighting shader source, for auditing the normal-dependent aura sampling.
from UnityPy.helpers import CompressionHelper
env = UnityPy.load(str(DATA / '1b6c6cdde375e3a45a969341f9bcc9f5'))
for obj in env.objects:
    if obj.type.name != 'Shader':
        continue
    shader = obj.read()
    for i, platform in enumerate(shader.platforms):
        for j, offset in enumerate(shader.offsets[i]):
            length = shader.compressedLengths[i][j]
            raw = CompressionHelper.decompress_lz4(bytes(shader.compressedBlob)[offset:offset+length], shader.decompressedLengths[i][j])
            strings = re.findall(rb'[\x09\x0a\x0d\x20-\x7e]{30,}', raw)
            (OUT.parent / f'tap-shader-{platform}-{j}.txt').write_text('\n'.join(s.decode() for s in strings), encoding='utf-8')
