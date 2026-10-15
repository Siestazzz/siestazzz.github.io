"""Export only voices referenced by the currently mounted Live2D dialogue."""
import json, subprocess, hashlib
from pathlib import Path
import UnityPy, imageio_ffmpeg
from extract_map_assets import fetch, decode
root=Path(__file__).resolve().parent
assets=root.parent/'themes/sekai-next/source/game-assets/live2d'
audit=root/'analysis-6.8.1/live2d-voice';audit.mkdir(exist_ok=True)
cli=root/'analysis-6.8.1/vgmstream-r2117/vgmstream-cli.exe'
records=[];banks={}
def info(p,i=1):
 return json.loads(subprocess.check_output([str(cli),'-m','-I','-s',str(i),str(p)],text=True))
for character in ['ichika','rin','len','miku']:
 for row in json.loads((assets/character/'talks.json').read_text(encoding='utf8'))['items']:
  key='sound/system_live2d/voice/'+row['assetbundleName']
  if key not in banks:
   p=fetch(key)
   if not p:raise RuntimeError('Device cache missing '+key)
   found=[]
   for obj in UnityPy.load(decode(p.read_bytes())).objects:
    if obj.type.name!='TextAsset':continue
    d=obj.read();raw=d.m_Script
    if isinstance(raw,str):raw=raw.encode('utf8','surrogateescape')
    path=audit/(row['assetbundleName']+'_'+d.m_Name);path.write_bytes(raw)
    if path.suffix.lower()=='.acb':found.append((path,obj.path_id))
   assert len(found)==1,found
   bank,pid=found[0];cues={}
   for i in range(1,info(bank)['streamInfo']['total']+1):
    for name in info(bank,i)['streamInfo']['name'].split(';'):cues[name.strip()]=i
   banks[key]=(bank,pid,cues,p)
  bank,pid,cues,p=banks[key];index=cues[row['voice']]
  wav=audit/(row['voice']+'.wav')
  subprocess.run([str(cli),'-i','-s',str(index),'-o',str(wav),str(bank)],check=True,capture_output=True)
  out=assets/character/(row['voice']+'.ogg')
  subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-i',str(wav),'-c:a','libvorbis','-q:a','5','-y',str(out)],check=True)
  records.append(dict(character=character,talkId=row['id'],voice=row['voice'],bundle=key,cache=p.name,bundleSha256=hashlib.sha256(p.read_bytes()).hexdigest(),path_id=pid,bank=bank.name,subsong=index,metadata=info(bank,index),file=str(out.relative_to(assets)),sha256=hashlib.sha256(out.read_bytes()).hexdigest()))
  print(character,row['voice'],flush=True)
(assets/'voice-sources.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf8')
