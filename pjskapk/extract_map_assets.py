"""Read-only device cache discovery and original map asset export."""
import hashlib,json,subprocess
from pathlib import Path
import UnityPy
UnityPy.config.FALLBACK_UNITY_VERSION='2022.3.62f2'
ROOT=Path(__file__).resolve().parent
CACHE=ROOT/'analysis-6.8.1/map-bundles'; CACHE.mkdir(exist_ok=True)
OUT=ROOT.parent/'themes/sekai-next/source/game-assets/map';OUT.mkdir(exist_ok=True)
ADB=['D:/WorkSpace/CTF/adb/adb.exe','-s','19bd96b8']
def decode(raw):
 if raw[:4]!=b'\x10\0\0\0':return raw
 b=bytearray(raw[4:])
 for i in range(128):
  if i%8<5:b[i]^=255
 return bytes(b)
def fetch(key):
 digest=hashlib.md5(key.encode()).hexdigest(); p=CACHE/digest
 if not p.exists():
  prefix=hashlib.md5(key.rsplit('/',1)[0].encode()).hexdigest()[:4]
  r=subprocess.run(ADB+['pull',f'/sdcard/Android/data/com.sega.pjsekai/files/data/{prefix}/{digest}',str(p)],capture_output=True)
  if r.returncode:return
 return p
if __name__=='__main__':
 records=[]
 for key in [f'area/area{i}' for i in range(1,31)]+['worldmap','worldmap/sekai','worldmap/worldmap','worldmap/realworld']:
  p=fetch(key)
  if not p:continue
  env=UnityPy.load(decode(p.read_bytes()))
  names=[o.read().m_Name for o in env.objects if o.type.name=='Texture2D']
  records.append(dict(key=key,file=p.name,textures=names))
  print(key,names,flush=True)
 (CACHE/'inventory.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
