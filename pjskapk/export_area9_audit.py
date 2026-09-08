"""Post-export provenance, original TweenPosition and declared web projection."""
from extract_map_assets import *
from PIL import Image
p=fetch('area/area9');e=UnityPy.load(decode(p.read_bytes()));objs=list(e.objects)
dest=ROOT/'analysis-6.8.1/area9-audit';out=OUT/'area9'
gos={o.path_id:o.read_typetree()['m_Name'] for o in objs if o.type.name=='GameObject'}
trans={};trids={}
for o in objs:
 if o.type.name in ['Transform','RectTransform']:
  d=o.read_typetree();trans[d['m_GameObject']['m_PathID']]=d;trids[o.path_id]=d
def path(go):
 t=trans.get(go);parent=trids.get(t['m_Father']['m_PathID']) if t else None
 return (path(parent['m_GameObject']['m_PathID'])+'/' if parent else '')+gos.get(go,'')
motion=[];scripts=[]
for o in objs:
 if o.type.name in ['MonoScript','Material','ParticleSystemRenderer']:
  scripts.append({'id':str(o.path_id),'type':o.type.name,'data':o.read_typetree()})
 if o.type.name=='MonoBehaviour':
  d=o.read_typetree()
  if 'duration' in d:
   motion.append({'id':str(o.path_id),'path':path(d['m_GameObject']['m_PathID']),'type':o.read().m_Script.read().m_ClassName,'duration':d['duration'],'loopType':d['loopType'],'from':d['from'],'to':d['to'],'curve':d['curve']['m_Curve']})
(dest/'renderer-material-scripts.json').write_text(json.dumps(scripts,indent=2),encoding='utf8')
shader_path=ROOT/'analysis-6.8.1/map-bundles/9d4b915e1050eebe5e8a63cb2a819ad7'
shader_env=UnityPy.load(decode(shader_path.read_bytes()))
shader_records=[]
for o in shader_env.objects:
 if o.type.name=='Shader' and str(o.path_id) in ['6228555572980372533','-7086751676374408482']:
  shader_records.append({'id':str(o.path_id),'data':o.read_typetree()})
(dest/'particle-shaders.json').write_text(json.dumps({'source':'shader/particles','sha256':hashlib.sha256(shader_path.read_bytes()).hexdigest(),'shaders':shader_records},indent=2),encoding='utf8')
scene=json.loads((out/'scene.json').read_text(encoding='utf8'))
(dest/'source-scene.json').write_text(json.dumps(scene,indent=2),encoding='utf8')
sky=next(s for s in scene['sprites'] if s['file']=='sky.png')
# Rasterize the original sky at authored scale. Hidden last-row extension gives
# the cover image a complete footprint; the original ground overlays this part.
original=Image.open(out/'sky.png').convert('RGBA')
base=Image.new('RGBA',(3378,1600));base.alpha_composite(original.resize((3474,1388)),(0,0))
base.alpha_composite(original.crop((0,original.height-1,original.width,original.height)).resize((3378,212)),(0,1388))
base.save(out/'sky-base.png')
sky.update({'file':'sky-base.png','size':[3378,1600],'scale':[1,1],'position':[0,0],'pivot':[0,1],'webAdaptation':'Original sky rasterized at authored scale; hidden last-row extension below y1388; source geometry in source-scene.json.'})
for s in scene['sprites']:
 s['webLayer']='front' if s['order']>=1000 else 'back'
 raw=next(o for o in objs if str(o.path_id)==s['renderer']).read_typetree()
 s['opacity']=raw['m_Color']['a']
scene.update({'groundFile':'sky-base.png','coordinateSize':[3378,1600],'motion':motion,'motionScript':'area9-motion.js'})
(out/'scene.json').write_text(json.dumps(scene,indent=2),encoding='utf8')
fx=json.loads((out/'effects.json').read_text(encoding='utf8'))
for g in fx['groups']:
 g['webUnitScale']=1 if '/fx_tri_L' in g['path'] or '/fx_tri_R' in g['path'] else 600
 g['webUnitScaleReason']='Area-unit shape and particle size' if g['webUnitScale']==1 else 'Local-unit projection calibration shared with classroom/stage, not a recovered Unity constant'
 if 'ParticleCloud' in g['path']:g['kind']='cloud'
(out/'effects.json').write_text(json.dumps(fx,separators=(',',':')),encoding='utf8')
print('area9 finalized:',len(scene['sprites']),'sprites;',len(motion),'original tweens;',len(fx['groups']),'particles')
