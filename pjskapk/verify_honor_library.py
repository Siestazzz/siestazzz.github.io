import json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parent/'honor-library'
records=json.loads((ROOT/'downloads.json').read_text(encoding='utf-8-sig'))
errors=[]; count=0; size=0
for r in records:
 if r['status']!='ok': continue
 p=ROOT/r['path']
 try:
  with Image.open(p) as im: im.verify()
  count+=1;size+=p.stat().st_size
 except Exception as e: errors.append({'path':r['path'],'error':str(e)})
summary={'candidate_images':len(records),'downloaded_images':count,'missing_images':sum(r['status']!='ok' for r in records),'bytes':size,'corrupt':errors}
(ROOT/'verification.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps(summary,indent=2))
assert not errors
