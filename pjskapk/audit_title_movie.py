"""Extract actual device title content; preserve original movie segments and fields."""
import json
import struct
import hashlib
from pathlib import Path
import UnityPy
from extract_map_assets import fetch, decode

out = Path(__file__).parent / 'analysis-6.8.1/title-movie-audit'
out.mkdir(exist_ok=True)
key = 'title_screen/anniversary_5th_bg'
bundle = fetch(key)
env = UnityPy.load(decode(bundle.read_bytes()))
records = []
segments = []
for obj in env.objects:
    if obj.type.name == 'TextAsset':
        data = obj.read()
        raw = data.m_Script.encode('utf-8', 'surrogateescape') if isinstance(data.m_Script, str) else data.m_Script
        (out / data.m_Name).write_bytes(raw)
        segments.append((data.m_Name, raw))
        records.append(dict(path_id=obj.path_id, name=data.m_Name, bytes=len(raw), header=raw[:16].hex()))
    elif obj.type.name == 'MonoBehaviour':
        data = obj.read(check_read=False)
        name = data.m_Script.read().m_ClassName
        raw = obj.get_raw_data()
        (out / f'{name}-{obj.path_id}.bin').write_bytes(raw)
        records.append(dict(path_id=obj.path_id, component=name, raw=raw.hex()))
        if name == 'TitleContent':
            assert struct.unpack_from('<i',raw,44)[0] == 0  # live2ds
            assert struct.unpack_from('<i',raw,48)[0] == 1  # movies
            records[-1]['decoded'] = dict(live2d_count=0,movie_count=1,
                build_data_path_id=struct.unpack_from('<q',raw,56)[0],
                target_texture_path_id=struct.unpack_from('<q',raw,68)[0],
                view_texture_path_id=struct.unpack_from('<q',raw,80)[0],
                loop_point_frame=struct.unpack_from('<i',raw,88)[0])
(out / '5th_anv_title.usm').write_bytes(b''.join(raw for name, raw in sorted(segments)))
(out / 'inventory.json').write_text(json.dumps(dict(key=key,bundle=str(bundle),sha256=hashlib.sha256(bundle.read_bytes()).hexdigest(),objects=records),ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(records,ensure_ascii=False,indent=2))
