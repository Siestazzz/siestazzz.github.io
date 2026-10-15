"""Only export non-wordmark ornaments from the actual fifth title prefab."""
from pathlib import Path
import UnityPy,json
base=Path(__file__).parent
source='188c6d7b97278b04d85321e2ae62cb9d'
env=UnityPy.load(str(base/'analysis-6.8.1/unpacked/assets/bin/Data'/source))
out=base.parent/'themes/sekai-next/source/game-assets/entry'
records=[]
for o in list(env.objects):
 if o.type.name!='SpriteRenderer':continue
 r=o.read();name=r.m_GameObject.read().m_Name
 if name not in ['o_01_star','o_02_star','o_03_star','o_04_star','o_05_star','o_06_star','white_obi_gosenfu','colorobi','logo_back']:continue
 sprite=r.m_Sprite.read();dest='logo-'+name+'.png';sprite.image.save(out/dest)
 records.append({'prefab':source,'renderer':o.path_id,'node':name,'source':sprite.object_reader.assets_file.name,'path_id':sprite.object_reader.path_id,'file':dest})
for o in list(env.objects):
 if o.type.name!='MeshRenderer':continue
 r=o.read();name=r.m_GameObject.read().m_Name
 for p in r.m_Materials:
  material=p.read()
  for prop,texenv in material.m_SavedProperties.m_TexEnvs:
   if prop!='_MainTex':continue
   tex=texenv.m_Texture.read();dest='logo-'+name+'-texture.png';tex.image.save(out/dest)
   records.append({'prefab':source,'renderer':o.path_id,'node':name,'material':material.m_Name,'source':tex.object_reader.assets_file.name,'path_id':tex.object_reader.path_id,'file':dest})
parts=UnityPy.load(str(base/'analysis-6.8.1/unpacked/assets/bin/Data/2db94450cae9c364498878acb6b5244d'))
for o in list(parts.objects):
 if o.type.name not in ['Texture2D','Sprite']:continue
 obj=o.read();dest='logo-subtitle-'+str(o.path_id)+'.png';obj.image.save(out/dest)
 records.append({'source':o.assets_file.name,'path_id':o.path_id,'node':obj.m_Name,'file':dest})
(out/'logo-provenance.json').write_text(json.dumps(records,indent=2),encoding='utf8')
print(records)
