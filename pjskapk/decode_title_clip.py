"""Decode original Unity streamed polynomial curves and CRC32 node bindings."""
import json, struct, zlib, sys
from pathlib import Path
import UnityPy
base=Path(__file__).parent.parent/'themes/sekai-next/source/game-assets/entry'
raw=Path(__file__).parent/'analysis-6.8.1/unpacked/assets/bin/Data'
prefab=sys.argv[1] if len(sys.argv)>1 else '7560a2da64ae7764ebc7aff8487a7787'
clip_source=sys.argv[2] if len(sys.argv)>2 else 'cfe864a549e85814fba9d168b785fec6'
output=sys.argv[3] if len(sys.argv)>3 else 'title-timeline.json'
env=UnityPy.load(str(raw/prefab))
nodes={o.path_id:o.read_typetree() for o in env.objects if o.type.name in ['Transform','RectTransform','GameObject']}
def path(i):
 n=nodes[i]; name=nodes[n['m_GameObject']['m_PathID']]['m_Name'];parent=n['m_Father']['m_PathID']
 return (path(parent)+'/' if parent else '')+name
paths={}
for i,n in nodes.items():
 if 'm_Father' not in n:continue
 parts=path(i).split('/')
 for k in range(len(parts)):
  s='/'.join(parts[k:]);paths[zlib.crc32(s.encode())]=s
clip=next(o.read_typetree() for o in UnityPy.load(str(raw/clip_source)).objects if o.type.name=='AnimationClip')
data=clip['m_MuscleClip']['m_Clip']['data'];words=data['m_StreamedClip']['data'];buf=struct.pack('<'+'I'*len(words),*words)
curves={};offset=0
while offset<len(buf):
 t,count=struct.unpack_from('<fI',buf,offset);offset+=8
 for _ in range(count):
  index,*coeff=struct.unpack_from('<I4f',buf,offset);offset+=20
  if 0<=t<=clip['m_MuscleClip']['m_StopTime']:curves.setdefault(index,[]).append({'t':t,'coeff':coeff})
bindings=[];index=0
for b in clip['m_ClipBindingConstant']['genericBindings']:
 width=(4 if b['attribute']==2 else 3) if b['typeID']==4 and b['attribute'] in [1,2,3,4] else 1
 bindings.append({**b,'node':paths.get(b['path'],'UNRESOLVED'),'index':index,'curves':[curves.get(i,[]) for i in range(index,index+width)]});index+=width
result={'source':clip_source,'prefab':prefab,'path_id':1,'duration':clip['m_MuscleClip']['m_StopTime'],'bindings':bindings,'constant':data.get('m_ConstantClip'),'dense':data.get('m_DenseClip')}
(base/output).write_text(json.dumps(result,indent=2),encoding='utf8')
for b in bindings:
 print(b['index'],b['node'],b['attribute'],[(round(k['t'],3),round(k['coeff'][3],4)) for k in b['curves'][0]])
