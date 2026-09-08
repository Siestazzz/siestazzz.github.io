"""WONDERLAND-only export; shared exporters are read, never modified."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
sys.argv = [str(__file__), '--area', '9']
for filename in ['export_classroom.py', 'export_area27_effects.py', 'export_stage_items.py']:
    source = (ROOT / filename).read_text(encoding='utf-8')
    source = source.replace('choices=[5,7]', 'choices=[9]').replace('choices=[5,7,27]', 'choices=[9]')
    source = source.replace("('classroom' if AREA==5 else 'stage')", "'area9'")
    source = source.replace(' sprite=d.m_Sprite.read()', ' if not d.m_Sprite.m_PathID:continue\n sprite=d.m_Sprite.read()')
    source = source.replace("path.startswith('area'+str(AREA)+'/Background/')", "path.startswith('area'+str(AREA)+'/')")
    exec(compile(source, str(ROOT / filename), 'exec'), {'__name__': '__main__'})

exec(compile((ROOT / 'export_area9_audit.py').read_text(encoding='utf-8'), str(ROOT / 'export_area9_audit.py'), 'exec'), {'__name__': '__main__'})
