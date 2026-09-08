"""Find original separated honor layers, not retouched images."""
import json,struct,hashlib
from pathlib import Path
import UnityPy
UnityPy.config.FALLBACK_UNITY_VERSION='2022.3.62f2'
ROOT=Path(__file__).resolve().parent; LIB=ROOT/'honor-library'; DATA=ROOT/'analysis-6.8.1/unpacked/assets/bin/Data'
OUT=LIB/'bonds-layers';OUT.mkdir(exist_ok=True)
rows=json.loads((ROOT/'analysis-6.8.1/objects.json').read_text(encoding='utf-8'))
index={(r['file'],r['path_id']):r for r in rows}; nodes=[]; textures=[]
for file in ['29864637d77434f119b95e2e1b65f812']:
 for ob in UnityPy.load(str(DATA/file)).objects:
  if ob.type.name!='MonoBehaviour':continue
  m=ob.read(check_read=False)
  try:script=m.m_Script.read().m_Name
  except:continue
  if script not in ['CustomImage','CustomRawImage']:continue
  go=m.m_GameObject.read();raw=ob.get_raw_data();refs=[]
  for offset in range(32,len(raw)-11,4):
   fid,pid=struct.unpack_from('<iq',raw,offset)
   if not 0<fid<=len(ob.assets_file.externals):continue
   key=ob.assets_file.externals[fid-1].path.split('/')[-1];r=index.get((key,pid))
   if r and r['type']=='Sprite':
    asset=next(x for x in UnityPy.load(str(DATA/key)).objects if x.path_id==pid)
    dest=OUT/(r['name']+'.png');asset.read().image.save(dest);refs.append(r)
  nodes.append({'file':file,'node':go.m_Name,'script':script,'rgba':struct.unpack_from('<4f',raw,44),'refs':refs,'raw':raw.hex()})
for category in ['word','character']:
 folder=LIB/('bonds-'+category+'-bundles')
 for p in folder.iterdir():
  if not p.is_file():continue
  raw=p.read_bytes();blob=raw
  if raw[:4]==b'\x10\x00\x00\x00':
   head=bytearray(raw[4:132])
   for i in range(0,128,8):
    for j in range(5):head[i+j]^=255
   blob=bytes(head)+raw[132:]
  for ob in UnityPy.load(blob).objects:
   if ob.type.name!='Texture2D':continue
   t=ob.read();dest=OUT/category/p.name/(Path(t.m_Name).name+'.png');dest.parent.mkdir(parents=True,exist_ok=True);t.image.save(dest)
   textures.append({'category':category,'bundle':p.name,'name':t.m_Name,'path':dest.relative_to(LIB).as_posix(),'width':t.m_Width,'height':t.m_Height,'sha256':hashlib.sha256(raw).hexdigest()})
  if len(textures)%100==0:print(category,len(textures),flush=True)
(LIB/'bonds-nodes.json').write_text(json.dumps(nodes,ensure_ascii=False,indent=2),encoding='utf-8')
(LIB/'bonds-textures.json').write_text(json.dumps(textures,ensure_ascii=False,indent=2),encoding='utf-8')
print('NODES',[(n['node'],[r['name'] for r in n['refs']]) for n in nodes]);print('TEXTURES',len(textures))
