"""Decode original cue streams once, export local web audio and loop metadata."""
import json, subprocess, hashlib, zipfile
from pathlib import Path
import imageio_ffmpeg
root=Path(__file__).resolve().parent
audit=root/'analysis-6.8.1/audio-audit'
out=root.parent/'themes/sekai-next/source/game-assets/audio'
out.mkdir(exist_ok=True)
cli=root/'analysis-6.8.1/vgmstream-r2117/vgmstream-cli.exe'
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
def info(file,index=1):
    return json.loads(subprocess.check_output([str(cli),'-m','-I','-s',str(index),str(file)],text=True))
def convert(file,name,index=1):
    meta=info(file,index)
    wav=audit/(name+'.wav')
    subprocess.run([str(cli),'-i','-s',str(index),'-o',str(wav),str(file)],check=True,capture_output=True)
    target=out/(name+'.ogg')
    subprocess.run([ffmpeg,'-v','error','-i',str(wav),'-c:a','libvorbis','-q:a','5','-y',str(target)],check=True)
    return dict(file=target.name,source=file.name,subsong=index,metadata=meta,sha256=hashlib.sha256(target.read_bytes()).hexdigest())
manifest={}
for name,title in [('music0001','一緒に歌おう！'),('music0002','Our Town, Our Life')]:
    manifest[name]=convert(audit/(name+'.acb'),name)
    manifest[name]['title']=title
cues={}
bank=audit/'MenuCommon.acb'
for index in range(1,info(bank)['streamInfo']['total']+1):
    data=info(bank,index);cues[data['streamInfo']['name']]=index
(audit/'menu-cues.json').write_text(json.dumps(cues,indent=2),encoding='utf8')
for cue in ['SE_DECIDE1_MUSIC','SE_CANCEL_old2','SE_MUSIC_SCROLL','SE_UI_SCROLL']:
    matches=[(n,i) for n,i in cues.items() if cue in n.split(';') or n==cue]
    if not matches: matches=[(n,i) for n,i in cues.items() if cue in n]
    assert len(matches)==1,(cue,matches)
    manifest[cue]=convert(bank,cue,matches[0][1])
archive=root/'analysis-6.8.1/packages/installed_UnityDataAssetPack.apk'
with zipfile.ZipFile(archive) as z:
    builtin=audit/'MenuCommon_Built_in.acb'
    builtin.write_bytes(z.read('assets/MenuCommon_Built_in.acb'))
assert info(builtin,20)['streamInfo']['name']=='SE_TITLE_ENTER'
manifest['SE_TITLE_ENTER']=convert(builtin,'SE_TITLE_ENTER',20)
manifest['SE_TITLE_ENTER']['sourceArchive']='installed_UnityDataAssetPack.apk/assets/MenuCommon_Built_in.acb'
manifest['SE_TITLE_ENTER']['sourceSha256']=hashlib.sha256(builtin.read_bytes()).hexdigest()
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(manifest,ensure_ascii=False,indent=2))
