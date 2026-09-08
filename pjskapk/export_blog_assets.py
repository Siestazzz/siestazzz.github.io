"""Export selected original game assets for the local Hexo prototype."""
import json
from pathlib import Path
import UnityPy

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'analysis-6.8.1/unpacked/assets/bin/Data'
OUT = ROOT.parent / 'themes/sekai-next/source/game-assets'
OUT.mkdir(parents=True, exist_ok=True)
rows = json.loads((ROOT / 'analysis-6.8.1/objects.json').read_text(encoding='utf-8'))
names = ['icon_friend_dbl', 'icon_shuffle_jacket_gr', 'icon_crystal', 'icon_unit_ln_wh', 'icon_unit_mj_wh', 'icon_unit_vb_wh', 'icon_unit_ws_wh', 'icon_unit_25_wh', 'bg_area_scramble', 'len', 'tex_Chara_Dummy_01', 'tex_Chara_Dummy_02',
         'btn_live_free', 'btn_live_multi', 'btn_live_maker', 'btn_live_challenge_l', 'btn_live_virtual', 'btn_live_mv',
         'bg_common_ptn_dot_s', 'icon_back_wh', 'icon_menu_wh', 'icon_search_h34_wh',
         'icon_menu_member', 'icon_menu_collection', 'icon_menu_story_wh',
         'tex_common_tri_01', 'tex_common_tri_02', 'tex_common_tri_03',
         'btn_round_h80_gn', 'btn_round_h80_wh', 'bg_common', 'bg_sekai',
         'longLoading_bg_leoneed', 'longLoading_bg_vividbadsquad']
names += ['btn_friend', 'icon_friend_s', 'icon_live_wh', 'btn_home_live',
          'tex_tap_texturesheet', 'tex_tap_texturesheet_1', 'tex_tap_flare',
          'tex_anniversary_5th_bg_bg_01', 'tex_anniversary_5th_bg_bg_02',
          'tex_anniversary_5th_bg_bg_03']
manifest = []
names += ['btn_random_lgr', 'btn_round_line_h80_wh', 'bg_common_ptn_dot_l']
names += ['icon_tab_unit_' + unit + '_' + state for unit in ['vs','ln','mj','vb','ws','25'] for state in ['on','off']]
for name in names:
    matches = [r for r in rows if r.get('name') == name and r['type'] in ('Sprite','Texture2D')]
    matches.sort(key=lambda r: r['type'] != 'Sprite')
    if not matches:
        raise ValueError(name)
    row = matches[0]
    env = UnityPy.load(str(DATA / row['file']))
    obj = next(o for o in env.objects if o.path_id == row['path_id'])
    obj.read().image.save(OUT / (name + '.png'))
    manifest.append(row)
for name in ['tex_tap_texturesheet', 'tex_tap_texturesheet_1']:
    row = next(r for r in rows if r.get('name') == name and r['type'] == 'Texture2D')
    env = UnityPy.load(str(DATA / row['file']))
    obj = next(o for o in env.objects if o.path_id == row['path_id'])
    obj.read().image.save(OUT / (name + '-atlas.png'))
    manifest.append(dict(row, output=name + '-atlas.png'))
for name in ['FOT-RodinNTLGPro-DB', 'FOT-RodinNTLGPro-EB']:
    row = next(r for r in rows if r.get('name') == name and r['type'] == 'Font')
    env = UnityPy.load(str(DATA / row['file']))
    obj = next(o for o in env.objects if o.path_id == row['path_id'])
    binary = bytes(obj.read().m_FontData)
    suffix = '.otf' if binary[:4] == b'OTTO' else '.ttf'
    (OUT / (name + suffix)).write_bytes(binary)
    manifest.append(dict(row, output=name + suffix, bytes=len(binary)))
(OUT / 'provenance.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print('Exported', len(manifest), 'assets')
