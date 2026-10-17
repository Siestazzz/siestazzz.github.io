"""Conservative entry-media transcode; originals remain in ignored backups."""
from pathlib import Path
import json, shutil, subprocess, hashlib
from PIL import Image
import imageio_ffmpeg
root=Path(__file__).resolve().parents[1]
assets=root/'themes/sekai-next/source/game-assets/entry'
backup=root/'backups/entry-media-originals'
backup.mkdir(parents=True,exist_ok=True)
records=[]
for name in ['title-background.mp4']+[f'tex_anniversary_5th_bg_bg_0{i}.png' for i in range(1,4)]:
    source=assets/name
    original=backup/name
    if not original.exists(): shutil.copy2(source,original)
    if name.endswith('.mp4'):
        target=assets/name
        subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-hide_banner','-v','error','-i',str(original),'-an','-c:v','libx264','-preset','slow','-crf','25','-pix_fmt','yuv420p','-force_key_frames','7.533333','-movflags','+faststart','-y',str(target)],check=True)
    else:
        target=source.with_suffix('.webp')
        with Image.open(original) as im: im.save(target,'WEBP',quality=90,method=6)
    records.append({'source':name,'output':target.name,'original_bytes':original.stat().st_size,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
(assets/'web-compression.json').write_text(json.dumps({'video_crf':25,'webp_quality':90,'loop_start_seconds':226/30,'records':records},indent=2),encoding='utf8')
print(json.dumps(records,indent=2))
