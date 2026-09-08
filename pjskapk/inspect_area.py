from pathlib import Path
import UnityPy
from collections import Counter
UnityPy.config.FALLBACK_UNITY_VERSION = '2022.3.62f2'
b = bytearray(Path('pjskapk/analysis-6.8.1/area1.bundle').read_bytes()[4:])
for i in range(128):
    if i % 8 < 5: b[i] ^= 255
env = UnityPy.load(bytes(b))
print(Counter(o.type.name for o in env.objects))
for obj in env.objects:
    if obj.type.name == 'SpriteRenderer':
        r = obj.read()
        try:
            s = r.m_Sprite.read()
            go = r.m_GameObject.read()
            t = next(c.component.read() for c in go.m_Component if c.component.type.name == 'Transform')
            if s.m_Name.startswith(('crowd','tex_area_')): continue
            parents=[]; p=t.m_Father
            while p.m_PathID:
                pt=p.read(); parents.append((pt.m_GameObject.read().m_Name, str(pt.m_LocalPosition), str(pt.m_LocalScale))); p=pt.m_Father
            print(go.m_Name, s.m_Name, 'order', r.m_SortingOrder, 'position', t.m_LocalPosition, 'scale',t.m_LocalScale, 'pivot',s.m_Pivot,'ppu',s.m_PixelsToUnits, 'parents',parents)
        except Exception as ex: print(type(ex).__name__, str(ex)[:120])
