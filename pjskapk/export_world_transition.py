"""Original transition UI sprite references and serialized evidence."""
from extract_map_assets import *
import struct
data=ROOT/'analysis-6.8.1/unpacked/assets/bin/Data';dest=OUT/'transition';dest.mkdir(exist_ok=True)
rows=json.loads((ROOT/'analysis-6.8.1/objects.json').read_text(encoding='utf8'));index={(r['file'],r['path_id']):r for r in rows};records=[]
for file in ['f41fb1615e34a444faafcc8ccbf15a05','c790a5c99b4fd4f80a2e34152b8f6fe7']:
 e=UnityPy.load(str(data/file))
 for ob in e.objects:
  if ob.type.name!='MonoBehaviour':continue
  m=ob.read(check_read=False);raw=ob.get_raw_data();refs=[]
  try:script=m.m_Script.read().m_ClassName
  except:script='unknown'
  for offset in range(32,len(raw)-11,4):
   fid,pid=struct.unpack_from('<iq',raw,offset)
   if not 0<fid<=len(ob.assets_file.externals):continue
   r=index.get((ob.assets_file.externals[fid-1].path.split('/')[-1],pid))
   if not r or r['type'] not in ['Sprite','Texture2D']:continue
   sprite=next(x for x in UnityPy.load(str(data/r['file'])).objects if x.path_id==pid).read();sprite.image.save(dest/(r['name']+'.png'));refs.append(r)
  record={'source':file,'sha256':hashlib.sha256((data/file).read_bytes()).hexdigest(),'id':str(ob.path_id),'node':m.m_GameObject.read().m_Name,'script':script,'raw':raw.hex(),'sprites':refs};records.append(record)
  print(record['node'],script,[r['name'] for r in refs])
(dest/'provenance.json').write_text(json.dumps(records,indent=2,ensure_ascii=False),encoding='utf8')
