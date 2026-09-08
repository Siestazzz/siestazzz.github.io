"""Inspect original home button serialized states for repeatable web mapping."""
from pathlib import Path
import struct
import json
import UnityPy

data = Path(__file__).resolve().parent / 'analysis-6.8.1/unpacked/assets/bin/Data'
env = UnityPy.load(str(data / '1b7a0ea3397cc4b50afa58eaa2030516'))
for obj in env.objects:
    if obj.type.name != 'MonoBehaviour':
        continue
    m = obj.read(check_read=False)
    script = m.m_Script.read().m_Name
    go = m.m_GameObject.read()
    if go.m_Name not in ('Gacha', 'Live', 'Image') or script != 'CustomButton':
        continue
    raw = obj.get_raw_data()
    print(go.m_Name, obj.path_id, script, len(raw))
    print('Unity transition mode (0=None):', struct.unpack_from('<i', raw, 88)[0])

palette = (data / 'globalgamemanagers.assets').read_bytes()
pos = palette.index(b'tap_gn_1')
# Entry: name[8], value count[4], theme GUID length[4], GUID[36], value flag[4], RGBA[16].
rgba = struct.unpack_from('<4f', palette, pos + 56)
print('tap_gn_1', rgba, tuple(round(v * 255) for v in rgba))
rows = json.loads((data.parents[3] / 'objects.json').read_text(encoding='utf-8'))
out = Path(__file__).resolve().parent.parent / 'themes/sekai-next/source/game-assets/home'
for name in ('btn_home_live', 'btn_home_live_on'):
    row = next(r for r in rows if r.get('name') == name and r['type'] == 'Sprite')
    sprite = next(o.read() for o in UnityPy.load(str(data / row['file'])).objects if o.path_id == row['path_id'])
    sprite.image.save(out / (name + '.png'))
    print('export', name, row['file'])
