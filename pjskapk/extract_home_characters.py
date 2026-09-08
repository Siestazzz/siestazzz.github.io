"""Export device Spine characters and selected original area action sets (no scenarios)."""
import json, hashlib, urllib.request
from extract_map_assets import ROOT, fetch, decode, UnityPy

OUT = ROOT.parent/'themes/sekai-next/source/game-assets/characters'
AUDIT = ROOT/'analysis-6.8.1/characters-audit'
OUT.mkdir(exist_ok=True); AUDIT.mkdir(exist_ok=True)
def save(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
def master(name):
    p=AUDIT/(name+'.json')
    if not p.exists():
        req=urllib.request.Request('https://raw.githubusercontent.com/Sekai-World/sekai-master-db-diff/main/'+name+'.json',headers={'User-Agent':'Local asset research'})
        p.write_bytes(urllib.request.urlopen(req).read())
    return json.loads(p.read_text(encoding='utf-8'))
def bundle(key):
    p=fetch(key)
    if not p: raise FileNotFoundError(key)
    return UnityPy.load(decode(p.read_bytes())), {'key':key,'cache':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
def export(key, folder):
    env,source=bundle(key); folder.mkdir(exist_ok=True)
    source['objects']=[]
    for o in env.objects:
        if o.type.name not in ['TextAsset','Texture2D','MonoBehaviour']:continue
        d=o.read(); name=d.m_Name
        source['objects'].append({'id':str(o.path_id),'type':o.type.name,'name':name})
        if o.type.name=='TextAsset': (folder/name).write_bytes(d.m_Script.encode('utf-8','surrogateescape'))
        if o.type.name=='Texture2D':d.image.save(folder/(name+'.png'))
        if o.type.name=='MonoBehaviour':source['objects'][-1]['data']=o.read_typetree()
    save(folder/'source.json',source)
    return source

if __name__=='__main__':
    sets=master('actionSets'); costumes=master('costume2ds'); people=master('character2ds')
    export('area_sd/base_model', OUT/'base')
    export('area_sd/v2_base_model', OUT/'base-v2')
    rows=json.loads((ROOT/'analysis-6.8.1/objects.json').read_text(encoding='utf-8'))
    ui=[]
    for name in ['bg_base_r30_wh','balloon_talk','balloon_talk_direction','balloon_areaTalkChr','balloon_areaTalkChr_direction']:
        row=next(r for r in rows if r['type']=='Sprite' and r.get('name')==name)
        env=UnityPy.load(str(ROOT/'analysis-6.8.1/unpacked/assets/bin/Data'/row['file']))
        o=next(o for o in env.objects if o.path_id==row['path_id']);o.read().image.save(OUT/(name+'.png'))
        ui.append({**row,'border':o.read_typetree()['m_Border']})
    save(OUT/'balloon-source.json',ui)
    plans={}; envs={}
    # Original group actions: two people in each main SEKAI; final world has solo scripts.
    selected={5:18,7:294,8:46,9:247,10:299,27:2725}
    for world,ident in selected.items():
        row=next(r for r in sets if r['id']==ident)
        key='actionset/group'+str(ident//100)
        if key not in envs:envs[key]=bundle(key)
        env,source=envs[key]
        found=next(o for o in env.objects if o.type.name=='MonoBehaviour' and o.read_typetree().get('ActionSetId')==ident)
        data=found.read_typetree(); source={**source,'path_id':str(found.path_id)}
        plans[str(world)]={'source':source,'master':row,'script':data,'actors':[]}
        for d in data['Details']:
            c=next((r for r in costumes if r['character2dId']==d['AreaCharacterId'] and r['costume2dGroupId']==(d['Costume2dGroupId'] or 1)),None)
            if not c:raise ValueError(d)
            asset=c['spineAssetbundleName']; export('area_sd/'+asset,OUT/asset)
            plans[str(world)]['actors'].append({'asset':asset,'costume':c,'character':next(r for r in people if r['id']==d['AreaCharacterId'])})
        # Serialized area grid and its transform are retained for projection audit.
        env,src=bundle('area/area'+str(world)); grid=[]
        for o in env.objects:
            if o.type.name=='MonoBehaviour':
                d=o.read_typetree()
                if 'CellSize' in d: grid.append({'id':str(o.path_id),'data':{k:v for k,v in d.items() if k!='Cells'}})
        plans[str(world)]['grid']=grid
        print(world,ident,[a['asset'] for a in plans[str(world)]['actors']],flush=True)
    save(OUT/'plans.json',plans)
