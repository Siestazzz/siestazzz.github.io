"""Dump original tab/counter layout, image colors and Sprite borders; no guessed values."""
import json, struct
from pathlib import Path
import UnityPy
ROOT=Path(__file__).resolve().parent
DATA=ROOT/'analysis-6.8.1/unpacked/assets/bin/Data'
rows=json.loads((ROOT/'analysis-6.8.1/objects.json').read_text(encoding='utf-8'))
index={(r['file'],r['path_id']):r for r in rows}
files={r['file'] for r in rows if r.get('name') in ['UIPartsLeftTabListTextCell','UIPartsLeftTabListCellView'] and r['type']=='GameObject'}
files.add('e826a636f6cfb4d87bec3fbd81243737')
out=[]
for file in sorted(files):
 for obj in UnityPy.load(str(DATA/file)).objects:
  if obj.type.name!='RectTransform': continue
  tr=obj.read(); go=tr.m_GameObject.read(); parts=[go.m_Name]; p=tr.m_Father
  while p.m_PathID:
   par=p.read();parts.append(par.m_GameObject.read().m_Name);p=par.m_Father
  name='/'.join(reversed(parts))
  if 'LeftTab' not in name and 'FriendCount' not in name: continue
  record={'file':file,'path':name,'rect':obj.read_typetree(),'components':[]}
  for c in go.m_Component:
   co=c.component
   if co.type.name!='MonoBehaviour': continue
   m=co.deref().read(check_read=False)
   try: script=m.m_Script.read().m_Name
   except Exception: continue
   raw=m.object_reader.get_raw_data()
   refs=[]
   if script=='CustomImage':
    for offset in range(32,len(raw)-11,4):
     fid,pid=struct.unpack_from('<iq',raw,offset)
     externals=m.object_reader.assets_file.externals
     if not 0<fid<=len(externals): continue
     asset=index.get((externals[fid-1].path.split('/')[-1],pid))
     if asset and asset['type']=='Sprite':
      refs.append(asset)
      if name.endswith(('/Line','/Selected')):
       sprite=next(o for o in UnityPy.load(str(DATA/asset['file'])).objects if o.path_id==pid)
       sprite.read().image.save(ROOT.parent/'themes/sekai-next/source/game-assets/friends'/ (asset['name']+'.png'))
   record['components'].append({'script':script,'refs':refs,'raw':raw.hex(),'rgba_at_44':struct.unpack_from('<4f',raw,44) if script=='CustomImage' else None})
  out.append(record)
for r in rows:
 if r['type']=='Sprite' and r.get('name') in ['tab_bg_dbl','tab_gn','tab_line_dot_dbl','tab_dot_select_wh','bg_base_round_h48_wh','bg_base_round_h56_wh']:
  ob=next(o for o in UnityPy.load(str(DATA/r['file'])).objects if o.path_id==r['path_id'])
  s=ob.read();out.append({'sprite':r,'border':ob.read_typetree()['m_Border'],'rect':ob.read_typetree()['m_Rect'],'center_pixel':s.image.getpixel((s.image.width//2,s.image.height//2))})
(ROOT/'friend-layout-metadata.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
for r in out:
 if 'sprite' in r: print(r)
 else: print(r['file'],r['path'],r['rect']['m_AnchoredPosition'],r['rect']['m_SizeDelta'],[(c['script'],c['rgba_at_44']) for c in r['components']])
