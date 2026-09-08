"""Export only instantiated area27 hierarchy and wish_tree_ppr idle particles.

No image redrawing: save original Texture2D and mesh/particle data with provenance.
"""
from extract_map_assets import *
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--area',type=int,choices=[5,7,27],default=27);args=parser.parse_args()
AREA=args.area
DEST=OUT/('area'+str(AREA));DEST.mkdir(exist_ok=True)
result={'sources':[],'groups':[],'textures':[]}
def curve(c):
 return {'mode':c['minMaxState'],'min':c['minScalar'],'max':c['scalar'],'keys':c['maxCurve']['m_Curve'],'minKeys':c['minCurve']['m_Curve']}
def gradient(g):
 return {'mode':g.get('m_Mode',0),'color':[[g['ctime'+str(i)]/65535,*[g['key'+str(i)][k] for k in ['r','g','b']]] for i in range(g['m_NumColorKeys'])], 'alpha':[[g['atime'+str(i)]/65535,g['key'+str(i)]['a']] for i in range(g['m_NumAlphaKeys'])]}
for key in (['area/area27','area_sd/world_link_effect/wish_tree'] if AREA==27 else ['area/area'+str(AREA)]):
 p=fetch(key);sha=hashlib.sha256(p.read_bytes()).hexdigest();env=UnityPy.load(decode(p.read_bytes()));objs=list(env.objects)
 result['sources'].append({'key':key,'sha256':sha})
 transforms={};gos={}
 for o in objs:
  if o.type.name=='GameObject':gos[o.path_id]=o.read_typetree()
  if o.type.name in ['Transform','RectTransform']:
   t=o.read_typetree();transforms[t['m_GameObject']['m_PathID']]=(o.path_id,t)
 trids={v[0]:v[1] for v in transforms.values()}
 def ancestry(go):
  tr=transforms[go][1];par=trids.get(tr['m_Father']['m_PathID'])
  return (ancestry(par['m_GameObject']['m_PathID']) if par else [])+[(gos[go]['m_Name'],tr)]
 for o in objs:
  if o.type.name!='ParticleSystem':continue
  d=o.read_typetree();go=o.read().m_GameObject.read();chain=ancestry(go.object_reader.path_id);path='/'.join(x[0] for x in chain)
  if not(path.startswith('area'+str(AREA)+'/Background/') or (AREA==27 and path.startswith('wish_tree_ppr_idle/'))):continue
  renderer=next((c.component.read() for c in go.m_Component if c.component.type.name=='ParticleSystemRenderer'),None)
  if not renderer or not renderer.m_Enabled or not any(m.m_PathID for m in renderer.m_Materials):continue
  mats=[];textures={};light=None;material_name='';shader_id=''
  for ptr in renderer.m_Materials:
   if not ptr.m_PathID:continue
   m=ptr.read();material_name=m.m_Name;shader_id=str(m.m_Shader.m_PathID);mats.append(m.object_reader.read_typetree())
   for slot,t in m.m_SavedProperties.m_TexEnvs:
    if not t.m_Texture.m_PathID:continue
    tex=t.m_Texture.read();filename=('tree-' if key.startswith('area_sd/') else '')+tex.m_Name+'.png'
    tex.image.save(DEST/filename);textures[slot]=filename
    result['textures'].append({'source':key,'bundle_sha256':sha,'path_id':str(t.m_Texture.m_PathID),'name':tex.m_Name,'file':filename})
   for name,color in m.m_SavedProperties.m_Colors:
    if name=='_LightVector':light=[color.r,color.g,color.b]
  mesh=None
  if renderer.m_RenderMode==4 and renderer.m_Mesh.m_PathID:
   lines=renderer.m_Mesh.read().export().splitlines()
   mesh={name:[[float(v) for v in line.split()[1:]] for line in lines if line.startswith(prefix)] for name,prefix in [('vertices','v '),('uvs','vt '),('normals','vn ')]}
   mesh['faces']=[[int(v.split('/')[0])-1 for v in line.split()[1:]] for line in lines if line.startswith('f ')]
  ini=d['InitialModule'];uv=d['UVModule'];rot=d['RotationModule'];vel=d['VelocityModule']
  pos=[0,0];scale=[1,1,1]
  for _,tr in chain:
   loc=tr.get('m_AnchoredPosition',tr['m_LocalPosition']);pos=[pos[i]+loc[k]*scale[i] for i,k in enumerate(['x','y'])];scale=[scale[i]*tr['m_LocalScale'][k] for i,k in enumerate(['x','y','z'])]
  color=ini['startColor'];sz=d['SizeModule'];trail=d['TrailModule'];custom=d['CustomDataModule']
  blend=curve(custom['vector0_0']) if custom['enabled'] and custom['mode0']==1 else None
  result['groups'].append({'id':str(o.path_id),'path':path,'name':go.m_Name,'kind':'tree' if key.startswith('area_sd/') else ('cloud' if '/fx_cloud/' in path else 'field'),'position':pos,'scale':scale,
   'sizeLife':curve(sz['curve']) if sz['enabled'] else None,'scalingMode':d['scalingMode'],'size3D':ini['size3D'],'sizeY':curve(ini['startSizeY']),'sizeZ':curve(ini['startSizeZ']),'customBlend':blend,'order':renderer.m_SortingOrder,
   'trail':{'enabled':trail['enabled'],'life':curve(trail['lifetime']),'width':curve(trail['widthOverTrail'])},
   'life':curve(ini['startLifetime']),'size':curve(ini['startSize']),'speed':curve(ini['startSpeed']),'rotation3D':ini['rotation3D'], 'rotation':[curve(ini[k]) for k in ['startRotationX','startRotationY','startRotation']],
   'spin':[curve(rot[k]) for k in (['x','y','curve'] if rot['separateAxes'] else ['curve'])] if rot['enabled'] else [],
   'velocity':[curve(vel[k]) for k in ['x','y','z']] if vel['enabled'] else [],'shape':d['ShapeModule'],
   'rate':d['EmissionModule']['rateOverTime']['scalar'] if d['EmissionModule']['enabled'] else 0,'rateCurve':curve(d['EmissionModule']['rateOverTime']) if d['EmissionModule']['enabled'] else None,'bursts':d['EmissionModule']['m_Bursts'],'maxParticles':ini['maxNumParticles'],
   'startColor':{'mode':color['minMaxState'],'color':color['maxColor'],'gradient':gradient(color['maxGradient'])},
   'color':gradient(d['ColorModule']['gradient']['maxGradient']) if d['ColorModule']['enabled'] else None,
   'uv':{'enabled':uv['enabled'],'x':uv['tilesX'],'y':uv['tilesY'],'start':curve(uv['startFrame']),'frame':curve(uv['frameOverTime']),'cycles':uv['cycles']},
   'mesh':mesh,'textures':textures,'material':material_name,'shaderId':shader_id,'cullBack':shader_id=='-1595268760865149387','light':light,'additive':shader_id=='6228555572980372533' or (shader_id=='6140383380374060507' and blend and blend['mode']==0 and blend['max']>.5) or 'ADD' in material_name,'loop':d['looping'],'duration':d['lengthInSec']})
 result['textures']=list({x['file']:x for x in result['textures']}.values())
(DEST/'effects.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('Exported',len(result['groups']),'groups;',len(result['textures']),'textures')
for g in result['groups']:print(g['kind'],g['name'],g['position'],g['textures'],len(g['mesh']['vertices']) if g['mesh'] else 'billboard')
