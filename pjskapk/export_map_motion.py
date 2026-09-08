from extract_map_assets import *
import struct
DATA=ROOT/'analysis-6.8.1/unpacked/assets/bin/Data'
env=UnityPy.load(str(DATA/'6b1761911113a413584e12b882e29c34'))
records=[]
for o in list(env.objects):
 if o.type.name!='ParticleSystem':continue
 d=o.read_typetree();go=o.read().m_GameObject.read()
 renderer=next(c.component.read() for c in go.m_Component if c.component.type.name=='ParticleSystemRenderer')
 mats=[]
 for ptr in renderer.m_Materials:
  mat=ptr.read();mats.append(mat.object_reader.read_typetree())
  for key,tex in mat.m_SavedProperties.m_TexEnvs:
   if not tex.m_Texture.m_PathID:continue
   t=tex.m_Texture.read();t.image.save(OUT/(t.m_Name+'.png'));print('TEXTURE',key,t.m_Name)
 mesh=None
 if renderer.m_Mesh.m_PathID:
  m=renderer.m_Mesh.read();mesh=m.export();print('MESH',m.m_Name)
 tr=next(c.component.read() for c in go.m_Component if c.component.type.name in ['Transform','RectTransform'])
 records.append(dict(name=go.m_Name,id=o.path_id,particle=d,renderer=renderer.object_reader.read_typetree(),materials=mats,mesh=mesh,transform=tr.object_reader.read_typetree()))
 print(go.m_Name,'lifetime',d['InitialModule']['startLifetime']['scalar'],'keys',list(d['InitialModule'].keys()),'rotation',str(d['RotationModule'])[:150])
(OUT/'motion-particles.json').write_text(json.dumps(records,indent=2),encoding='utf-8')
compact=[]
for record in records:
 p=record['particle'];initial=p['InitialModule'];grad=p['ColorModule']['gradient']['maxGradient']
 lines=record['mesh'].splitlines()
 mesh={key:[[float(v) for v in line.split()[1:]] for line in lines if line.startswith(prefix)] for key,prefix in [('vertices','v '),('uvs','vt '),('normals','vn ')]}
 mesh['faces']=[[int(v.split('/')[0])-1 for v in line.split()[1:]] for line in lines if line.startswith('f ')]
 compact.append(dict(name=record['name'],mesh=mesh,life=[initial['startLifetime']['minScalar'],initial['startLifetime']['scalar']],size=[initial['startSize']['minScalar'],initial['startSize']['scalar']],rate=p['EmissionModule']['rateOverTime']['scalar'],spin=p['RotationModule']['curve']['scalar'],orbit=p['VelocityModule']['orbitalZ']['scalar'],alpha=[[grad['atime'+str(i)]/65535,grad['key'+str(i)]['a']] for i in range(grad['m_NumAlphaKeys'])],textures=['tex_sekai_03.png','tex_sekai_aura_01.png'] if record['name']=='particle3' else ['tex_sekai_common_v2_01.png','tex_sekai_common_aura_v2_01.png']))
(OUT/'motion-runtime.json').write_text(json.dumps(compact),encoding='utf-8')
e=UnityPy.load(str(DATA/'1a97dd8c82a0a42729f6cf3ba44aeb0b'))
for o in list(e.objects):
 if o.path_id not in [1062,1327]:continue
 raw=o.get_raw_data()
 for offset in range(32,len(raw)-11,4):
  fid,pid=struct.unpack_from('<iq',raw,offset)
  if not 0<fid<=len(o.assets_file.externals):continue
  try:
   other=UnityPy.load(str(DATA/o.assets_file.externals[fid-1].path.split('/')[-1]))
   sprite=next((x for x in other.objects if x.path_id==pid and x.type.name=='Sprite'),None)
   if sprite:
    s=sprite.read();s.image.save(OUT/(s.m_Name+'.png'));print('ARROW',o.path_id,s.m_Name)
  except:pass
