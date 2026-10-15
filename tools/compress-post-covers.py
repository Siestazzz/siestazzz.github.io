"""Re-encode the ten local covers at <= half their original byte size, no resizing."""
from pathlib import Path
from io import BytesIO
import json
from PIL import Image

root=Path(__file__).resolve().parents[1]
folder=root/'source/images/post-covers'
report=[]
for source in sorted(folder.glob('wallpaper-*')):
    if source.suffix.lower() not in ('.jpg','.jpeg','.png'):continue
    original=source.stat().st_size
    with Image.open(source) as im:
        image=im.convert('RGBA' if 'A' in im.getbands() else 'RGB')
        lo,hi=1,100;best=None;quality=1
        while lo<=hi:
            q=(lo+hi)//2;stream=BytesIO()
            image.save(stream,'WEBP',quality=q,method=6)
            data=stream.getvalue()
            if len(data)<=original/2:best=data;quality=q;lo=q+1
            else:hi=q-1
        if best is None:raise RuntimeError('Cannot meet budget without resizing: '+source.name)
        dest=source.with_suffix('.webp');dest.write_bytes(best)
        report.append(dict(original=source.name,file=dest.name,before=original,after=len(best),quality=quality,width=im.width,height=im.height))
        print(source.name,original,'->',len(best),flush=True)
(folder/'compression.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print('TOTAL',sum(r['before'] for r in report),'->',sum(r['after'] for r in report))
