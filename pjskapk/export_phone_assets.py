"""Extract original phone body and alpha masks from the connected game's cached UI bundle."""
import hashlib, json
from pathlib import Path
import UnityPy
ROOT = Path(__file__).resolve().parent
source = ROOT / 'analysis-6.8.1/smartphone.bundle'
raw = source.read_bytes()
data = bytearray(raw[4:])
for i in range(128):
    if i % 8 < 5: data[i] ^= 255
UnityPy.config.FALLBACK_UNITY_VERSION = '2022.3.62f2'
env = UnityPy.load(bytes(data))
out = ROOT.parent / 'themes/sekai-next/source/game-assets/phone'
out.mkdir(parents=True, exist_ok=True)
records = []
for obj in env.objects:
    if obj.type.name not in ['Texture2D', 'Sprite']: continue
    asset = obj.read()
    print(obj.type.name, obj.path_id, asset.m_Name)
    image = asset.image
    filename = asset.m_Name + '-' + str(obj.path_id) + '.png'
    image.save(out / filename)
    records.append(dict(name=asset.m_Name, type=obj.type.name, path_id=obj.path_id,
                        filename=filename, size=image.size))
(out / 'provenance.json').write_text(json.dumps(dict(bundle='ui/smartphone',
    sha256=hashlib.sha256(raw).hexdigest(), objects=records), indent=2), encoding='utf8')
