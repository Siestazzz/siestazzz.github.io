"""Export only original street scenery from the user-connected device's area1 cache."""
from pathlib import Path
import hashlib
import json
import UnityPy
ROOT = Path(__file__).resolve().parent
source = ROOT / 'analysis-6.8.1/area1.bundle'
out = ROOT.parent / 'themes/sekai-next/source/game-assets/area1'
out.mkdir(parents=True, exist_ok=True)
raw = source.read_bytes()
data = bytearray(raw[4:])
# The cache has a four-byte prefix and an inverted five-byte header per eight bytes.
for i in range(128):
    if i % 8 < 5: data[i] ^= 255
UnityPy.config.FALLBACK_UNITY_VERSION = '2022.3.62f2'
env = UnityPy.load(bytes(data))
names = {'sky', 'background', 'ground', 'bg_2_building1', 'bg_2_building2',
         'bg_2_building3', 'bg_2_building4', 'Trafficlight_front', 'Trafficlight_behind'}
records = []
for obj in env.objects:
    if obj.type.name != 'Texture2D': continue
    texture = obj.read()
    if texture.m_Name not in names: continue
    texture.image.save(out / (texture.m_Name + '.png'))
    records.append(dict(name=texture.m_Name, path_id=obj.path_id,
                        width=texture.m_Width, height=texture.m_Height))
(out / 'provenance.json').write_text(json.dumps(dict(
    source='device com.sega.pjsekai/files/data/4b82/01a32ed5d8275bb6570b2f4bbe7b9e95',
    bundle_sha256=hashlib.sha256(raw).hexdigest(), textures=records,
    note='Original layered scenery, web framing is an approximation; no character layers.'
), indent=2), encoding='utf-8')
print('Exported', len(records), 'original scenery layers')
