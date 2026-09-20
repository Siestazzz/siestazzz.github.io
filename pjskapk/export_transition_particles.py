"""Export original AreaTransitioner/sekai particle data, never guessed screen particles."""
from pathlib import Path
import json,hashlib,math
import UnityPy
ROOT=Path(__file__).parent
DATA=ROOT/'analysis-6.8.1/unpacked/assets/bin/Data'
OUT=ROOT.parent/'themes/sekai-next/source/game-assets/map/transition'
source='c790a5c99b4fd4f80a2e34152b8f6fe7'
env=UnityPy.load(str(DATA/source));groups=[]
for ob in list(env.objects):
    if ob.type.name!='ParticleSystem':continue
    d=ob.read_typetree();go=ob.read().m_GameObject.read()
    tr=next(c.component.read() for c in go.m_Component if c.component.type.name in ['Transform','RectTransform'])
    path=go.m_Name;parent=tr.m_Father
    while parent.m_PathID:
        t=parent.read();path=t.m_GameObject.read().m_Name+'/'+path;parent=t.m_Father
    renderer=next(c.component.read() for c in go.m_Component if c.component.type.name=='ParticleSystemRenderer')
    record={'id':ob.path_id,'path':path,'transform':tr.object_reader.read_typetree(),'renderer':renderer.object_reader.read_typetree(),'data':d,'textures':[]}
    for ptr in renderer.m_Materials:
        mat=ptr.read();record['material']=mat.object_reader.read_typetree()
        for slot,tex in mat.m_SavedProperties.m_TexEnvs:
            if tex.m_Texture.m_PathID:
                image=tex.m_Texture.read();filename=image.m_Name+'.png';image.image.save(OUT/filename)
                record['textures'].append({'slot':slot,'file':filename,'source':image.object_reader.assets_file.name,'id':tex.m_Texture.m_PathID})
    if renderer.m_Mesh.m_PathID:
        lines=renderer.m_Mesh.read().export().splitlines()
        record['mesh']={name:[[float(v) for v in line.split()[1:]] for line in lines if line.startswith(prefix)] for name,prefix in [('vertices','v '),('uvs','vt '),('normals','vn ')]}
        record['mesh']['faces']=[[int(v.split('/')[0])-1 for v in line.split()[1:]] for line in lines if line.startswith('f ')]
    groups.append(record)
    ini=d['InitialModule'];shape=d['ShapeModule'];emit=d['EmissionModule']
    print(ob.path_id,path,'life',ini['startLifetime']['scalar'],'speed',ini['startSpeed']['scalar'],'size',ini['startSize']['scalar'],'shape',shape['type'],'angle',shape['angle'],'radius',shape['radius']['value'],'rate',emit['rateOverTime']['scalar'],'burst',emit['m_Bursts'],'transform',tr.m_LocalScale)
def finite(value):
    if isinstance(value,float) and not math.isfinite(value):return str(value)
    if isinstance(value,dict):return {k:finite(v) for k,v in value.items()}
    if isinstance(value,(list,tuple)):return [finite(v) for v in value]
    return value
(OUT/'particles-raw.json').write_text(json.dumps(finite({'source':source,'sha256':hashlib.sha256((DATA/source).read_bytes()).hexdigest(),'groups':groups}),ensure_ascii=False,indent=2,allow_nan=False),encoding='utf8')
