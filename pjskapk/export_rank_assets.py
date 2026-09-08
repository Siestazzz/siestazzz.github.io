"""Export original rank HUD sprites for the local theme."""
import json
from pathlib import Path
import UnityPy

root = Path(__file__).resolve().parent
data = root / 'analysis-6.8.1/unpacked/assets/bin/Data'
out = root.parent / 'themes/sekai-next/source/game-assets'
rows = json.loads((root / 'analysis-6.8.1/objects.json').read_text(encoding='utf-8'))
manifest = []
for name in ['icon_playerRank', 'icon_exp_player', 'icon_playerrankexp']:
    row = next(r for r in rows if r.get('name') == name and r['type'] == 'Sprite')
    env = UnityPy.load(str(data / row['file']))
    obj = next(o for o in env.objects if o.path_id == row['path_id'])
    obj.read().image.save(out / (name + '.png'))
    manifest.append(row)
(out / 'rank-provenance.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print('Exported rank HUD sprites')
