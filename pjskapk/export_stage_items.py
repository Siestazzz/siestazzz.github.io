"""Export original Stage area items, positioned by area7 spawn-point transforms.

Public master data locates bundle keys only. Sprite/placement evidence is from device bundles.
"""
from extract_map_assets import *
from urllib.request import urlopen
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--area',type=int,choices=[5,7],default=7);AREA=parser.parse_args().area
DEST=OUT/('area'+str(AREA));AUDIT=ROOT/('analysis-6.8.1/'+('classroom' if AREA==5 else 'stage')+'-audit')
url='https://raw.githubusercontent.com/Sekai-World/sekai-master-db-diff/main/areaItems.json'
items=[x for x in json.loads(urlopen(url).read()) if x['areaId']==AREA]
(AUDIT/'master-area-items.json').write_text(json.dumps({'url':url,'items':items},ensure_ascii=False,indent=2),encoding='utf8')
area=UnityPy.load(decode(fetch('area/area'+str(AREA)).read_bytes()))
gos={};transforms={};trids={}
for o in area.objects:
 if o.type.name=='GameObject':gos[o.path_id]=o.read().m_Name
 if o.type.name in ['Transform','RectTransform']:
  d=o.read_typetree();transforms[d['m_GameObject']['m_PathID']]=(o.path_id,d);trids[o.path_id]=d
def position(t):
 p=t.get('m_AnchoredPosition',t['m_LocalPosition']);v=[p['x'],p['y']]
 parent=trids.get(t['m_Father']['m_PathID'])
 if parent:
  pp=position(parent);v=[v[i]*parent['m_LocalScale'][k]+pp[i] for i,k in enumerate(['x','y'])]
 return v
records=[];sources=[]
for item in items:
 key='areaitem/'+item['assetbundleName'];p=fetch(key)
 if not p:raise FileNotFoundError(key)
 sha=hashlib.sha256(p.read_bytes()).hexdigest();sources.append({'key':key,'sha256':sha})
 e=UnityPy.load(decode(p.read_bytes()));objs=list(e.objects)
 audit=[{'id':str(o.path_id),'type':o.type.name,'data':o.read_typetree()} for o in objs if o.type.name in ['Transform','GameObject','SpriteRenderer','MonoBehaviour']]
 (AUDIT/(item['assetbundleName']+'.json')).write_text(json.dumps(audit,indent=2),encoding='utf8')
 go=next(g for g,name in gos.items() if name==item['spawnPoint']);tid,tr=transforms[go];pos=position(tr)
 for o in objs:
  if o.type.name!='SpriteRenderer':continue
  d=o.read();s=d.m_Sprite.read();file=item['assetbundleName']+'-'+s.m_Name+'.png';s.image.save(DEST/file)
  records.append({'path':key+'/'+d.m_GameObject.read().m_Name,'renderer':str(o.path_id),'sprite':str(d.m_Sprite.m_PathID),'source':key,'sha256':sha,'file':file,'position':pos,'scale':[1,1],'size':[s.m_Rect.width/s.m_PixelsToUnits,s.m_Rect.height/s.m_PixelsToUnits],'pivot':[s.m_Pivot.x,s.m_Pivot.y],'order':d.m_SortingOrder,'spawnPoint':item['spawnPoint'],'spawnTransform':str(tid),'webLayer':'back' if item['id']==33 else 'front'})
(DEST/'items.json').write_text(json.dumps({'sources':sources,'sprites':records},ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(records,ensure_ascii=False,indent=2))
