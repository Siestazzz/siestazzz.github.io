"""Export original selection status icons, keeping source identifiers."""
import json
from pathlib import Path
import UnityPy
root = Path(__file__).resolve().parent
rows = json.loads((root / 'analysis-6.8.1/objects.json').read_text(encoding='utf-8'))
out = root.parent / 'themes/sekai-next/source/game-assets'
manifest = []
for row in rows:
    if row['type'] != 'Sprite' or row.get('name') not in ['icon_fullCombo', 'icon_allPerfect']:
        continue
    env = UnityPy.load(str(root / 'analysis-6.8.1/unpacked/assets/bin/Data' / row['file']))
    obj = next(o for o in env.objects if o.path_id == row['path_id'])
    obj.read().image.save(out / (row['name'] + '.png'))
    manifest.append(row)
(out / 'clear-provenance.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print([r['name'] for r in manifest])
