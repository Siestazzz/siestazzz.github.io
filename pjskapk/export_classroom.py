"""Export area5 sprites and Unity node placement; exclude character placeholders."""
from extract_map_assets import *
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--area',type=int,choices=[5,7],default=5);args=parser.parse_args();AREA=args.area
DEST=OUT/('area'+str(AREA));DEST.mkdir(exist_ok=True)
p=fetch('area/area'+str(AREA));e=UnityPy.load(decode(p.read_bytes()));objects=list(e.objects)
transforms={};gos={};records=[];audit=[]
for o in objects:
 if o.type.name in ['GameObject','RectTransform','Transform','SpriteRenderer','ParticleSystem','MonoBehaviour','AnimationClip','Animator','Animation']:
  audit.append({'id':str(o.path_id),'type':o.type.name,'data':o.read_typetree()})
 if o.type.name=='GameObject':gos[o.path_id]=o.read().m_Name
 if o.type.name in ['Transform','RectTransform']:
  d=o.read_typetree();transforms[d['m_GameObject']['m_PathID']]=(o.path_id,d)
trids={v[0]:v[1] for v in transforms.values()}
def chain(go):
 t=transforms[go][1];par=trids.get(t['m_Father']['m_PathID'])
 return (chain(par['m_GameObject']['m_PathID']) if par else [])+[(gos[go],t)]
for o in objects:
 if o.type.name!='SpriteRenderer':continue
 d=o.read();go=d.m_GameObject.read();nodes=chain(go.object_reader.path_id);name='/'.join(n for n,_ in nodes)
 sprite=d.m_Sprite.read()
 if sprite.m_Name=='miku' or not name.startswith('area'+str(AREA)+'/'):continue
 sprite.image.save(DEST/(sprite.m_Name+'.png'))
 pos=[0,0];scale=[1,1]
 for _,tr in nodes:
  loc=tr.get('m_AnchoredPosition',tr['m_LocalPosition']);pos=[pos[i]+loc[k]*scale[i] for i,k in enumerate(['x','y'])];scale=[scale[i]*tr['m_LocalScale'][k] for i,k in enumerate(['x','y'])]
 records.append({'path':name,'renderer':str(o.path_id),'sprite':str(d.m_Sprite.m_PathID),'file':sprite.m_Name+'.png','position':pos,'scale':scale,'size':[sprite.m_Rect.width/sprite.m_PixelsToUnits,sprite.m_Rect.height/sprite.m_PixelsToUnits],'pivot':[sprite.m_Pivot.x,sprite.m_Pivot.y],'order':d.m_SortingOrder})
 print(records[-1])
result={'source':'area/area'+str(AREA),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'sprites':records}
(DEST/'scene.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
ad=ROOT/('analysis-6.8.1/'+('classroom' if AREA==5 else 'stage')+'-audit');ad.mkdir(exist_ok=True)
(ad/'objects.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
