"""Area10 isolated export runner; adapts shared exporters without editing them.

Reads original cached bundles, and keeps newly pulled dependencies in its own audit.
"""
from pathlib import Path
import sys,json,hashlib,subprocess
import extract_map_assets as base

ROOT=Path(__file__).resolve().parent
AUDIT=ROOT/'analysis-6.8.1/area10-audit'
AUDIT.mkdir(exist_ok=True)
DEST=base.OUT/'area10'
DEST.mkdir(exist_ok=True)
def fetch(key):
 digest=hashlib.md5(key.encode()).hexdigest()
 old=base.CACHE/digest
 if old.exists():return old
 target=AUDIT/digest
 if not target.exists():
  prefix=hashlib.md5(key.rsplit('/',1)[0].encode()).hexdigest()[:4]
  r=subprocess.run(base.ADB+['pull',f'/sdcard/Android/data/com.sega.pjsekai/files/data/{prefix}/{digest}',str(target)],capture_output=True)
  if r.returncode:return None
 return target
base.fetch=fetch
for filename in ['export_classroom.py','export_area27_effects.py','audit_classroom_fx.py','export_stage_items.py']:
 text=(ROOT/filename).read_text(encoding='utf8')
 text=text.replace('choices=[5,7,27]','choices=[5,7,10,27]').replace('choices=[5,7]','choices=[5,7,10]')
 text=text.replace("('classroom' if AREA==5 else 'stage')","('classroom' if AREA==5 else 'area10' if AREA==10 else 'stage')")
 text=text.replace("('classroom' if area==5 else 'stage')","('classroom' if area==5 else 'area10' if area==10 else 'stage')")
 sys.argv=[filename,'--area','10']
 exec(compile(text,str(ROOT/filename),'exec'),{'__name__':'__main__','__file__':str(ROOT/filename)})
scene=json.loads((DEST/'scene.json').read_text(encoding='utf8'))
ground=next(s for s in scene['sprites'] if s['path'].endswith('/background'))
scene.update(groundFile=ground['file'],coordinateSize=ground['size'])
for sprite in scene['sprites']:sprite['webLayer']='back' if sprite['order']<100 else 'front'
objects=json.loads((AUDIT/'objects.json').read_text(encoding='utf8'))
by_id={o['id']:o['data'] for o in objects}
for sprite in scene['sprites']:
 d=by_id[sprite['renderer']]
 sprite['opacity']=d['m_Color']['a']
 sprite['sourceColor']=d['m_Color']
scene['areaController']=next({'id':o['id'],**o['data']} for o in objects if o['type']=='MonoBehaviour' and 'scrollMax' in o['data'])
(DEST/'scene.json').write_text(json.dumps(scene,ensure_ascii=False,indent=2),encoding='utf8')
effects=json.loads((DEST/'effects.json').read_text(encoding='utf8'))
for g in effects['groups']:
 g['webUnits']=600 if g['name'].startswith('fx_light_') else 1
 if g['webUnits']!=1:g['webUnitsReason']='Web projection calibration for original normalized quad; not a recovered Unity constant.'
(DEST/'effects.json').write_text(json.dumps(effects,ensure_ascii=False,separators=(',',':')),encoding='utf8')
# Full item ancestry and color are retained in addition to original spawn Transform.
items=json.loads((DEST/'items.json').read_text(encoding='utf8'))
for sprite in items['sprites']:
 audit=json.loads((AUDIT/(sprite['source'].split('/')[-1]+'.json')).read_text(encoding='utf8'))
 gos={o['id']:o['data']['m_Name'] for o in audit if o['type']=='GameObject'}
 trs={o['id']:o['data'] for o in audit if o['type']=='Transform'}
 rd=next(o['data'] for o in audit if o['id']==sprite['renderer'])
 tr=next(t for t in trs.values() if t['m_GameObject']['m_PathID']==rd['m_GameObject']['m_PathID'])
 chain=[]
 while tr:
  chain.insert(0,gos[str(tr['m_GameObject']['m_PathID'])])
  tr=trs.get(str(tr['m_Father']['m_PathID']))
 sprite['path']='/'.join(chain)
 sprite['opacity']=rd['m_Color']['a']
 sprite['sourceColor']=rd['m_Color']
(DEST/'items.json').write_text(json.dumps(items,ensure_ascii=False,indent=2),encoding='utf8')
