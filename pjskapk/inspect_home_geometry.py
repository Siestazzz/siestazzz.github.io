"""Report original home rects and sprite bindings; no asset modifications."""
from pathlib import Path
import UnityPy

data = Path(__file__).resolve().parent / 'analysis-6.8.1/unpacked/assets/bin/Data'
env = UnityPy.load(str(data / '1b7a0ea3397cc4b50afa58eaa2030516'))
for obj in env.objects:
    if obj.type.name != 'RectTransform':
        continue
    tr = obj.read()
    parts = [tr.m_GameObject.read().m_Name]
    parent = tr.m_Father
    while parent.m_PathID:
        item = parent.read()
        parts.append(item.m_GameObject.read().m_Name)
        parent = item.m_Father
    path = '/'.join(reversed(parts))
    if path.endswith(('ComponentRoot', 'BottomLeft', 'BottomRight', 'HomeBannerList', 'MainMenu', 'MainMenu/Base', 'Base/Gacha', 'Base/Gacha/Image', 'Base/Live')):
        raw = obj.read_typetree()
        print(path, {key: raw[key] for key in ('m_AnchorMin', 'm_AnchorMax', 'm_SizeDelta', 'm_AnchoredPosition', 'm_LocalScale')})
