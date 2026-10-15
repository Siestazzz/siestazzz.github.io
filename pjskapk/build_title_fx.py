"""Keep runtime parameters compact; full evidence stays in title-*-particles.json."""
import json
import UnityPy
from pathlib import Path
base=Path(__file__).parent.parent/'themes/sekai-next/source/game-assets/entry'
def curve(c):return {'mode':c['minMaxState'],'min':c['minScalar'],'max':c['scalar'],'keys':c['maxCurve']['m_Curve']}
def group(g):
 d=g['data'];i=d['InitialModule'];uv=d['UVModule'];m=g['materials'][0]
 grad=d['ColorModule']['gradient']['maxGradient']
 return {'id':g['id'],'path':g['path'],'texture':m['textures'][0]['file'],'shader':m['shader']['data']['m_ParsedForm']['m_Name'],
 'life':curve(i['startLifetime']),'size':curve(i['startSize']),'speed':curve(i['startSpeed']),'rotation':curve(i['startRotation']),
 'spin':curve(d['RotationModule']['curve']) if d['RotationModule']['enabled'] else None,
 'sizeLife':curve(d['SizeModule']['curve']) if d['SizeModule']['enabled'] else None,
 'alpha':[[grad['atime'+str(k)]/65535,grad['key'+str(k)]['a']] for k in range(grad['m_NumAlphaKeys'])],
 'startAlpha':[i['startColor']['minColor']['a'],i['startColor']['maxColor']['a']],
 'delay':d['startDelay']['scalar'],'rate':d['EmissionModule']['rateOverTime']['scalar'],
 'bursts':[{'time':b['time'],'count':b['countCurve']['scalar'],'cycles':b['cycleCount'],'interval':b['repeatInterval']} for b in d['EmissionModule']['m_Bursts']],
 'uv':{'x':uv['tilesX'] if uv['enabled'] else 1,'y':uv['tilesY'] if uv['enabled'] else 1,'start':curve(uv['startFrame']),'frame':curve(uv['frameOverTime'])},
 'mesh':g.get('shapeMesh'),'shape':d['ShapeModule'],'order':g['renderer']['m_SortingOrder']}
intro=json.loads((base/'title-particles.json').read_text())
exit=json.loads((base/'title-start-particles.json').read_text())
r={'introSource':intro['source'],'exitSource':exit['source'],'intro':[group(g) for g in intro['groups'] if g['id'] in [16,18,20,21]],'exit':[group(g) for g in exit['groups'] if g['id'] in [24,27,28,31,32,33]]}
clipSource='e1e202e24129e8846ac2a18ad3185935'
clip=UnityPy.load(str(Path(__file__).parent/'analysis-6.8.1/unpacked/assets/bin/Data'/clipSource))
clipData=next(o.read_typetree() for o in clip.objects if o.type.name=='AnimationClip')
(base/'title-start-activation.json').write_text(json.dumps({'source':clipSource,'path_id':1,'data':clipData},indent=2),encoding='utf8')
(base/'title-fx.json').write_text(json.dumps(r,separators=(',',':')),encoding='utf8')
print('Saved compact title-fx.json')
