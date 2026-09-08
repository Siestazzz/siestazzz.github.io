"""Export original static honor sprites without repainting or resizing."""
import json
from pathlib import Path
import UnityPy
ROOT=Path(__file__).resolve().parent
DATA=ROOT/'analysis-6.8.1/unpacked/assets/bin/Data'
OUT=ROOT.parent/'themes/sekai-next/source/game-assets/honors'
OUT.mkdir(parents=True,exist_ok=True)
rows=json.loads((ROOT/'analysis-6.8.1/objects.json').read_text(encoding='utf-8'))
names={f'frame_degree_{size}_{rank}' for size in ['m','s'] for rank in range(1,5)}
names.update(['degree_bgBase','degree_bgTexture_main','degree_bgTexture_sub','degree_bgColor','frame_degree_m_white','mask_degree_main','mask_degree_sub','line_degree','icon_degreeLv','icon_degreeLv6','live_master_honor_star_1','live_master_honor_star_2'])
records=[]
for row in rows:
 if row['type']!='Sprite' or row.get('name') not in names: continue
 obj=next(o for o in UnityPy.load(str(DATA/row['file'])).objects if o.path_id==row['path_id'])
 sprite=obj.read(); tree=obj.read_typetree()
 sprite.image.save(OUT/(row['name']+'.png'))
 records.append(dict(**row,rect=tree['m_Rect'],border=tree['m_Border']))
 print(row['name'],tree['m_Rect'])
(OUT/'provenance.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
