"""Collect public JP honor background images separately from APK-versioned assets.
Resumable, four workers, no authentication, no overwriting existing images.
"""
import argparse, concurrent.futures, hashlib, json, re, time, urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parent/'honor-library'
ROOT.mkdir(exist_ok=True)
BASE='https://storage.sekai.best/sekai-jp-assets/'
MASTER='https://raw.githubusercontent.com/Sekai-World/sekai-master-db-diff/main/'
def get(url):
 with urllib.request.urlopen(url,timeout=20) as r: return r.read()
data={}
for name in ['honors','honorGroups']:
 raw=get(MASTER+name+'.json'); (ROOT/(name+'.json')).write_bytes(raw);data[name]=json.loads(raw)
groups={g['id']:g for g in data['honorGroups']}
bundles={}
for h in data['honors']:
 g=groups.get(h['groupId'],{})
 name=g.get('backgroundAssetbundleName') or h.get('assetbundleName')
 if not name or not re.fullmatch(r'[A-Za-z0-9_-]+',name): continue
 category='rank_live/honor' if g.get('honorType')=='rank_match' else 'honor'
 key=category+'/'+name
 bundles.setdefault(key,[]).append({'id':h['id'],'name':h['name'],'rarity':h.get('honorRarity'),'group':g.get('name')})
(ROOT/'background-index.json').write_text(json.dumps(bundles,ensure_ascii=False,indent=2),encoding='utf-8')
jobs=[(key,slot) for key in bundles for slot in ['main','sub']]
print(f'{len(bundles)} unique background bundles, {len(jobs)} images',flush=True)
parser=argparse.ArgumentParser()
parser.add_argument('--download',action='store_true',help='Optional urllib downloader; on this Windows host use download_honor_backgrounds.ps1 instead.')
if not parser.parse_args().download:
 print('Index saved. Use download_honor_backgrounds.ps1 to download via the host network stack.')
 raise SystemExit(0)
def fetch(job):
 key,slot=job; rel=key+'/degree_'+slot+'.png'; url=BASE+rel; dest=ROOT/rel
 try:
  if dest.exists(): raw=dest.read_bytes()
  else:
   raw=get(url)
   if not raw.startswith(b'\x89PNG\r\n\x1a\n'): raise ValueError('Not PNG')
   dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw)
  return {'path':rel,'url':url,'status':'ok','bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
 except Exception as e: return {'path':rel,'url':url,'status':'missing','error':str(e)}
records=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for result in pool.map(fetch,jobs):
  records.append(result)
  if len(records)%40==0: print(f'{len(records)}/{len(jobs)}; found {sum(r["status"]=="ok" for r in records)}',flush=True)
  if len(records)%100==0: (ROOT/'downloads.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'downloads.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'DONE {sum(r["status"]=="ok" for r in records)}/{len(jobs)} images',flush=True)
