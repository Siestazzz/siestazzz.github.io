import json,struct
from extract_map_assets import *
DATA=ROOT/'analysis-6.8.1/unpacked/assets/bin/Data'
out=ROOT/'analysis-6.8.1/map-motion';out.mkdir(exist_ok=True)
records=[]
for file in ['1a97dd8c82a0a42729f6cf3ba44aeb0b','d46e1bf56cfe0430590bfbd229332bb7','6b1761911113a413584e12b882e29c34']:
 env=UnityPy.load(str(DATA/file))
 for o in list(env.objects):
  if o.type.name not in ['MonoBehaviour','Animator','ParticleSystem','ParticleSystemRenderer']:continue
  d=o.read(check_read=False);go=d.m_GameObject.read();path=go.m_Name
  tr=next((c.component.read() for c in go.m_Component if c.component.type.name in ['Transform','RectTransform']),None)
  if tr:
   p=tr.m_Father
   while p.m_PathID:
    t=p.read();path=t.m_GameObject.read().m_Name+'/'+path;p=t.m_Father
  if o.type.name=='MonoBehaviour':
   script=d.m_Script.read().m_ClassName
   if any(s in script.lower() for s in ['tween','anim','particle']) or any(s in path.lower() for s in ['next','prev','arrow']):
    records.append(dict(file=file,id=o.path_id,path=path,script=script,raw=o.get_raw_data().hex()));print(path,script,o.path_id)
  else:
   info=o.read_typetree();(out/(file+'-'+str(o.path_id)+'.json')).write_text(json.dumps(info,indent=2),encoding='utf-8')
   records.append(dict(file=file,id=o.path_id,path=path,type=o.type.name));print(path,o.type.name,o.path_id)
   if o.type.name=='Animator':
    if not d.m_Controller.m_PathID:continue
    ac=d.m_Controller.read();print('CONTROLLER',ac.m_Name,ac.object_reader.assets_file.name)
    for ptr in ac.m_AnimationClips:
     clip=ptr.read();print('CLIP',clip.m_Name)
     (out/(clip.m_Name+'.json')).write_text(json.dumps(clip.object_reader.read_typetree(),indent=2),encoding='utf-8')
(out/'index.json').write_text(json.dumps(records,indent=2),encoding='utf-8')
