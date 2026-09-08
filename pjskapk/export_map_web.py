"""Export original SEKAI map sprites, area27 scenery and Spine tree data."""
from extract_map_assets import *
records=[]
def export(key,p,types,names=None):
 env=UnityPy.load(decode(p.read_bytes()))
 for o in env.objects:
  if o.type.name not in types:continue
  d=o.read();n=d.m_Name
  if names and not names(n):continue
  if o.type.name in ['Sprite','Texture2D']:
   dest=OUT/(n+'.png');d.image.save(dest)
  elif o.type.name=='TextAsset':
   dest=OUT/n;dest.write_bytes(d.m_Script.encode('utf-8','surrogateescape'))
  else:continue
  records.append(dict(source=key,bundle_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),path_id=o.path_id,name=n,file=dest.name))
 return env
export('worldmap/contents/normal',CACHE/'contents/639e12c9470982e4dbc2bae9c77452c8',{'Texture2D'},lambda n:n.startswith('img_worldMap_areaS'))
export('area/area27',fetch('area/area27'),{'Texture2D'})
export('area_sd/wish_tree_ppr',fetch('area_sd/wish_tree_ppr'),{'Texture2D','TextAsset'})
data=ROOT/'analysis-6.8.1/unpacked/assets/bin/Data'
export('APK/bg_sekai',data/'f60908b480d42445783a2adde564915c',{'Texture2D'})
export('APK/icon_worldMap_wh',data/'08497d3c64d68b44c97d88db5e85dfad',{'Sprite'})
(OUT/'provenance.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print('Exported',len(records),'assets')
