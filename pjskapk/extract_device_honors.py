"""Extract tablet honor cache, retaining original textures and bundle provenance.
Header format verified against mos9527/sssekai/sssekai/crypto/AssetBundle.py.
"""
import hashlib,json
from pathlib import Path
import UnityPy
UnityPy.config.FALLBACK_UNITY_VERSION='2022.3.62f2'
ROOT=Path(__file__).resolve().parent/'honor-library'
OUT=ROOT/'device-extracted';OUT.mkdir(exist_ok=True)
mapping={}
for name in ['honors','honorGroups']:
 for item in json.loads((ROOT/(name+'.json')).read_text(encoding='utf-8-sig')):
  for field in ['assetbundleName','backgroundAssetbundleName']:
   if item.get(field):
    key='honor/'+item[field];mapping[hashlib.md5(key.encode()).hexdigest()]=key
records=[]; errors=[]
for i,p in enumerate((ROOT/'device-bundles').iterdir()):
 if not p.is_file():continue
 try:
  raw=p.read_bytes(); blob=raw
  if raw[:4]==b'\x10\x00\x00\x00':
   head=bytearray(raw[4:132])
   for offset in range(0,128,8):
    for n in range(5):head[offset+n]^=255
   blob=bytes(head)+raw[132:]
  env=UnityPy.load(blob);key=mapping.get(p.name,'unmapped/'+p.name)
  for ob in env.objects:
   if ob.type.name!='Texture2D':continue
   tex=ob.read();name=Path(tex.m_Name).name
   if not name or name in ['.','..']:continue
   dest=OUT/key/(name if name.endswith('.png') else name+'.png');dest.parent.mkdir(parents=True,exist_ok=True)
   tex.image.save(dest)
   records.append({'bundle_hash':p.name,'logical_bundle':key,'texture':tex.m_Name,'path_id':ob.path_id,'path':dest.relative_to(ROOT).as_posix(),'width':tex.m_Width,'height':tex.m_Height,'bundle_sha256':hashlib.sha256(raw).hexdigest()})
 except Exception as e:errors.append({'bundle':p.name,'error':str(e)})
 if (i+1)%300==0:print(i+1,'bundles;',len(records),'textures;',len(errors),'errors',flush=True)
(ROOT/'device-textures.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'device-errors.json').write_text(json.dumps(errors,indent=2),encoding='utf-8')
print('DONE',len(records),'textures',len(errors),'errors',flush=True)
