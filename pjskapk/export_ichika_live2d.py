"""Export Ichika's device model and selected Unity clips; retain source evidence."""
import json, hashlib, sys, re, zlib, urllib.request
from pathlib import Path
from extract_map_assets import ROOT, fetch, decode, UnityPy
from sssekai.unity.AnimationClip import AnimationHelper
from sssekai.unity.constant.SekaiLive2DPathNames import NAMES_CRC_TBL
from sssekai.fmt.motion3 import to_motion3

character = sys.argv[1] if len(sys.argv)>1 else 'ichika'
code = {'ichika':'01ichika','miku':'21miku','rin':'22rin','len':'23len'}[character]
OUT = ROOT.parent/'themes/sekai-next/source/game-assets/live2d'/character
OUT.mkdir(parents=True, exist_ok=True)
def save(name, obj):
    (OUT/name).write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding='utf8')
records=[]
def bundle(key):
    p=fetch(key)
    if not p: raise FileNotFoundError(key)
    raw=p.read_bytes()
    records.append({'bundle':key,'cache':p.name,'sha256':hashlib.sha256(raw).hexdigest(),'objects':[]})
    return UnityPy.load(decode(raw))
env=bundle('live2d/model/'+code+'_normal')
textures={}
for o in env.objects:
    if o.type.name not in ['TextAsset','Texture2D','MonoBehaviour']: continue
    d=o.read(); records[-1]['objects'].append({'path_id':str(o.path_id),'type':o.type.name,'name':d.m_Name})
    if o.type.name=='TextAsset':
        name=d.m_Name
        if name.endswith(('.model3','.physics3')): name+='.json'
        if '/' in name or '\\' in name: raise ValueError(name)
        (OUT/name).write_bytes(d.m_Script.encode('utf8','surrogateescape'))
        if name.endswith('.model3.json'): model=json.loads((OUT/name).read_text()); model_file=name
    elif o.type.name=='Texture2D': textures[d.m_Name]=d
    elif d.m_Name=='BuildModelData': build=o.read_typetree(); save('build-source.json',build)
for name in build['TextureNames']:
    dest=OUT/name; dest.parent.mkdir(parents=True,exist_ok=True)
    textures[Path(name).stem].image.save(dest)
# Bind additional parameter/part names present in the original MOC, not guessed names.
for p in OUT.glob('*.moc3'):
    for raw in re.findall(rb'[A-Za-z_][A-Za-z_0-9]{2,}',p.read_bytes()):
        for prefix in ['Parameters/','Parts/']:
            path=prefix+raw.decode('ascii'); NAMES_CRC_TBL[zlib.crc32(path.encode())]=path
env=bundle('live2d/motion/'+code+'_motion_base')
clips={}; fades={}; inventory=[]
for o in env.objects:
    if o.type.name not in ['AnimationClip','MonoBehaviour']:continue
    d=o.read(); inventory.append({'path_id':str(o.path_id),'type':o.type.name,'name':d.m_Name})
    if o.type.name=='AnimationClip': clips[d.m_Name]=(o,d)
    else:
        tree=o.read_typetree()
        if 'FadeInTime' in tree: fades[d.m_Name]={'path_id':str(o.path_id),**tree}
save('motion-inventory.json',inventory)
audit=ROOT/'analysis-6.8.1/live2d-audit'; audit.mkdir(exist_ok=True)
master_url='https://raw.githubusercontent.com/Sekai-World/sekai-master-db-diff/main/systemLive2ds.json'
master_file=audit/'systemLive2ds.json'
if not master_file.exists(): master_file.write_bytes(urllib.request.urlopen(master_url).read())
rows=json.loads(master_file.read_text(encoding='utf8'))
talks=[r for r in rows if r['characterId']==int(code[:2]) and (character=='ichika' or r.get('unit')=='piapro') and r.get('motion') in clips and r.get('expression') in clips]
# Use archived complete pairs, not fabricated text/action associations. Dates are retained.
talks=talks[:3]
if len(talks)<2: raise ValueError('Missing paired dialogue '+character)
save('talks.json',{'source':master_url,'provenance':'community master snapshot; not extracted from this device','selection':'first three compatible original pairs; original seasonal availability is not applied in this preview','items':talks})
prefix='n-normal' if character=='len' else 'w-normal'
idle=prefix+'-pose01'
if character=='len': idle='n-normal-nod01'
if idle not in clips: raise ValueError('Find original resting pose: '+character)
groups={'Idle':[idle], 'Motion':[prefix+'-nod01','n-len-glad01' if character=='len' else 'w-normal-glad01'], 'Expression':['face_normal_01','face_smile_01']}
groups['Motion']=list(dict.fromkeys(r['motion'] for r in talks))
groups['Expression']=list(dict.fromkeys(['face_normal_01']+[r['expression'] for r in talks]))
refs={}
(OUT/'motions').mkdir(exist_ok=True)
for group,names in groups.items():
    refs[group]=[]
    for name in names:
        if name not in clips:
            print('Unavailable',name);continue
        obj,clip=clips[name]
        motion=to_motion3(AnimationHelper.from_clip(clip),NAMES_CRC_TBL,clip)
        unknown=[c['Id'] for c in motion['Curves'] if c['Id'].isdigit()]
        if unknown: raise ValueError('Unresolved curves '+name+': '+str(unknown))
        # sssekai defaults Loop=true; retain the actual Unity clip field instead.
        motion['Meta']['Loop']=bool(clip.m_MuscleClip.m_LoopTime)
        fade=fades.get(name,{})
        motion['Meta']['FadeInTime']=fade.get('FadeInTime',.5)
        motion['Meta']['FadeOutTime']=fade.get('FadeOutTime',.5)
        save('motions/'+name+'.motion3.json',motion)
        refs[group].append({'Name':name,'File':'motions/'+name+'.motion3.json','FadeInTime':motion['Meta']['FadeInTime'],'FadeOutTime':motion['Meta']['FadeOutTime']})
        records[-1]['objects'].append({'path_id':str(obj.path_id),'name':name,'fade':fade,'duration':motion['Meta']['Duration'],'loop':motion['Meta']['Loop'],'curves':motion['Meta']['CurveCount']})
model['FileReferences']['Motions']=refs
model['FileReferences']['Moc']=next(p.name for p in OUT.glob('*.moc3'))
save(character+'.model3.json',model)
save('source.json',{'sources':records,'converter':'sssekai 0.8.0 AnimationHelper/to_motion3','adaptation':'Idle group selection and scheduling are web choices, not recovered game state machine.'})
print('Exported',[(k,len(v)) for k,v in refs.items()],flush=True)
