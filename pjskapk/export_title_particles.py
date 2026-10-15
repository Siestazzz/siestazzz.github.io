"""Extract title renderer/material/particle chains without repainting textures."""
from pathlib import Path
import json, math, hashlib, sys
import UnityPy
base=Path(__file__).parent
data=base/'analysis-6.8.1/unpacked/assets/bin/Data'
out=base.parent/'themes/sekai-next/source/game-assets/entry'
source=sys.argv[1] if len(sys.argv)>1 else '7560a2da64ae7764ebc7aff8487a7787'
env=UnityPy.load(str(data/source))
groups=[]
for ob in list(env.objects):
 if ob.type.name!='ParticleSystem':continue
 p=ob.read();go=p.m_GameObject.read()
 tr=next(c.component.read() for c in go.m_Component if c.component.type.name in ['Transform','RectTransform'])
 chain=[];t=tr
 while True:
  chain.insert(0,{'name':t.m_GameObject.read().m_Name,'id':t.object_reader.path_id,'data':t.object_reader.read_typetree()})
  if not t.m_Father.m_PathID:break
  t=t.m_Father.read()
 renderer=next(c.component.read() for c in go.m_Component if c.component.type.name=='ParticleSystemRenderer')
 r={'id':ob.path_id,'path':'/'.join(t['name'] for t in chain),'chain':chain,'data':ob.read_typetree(),'renderer':renderer.object_reader.read_typetree(),'materials':[]}
 shape=p.ShapeModule if hasattr(p,'ShapeModule') else None
 meshptr=ob.read_typetree()['ShapeModule']['m_Mesh']
 if meshptr['m_PathID']:
  from UnityPy.classes import PPtr
  mesh=PPtr(m_FileID=meshptr['m_FileID'],m_PathID=meshptr['m_PathID'],assetsfile=ob.assets_file).read()
  lines=mesh.export().splitlines()
  r['shapeMesh']={'source':mesh.object_reader.assets_file.name,'id':mesh.object_reader.path_id,'vertices':[[float(v) for v in s.split()[1:]] for s in lines if s.startswith('v ')],'faces':[[int(v.split('/')[0])-1 for v in s.split()[1:]] for s in lines if s.startswith('f ')]}
 for ptr in renderer.m_Materials:
  if not ptr.m_PathID:continue
  mat=ptr.read();m={'source':mat.object_reader.assets_file.name,'id':mat.object_reader.path_id,'data':mat.object_reader.read_typetree(),'textures':[]}
  shader=mat.m_Shader.read();m['shader']={'source':shader.object_reader.assets_file.name,'id':shader.object_reader.path_id,'data':shader.object_reader.read_typetree()}
  for slot,tex in mat.m_SavedProperties.m_TexEnvs:
   if not tex.m_Texture.m_PathID:continue
   image=tex.m_Texture.read();name=image.m_Name+'.png';image.image.save(out/name)
   m['textures'].append({'slot':slot,'file':name,'source':image.object_reader.assets_file.name,'id':image.object_reader.path_id})
  r['materials'].append(m)
 groups.append(r)
def finite(x):
 if isinstance(x,float) and not math.isfinite(x):return str(x)
 if isinstance(x,dict):return {k:finite(v) for k,v in x.items()}
 if isinstance(x,(list,tuple)):return [finite(v) for v in x]
 if isinstance(x,bytes):return {'byteCount':len(x)}
 return x
(out/('title-particles.json' if len(sys.argv)==1 else 'title-start-particles.json')).write_text(json.dumps(finite({'source':source,'sha256':hashlib.sha256((data/source).read_bytes()).hexdigest(),'groups':groups}),indent=2),encoding='utf8')
for r in groups:
 d=r['data'];ini=d['InitialModule']
 print(r['id'],r['path'],'life',ini['startLifetime']['scalar'],'size',ini['startSize']['scalar'],'rate',d['EmissionModule']['rateOverTime']['scalar'],'bursts',d['EmissionModule']['m_Bursts'],'textures',[m['textures'] for m in r['materials']])
