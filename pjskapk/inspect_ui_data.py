"""Read original material fields and UI prefab bindings, not screenshot estimates."""
import json
from pathlib import Path
import UnityPy
ROOT=Path(__file__).resolve().parent / 'analysis-6.8.1'
DATA=ROOT/'unpacked/assets/bin/Data'
rows=json.loads((ROOT/'objects.json').read_text(encoding='utf-8'))
out=ROOT/'ui-data'
out.mkdir(exist_ok=True)
def save(name,value):
    (out/(name+'.json')).write_text(json.dumps(value,ensure_ascii=False,indent=2,default=str),encoding='utf-8')
for row in rows:
    if row['type']=='Material' and row.get('name') in ['UIBlur','UIGaussianBlur','GaussianBlur','JacketEdgeTransparency']:
        env=UnityPy.load(str(DATA/row['file']))
        obj=next(o for o in env.objects if o.path_id==row['path_id'])
        tree=obj.read_typetree()
        save(row['name'],dict(source=row,data=tree))
        print(row['name'],tree.get('m_SavedProperties'))
names=['CommonBackground','CommonBackgroundDot','MusicSelectSpectrumLineViewer','SoloMusicSelectView','MusicSelectView','LiveMenuView']
files={r['file'] for r in rows if r['type']=='GameObject' and r.get('name') in names}
files.update(['0d9704462196b46fe8bf0b852e6f8f22','a2ecfe8653ff4498d8081cc5784d28c9','c8fa94ddc93264d2c9724ce4cbfcd6f4','f6dc28e0db362462395ae06553ee551c','a3281684cc4d145418e892a49944aab1','dda81731e906904488b8ae15ce6e83ca','bdeecb5c84c909b48a0f39651d46cab3','28c0f589d6778da4db63687135fe3a6a','af5f1b95e91154c278a5156c9f5ecd32'])
for file in files:
    env=UnityPy.load(str(DATA/file))
    records=[]
    for obj in env.objects:
        if obj.type.name not in ['GameObject','MonoBehaviour','RectTransform']: continue
        try: tree=obj.read_typetree()
        except Exception as ex:
            tree=dict(error=str(ex)[:160])
            if obj.type.name=='MonoBehaviour':
                try:
                    m=obj.read(check_read=False)
                    tree.update(script=m.m_Script.read().m_Name,gameObject=m.m_GameObject.read().m_Name,raw=obj.get_raw_data().hex())
                except Exception as ex2: tree['read_error']=str(ex2)[:160]
        records.append(dict(path_id=obj.path_id,type=obj.type.name,data=tree))
    save(file,records)
    print('prefab',file,len(records))
