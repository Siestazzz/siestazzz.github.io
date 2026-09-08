import json,struct
from pathlib import Path
import UnityPy
ROOT=Path(__file__).resolve().parent/'analysis-6.8.1'
DATA=ROOT/'unpacked/assets/bin/Data'
rows=json.loads((ROOT/'objects.json').read_text(encoding='utf-8'))
ids={620,262,1602,4357,6967,8922}
patterns=[struct.pack('<iq',1,i) for i in ids]
hits=[]
for f in sorted({r['file'] for r in rows if r['type']=='MonoBehaviour'}):
    raw=(DATA/f).read_bytes()
    if not any(p in raw for p in patterns): continue
    env=UnityPy.load(str(DATA/f))
    for o in env.objects:
        if o.type.name!='MonoBehaviour': continue
        try:
            m=o.read(check_read=False)
            if m.m_Script.m_PathID not in ids: continue
            script=m.m_Script.read().m_Name
            rec=dict(file=f,path_id=o.path_id,script=script,gameObject=m.m_GameObject.read().m_Name,raw=o.get_raw_data().hex())
            hits.append(rec); print(rec,flush=True)
        except Exception: pass
(ROOT/'ui-data/components.json').write_text(json.dumps(hits,indent=2),encoding='utf-8')
