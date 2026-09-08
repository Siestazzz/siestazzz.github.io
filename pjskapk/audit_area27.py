"""Read cached area27/tree Unity objects; retain hierarchy and effect evidence."""
from extract_map_assets import *
DEST=ROOT/'analysis-6.8.1/area27-audit'
DEST.mkdir(exist_ok=True)
for key in ['area/area27','area_sd/wish_tree_ppr','area_sd/world_link_effect/wish_tree']:
 p=fetch(key)
 if not p: raise RuntimeError('Missing cached bundle: '+key)
 env=UnityPy.load(decode(p.read_bytes()))
 records=[]
 for o in list(env.objects):
  if o.type.name not in ['GameObject','Transform','RectTransform','SpriteRenderer','MeshRenderer','MeshFilter','ParticleSystem','ParticleSystemRenderer','Material','MonoBehaviour','Animator','AnimationClip']:continue
  try: data=o.read_typetree()
  except Exception: data={'raw':o.get_raw_data().hex()}
  records.append(dict(id=o.path_id,type=o.type.name,data=data))
 (DEST/(key.replace('/','-')+'.json')).write_text(json.dumps(dict(source=key,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),objects=records),ensure_ascii=False,indent=2),encoding='utf-8')
 objects={r['id']:r for r in records}
 go_names={r['id']:r['data'].get('m_Name','') for r in records if r['type']=='GameObject'}
 transforms={r['data']['m_GameObject']['m_PathID']:r for r in records if r['type'] in ['Transform','RectTransform']}
 def trail(go):
  tr=transforms.get(go)
  if not tr:return go_names.get(go,'?')
  par=objects.get(tr['data']['m_Father']['m_PathID'])
  return (trail(par['data']['m_GameObject']['m_PathID'])+'/' if par else '')+go_names.get(go,'?')
 for r in records:
  d=r['data'];go=d.get('m_GameObject',{}).get('m_PathID');name=go_names.get(go,d.get('m_Name',''))
  if r['type']=='ParticleSystem':
   path=trail(go);tr=transforms.get(go,{}).get('data',{})
   if not (path.startswith('area27/') or path.startswith('wish_tree_ppr_idle/')):continue
   ini=d['InitialModule'];v=d['VelocityModule']
   print('PARTICLE',r['id'],path,'pos',tr.get('m_LocalPosition'),'scale',tr.get('m_LocalScale'),'size',ini['startSize']['minScalar'],ini['startSize']['scalar'],'life',ini['startLifetime']['minScalar'],ini['startLifetime']['scalar'],'speed',ini['startSpeed']['scalar'],'rate',d['EmissionModule']['rateOverTime']['scalar'],'velocity',v['x']['scalar'],v['y']['scalar'])
