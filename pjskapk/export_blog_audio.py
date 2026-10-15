"""Extract source ACBs from device bundles, preserving source object provenance."""
from pathlib import Path
import json
import UnityPy
from extract_map_assets import fetch, decode

root=Path(__file__).resolve().parent
out=root/'analysis-6.8.1/audio-audit'
out.mkdir(exist_ok=True)
records=[]
for key in ['mysekai/sound/bgm/music0001','mysekai/sound/bgm/music0002','sound/menu/menu_common']:
    p=fetch(key)
    assert p, key
    for o in UnityPy.load(decode(p.read_bytes())).objects:
        if o.type.name!='TextAsset': continue
        d=o.read()
        raw=d.m_Script.encode('utf-8','surrogateescape') if isinstance(d.m_Script,str) else d.m_Script
        (out/d.m_Name).write_bytes(raw)
        records.append(dict(key=key,bundle=p.name,path_id=o.path_id,name=d.m_Name,bytes=len(raw)))
(out/'sources.json').write_text(json.dumps(records,indent=2),encoding='utf8')
print(records)
