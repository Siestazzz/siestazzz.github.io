"""Index original shaders and preserve readable compiled GLES programs, not guessed HLSL."""
import json, re
from pathlib import Path
import UnityPy
from UnityPy.helpers import CompressionHelper

ROOT = Path(__file__).resolve().parent / 'analysis-6.8.1'
OUT = ROOT / 'il2cpp-audit/shaders'
OUT.mkdir(parents=True, exist_ok=True)
records = json.loads((ROOT / 'objects.json').read_text(encoding='utf8'))
index = []
for record in records:
    if record['type'] != 'Shader':
        continue
    env = UnityPy.load(str(ROOT / 'unpacked/assets/bin/Data' / record['file']))
    obj = next(o for o in env.objects if o.path_id == record['path_id'])
    shader = obj.read()
    name = shader.m_ParsedForm.m_Name if shader.m_ParsedForm else shader.m_Name
    entry = dict(file=record['file'], path_id=record['path_id'], name=name)
    index.append(entry)
    if not any(word in name.lower() for word in ['blur', 'gradient', 'fade', 'uieffect']):
        continue
    stem = record['file'] + '-' + str(record['path_id'])
    (OUT / (stem + '.json')).write_text(json.dumps(obj.read_typetree(), indent=2), encoding='utf8')
    for i, platform in enumerate(shader.platforms):
        for j, offset in enumerate(shader.offsets[i]):
            length = shader.compressedLengths[i][j]
            data = CompressionHelper.decompress_lz4(bytes(shader.compressedBlob)[offset:offset+length], shader.decompressedLengths[i][j])
            (OUT / f'{stem}-{platform}-{j}.bin').write_bytes(data)
            strings = re.findall(rb'[\x09\x0a\x0d\x20-\x7e]{30,}', data)
            (OUT / f'{stem}-{platform}-{j}.txt').write_text('\n'.join(s.decode() for s in strings), encoding='utf8')
    print(name, stem)
(OUT / 'index.json').write_text(json.dumps(index, indent=2), encoding='utf8')
