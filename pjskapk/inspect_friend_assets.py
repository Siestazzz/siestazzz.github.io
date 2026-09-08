"""Resolve original friend UI image bindings and export their sprites for Hexo."""
import json, struct
from pathlib import Path
import UnityPy
ROOT = Path(__file__).resolve().parent
DATA = ROOT/'analysis-6.8.1/unpacked/assets/bin/Data'
OUT = ROOT.parent/'themes/sekai-next/source/game-assets/friends'
OUT.mkdir(parents=True, exist_ok=True)
rows = json.loads((ROOT/'analysis-6.8.1/objects.json').read_text(encoding='utf-8'))
index = {(r['file'],r['path_id']):r for r in rows}
records=[]
for file in ['5ad78544b3cb6194db02e93acebc353a','f84c1c7438790a544bda1a125fc432d6','e826a636f6cfb4d87bec3fbd81243737']:
    env=UnityPy.load(str(DATA/file))
    for obj in env.objects:
        if obj.type.name!='MonoBehaviour': continue
        m=obj.read(check_read=False)
        try: script=m.m_Script.read().m_Name
        except Exception: continue
        if script not in ['CustomImage','CustomRawImage','CustomTextMeshProUGUI']: continue
        go=m.m_GameObject.read()
        trans=next((c.component.read() for c in go.m_Component if c.component.type.name=='RectTransform'),None)
        if trans is None: continue
        parts=[go.m_Name]; father=trans.m_Father
        while father.m_PathID:
            parent=father.read(); parts.append(parent.m_GameObject.read().m_Name); father=parent.m_Father
        raw=obj.get_raw_data(); refs=[]
        for offset in range(32,len(raw)-11,4):
            fid,pid=struct.unpack_from('<iq',raw,offset)
            if not 0<fid<=len(obj.assets_file.externals): continue
            target=obj.assets_file.externals[fid-1].path.split('/')[-1]
            row=index.get((target,pid))
            if row and row['type'] in ['Sprite','Texture2D']:
                refs.append(row)
                asset=next(o for o in UnityPy.load(str(DATA/target)).objects if o.path_id==pid)
                asset.read().image.save(OUT/(row['name']+'.png'))
        path='/'.join(reversed(parts))
        records.append(dict(file=file,path=path,script=script,refs=refs,rect=trans.object_reader.read_typetree(),raw=raw.hex()))
        print(path,[(r['name']) for r in refs])
(OUT/'provenance.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
extras=[]
for name in ['tab_wh','tab_gn','tab_dot_select_wh','tab_line_dot_dbl','icon_friend_dbl','icon_tofu_line_wh','btn_round_h80_gn']:
    row=next(r for r in rows if r.get('name')==name and r['type']=='Sprite')
    obj=next(o for o in UnityPy.load(str(DATA/row['file'])).objects if o.path_id==row['path_id'])
    obj.read().image.save(OUT/(name+'.png'))
    extras.append(row)
    print('extra',name)
(OUT/'extra-provenance.json').write_text(json.dumps(extras,ensure_ascii=False,indent=2),encoding='utf-8')
