import json, struct
from pathlib import Path
import UnityPy
ROOT=Path(__file__).resolve().parent/'analysis-6.8.1'
DATA=ROOT/'unpacked/assets/bin/Data'
rows=json.loads((ROOT/'objects.json').read_text(encoding='utf-8'))
index={(r['file'],r['path_id']):r for r in rows}
files=['a2ecfe8653ff4498d8081cc5784d28c9','f6dc28e0db362462395ae06553ee551c','c8fa94ddc93264d2c9724ce4cbfcd6f4','a3281684cc4d145418e892a49944aab1','dda81731e906904488b8ae15ce6e83ca','bdeecb5c84c909b48a0f39651d46cab3','28c0f589d6778da4db63687135fe3a6a','af5f1b95e91154c278a5156c9f5ecd32']
result=[]
for file in files:
    env=UnityPy.load(str(DATA/file))
    for obj in env.objects:
        if obj.type.name!='MonoBehaviour': continue
        m=obj.read(check_read=False)
        script=m.m_Script.read().m_Name
        if script not in ['CustomImage','CustomRawImage','UIPartsBlurMusicJacket','UIPartsLineSpectrumAnalyzer']: continue
        go=m.m_GameObject.read()
        trans=next(c.component.read() for c in go.m_Component if c.component.type.name=='RectTransform')
        parts=[go.m_Name]; father=trans.m_Father
        while father.m_PathID:
            parent=father.read(); parts.append(parent.m_GameObject.read().m_Name); father=parent.m_Father
        raw=obj.get_raw_data()
        refs=[]
        externals=obj.assets_file.externals
        for offset in range(32,len(raw)-11,4):
            fid,pid=struct.unpack_from('<iq',raw,offset)
            if not 0<fid<=len(externals): continue
            target=externals[fid-1].path.split('/')[-1]
            r=index.get((target,pid))
            if r and r['type'] in ['Sprite','Material','Texture2D']:
                refs.append(dict(offset=offset,**r))
        record=dict(file=file,path_id=obj.path_id,script=script,path='/'.join(reversed(parts)),
                    rect=trans.object_reader.read_typetree() if hasattr(trans,'object_reader') else str(trans.m_SizeDelta),
                    refs=refs,raw=raw.hex())
        result.append(record)
(ROOT/'ui-data/bindings.json').write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding='utf-8')
for r in result:
    if r['refs']: print(r['file'][:6],r['path_id'],r['path'],[(x['offset'],x['name']) for x in r['refs']])
