import json
from pathlib import Path
import UnityPy

root = Path(__file__).resolve().parent
rows = json.loads((root / 'analysis-6.8.1/objects.json').read_text(encoding='utf-8'))
out = root.parent / 'themes/sekai-next/source/game-assets'
evidence = []
for name in ['icon_livebonusDrink']:
    row = next(r for r in rows if r.get('name') == name and r['type'] == 'Sprite')
    env = UnityPy.load(str(root / 'analysis-6.8.1/unpacked/assets/bin/Data' / row['file']))
    obj = next(o for o in env.objects if o.path_id == row['path_id'])
    obj.read().image.save(out / (name + '.png'))
    evidence.append(row)
(out / 'stamina-provenance.json').write_text(json.dumps(evidence, indent=2), encoding='utf-8')
