"""Original title textures and their APK object identities; no screenshot editing."""
import json,hashlib
from pathlib import Path
import UnityPy
root=Path(__file__).parent/'analysis-6.8.1'
out=Path(__file__).parent.parent/'themes/sekai-next/source/game-assets/entry'
out.mkdir(exist_ok=True)
names=['tex_anniversary_5th_bg_bg_01','tex_anniversary_5th_bg_bg_02','tex_anniversary_5th_bg_bg_03','tex_anniversary_5th_bg_circle_eff','tex_title_btn_01']
records=[]
for item in json.loads((root/'objects.json').read_text(encoding='utf8')):
 if item.get('type')!='Texture2D' or item.get('name') not in names:continue
 source=root/'unpacked/assets/bin/Data'/item['file']
 env=UnityPy.load(str(source))
 ob=next(o for o in env.objects if o.path_id==item['path_id']);tex=ob.read()
 dest=tex.m_Name+'.png';tex.image.save(out/dest)
 records.append({**item,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'output':dest})
(out/'provenance.json').write_text(json.dumps(records,indent=2),encoding='utf8')
print(records)
for file in ['79d6e129c2f0fe24e9b3af3b6ba39cd9','7560a2da64ae7764ebc7aff8487a7787','1c96b36db137e4d1ba80ab8bcf1f4cfb','cfe864a549e85814fba9d168b785fec6']:
 env=UnityPy.load(str(root/'unpacked/assets/bin/Data'/file));nodes=[]
 for ob in env.objects:
  if ob.type.name=='Sprite':
   sprite=ob.read();sprite.image.save(out/(sprite.m_Name+'.png'))
  if ob.type.name not in ['RectTransform','MonoBehaviour','AnimationClip','GameObject']:continue
  try:d=ob.read_typetree()
  except Exception:d={'raw':ob.get_raw_data().hex()}
  nodes.append({'id':ob.path_id,'type':ob.type.name,'data':d})
 (out/(file+'.json')).write_text(json.dumps({'source':file,'nodes':nodes},indent=2),encoding='utf8')
