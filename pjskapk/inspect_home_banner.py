import json,struct
from pathlib import Path
import UnityPy
ROOT=Path(__file__).resolve().parent;DATA=ROOT/'analysis-6.8.1/unpacked/assets/bin/Data'
OUT=ROOT.parent/'themes/sekai-next/source/game-assets/home';OUT.mkdir(exist_ok=True)
rows=json.loads((ROOT/'analysis-6.8.1/objects.json').read_text(encoding='utf-8'));index={(r['file'],r['path_id']):r for r in rows};records=[]
for file in ['1b7a0ea3397cc4b50afa58eaa2030516','2dc2380372f34e74c89a4320eca7ef6e','243e08061110e43a29ab4658373c63e4']:
 for ob in UnityPy.load(str(DATA/file)).objects:
  if ob.type.name!='MonoBehaviour':continue
  m=ob.read(check_read=False)
  try:script=m.m_Script.read().m_Name
  except:continue
  go=m.m_GameObject.read();tr=next((c.component.read() for c in go.m_Component if c.component.type.name=='RectTransform'),None)
  if not tr:continue
  parts=[go.m_Name];p=tr.m_Father
  while p.m_PathID:
   t=p.read();parts.append(t.m_GameObject.read().m_Name);p=t.m_Father
  path='/'.join(reversed(parts))
  if not ('Banner' in path or 'Gacha' in path):continue
  raw=ob.get_raw_data();refs=[]
  for offset in range(32,len(raw)-11,4):
   fid,pid=struct.unpack_from('<iq',raw,offset)
   if not 0<fid<=len(ob.assets_file.externals):continue
   r=index.get((ob.assets_file.externals[fid-1].path.split('/')[-1],pid))
   if r and r['type']=='Sprite':
    asset=next(x for x in UnityPy.load(str(DATA/r['file'])).objects if x.path_id==pid);asset.read().image.save(OUT/(r['name']+'.png'));refs.append(dict(**r,border=asset.read_typetree()['m_Border']))
  records.append(dict(file=file,path=path,script=script,rect=tr.object_reader.read_typetree(),refs=refs,raw=raw.hex()))
  if script in ['PageChanger','PageCarousel'] or refs:print(path,script,[r['name'] for r in refs],raw.hex() if script in ['PageChanger','PageCarousel'] else '')
(ROOT/'home-banner-metadata.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
