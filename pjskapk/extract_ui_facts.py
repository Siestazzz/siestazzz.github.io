"""Export UI facts whose serialized fields have been checked against IL2CPP declarations."""
import json,sqlite3,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parent/'analysis-6.8.1'
out=ROOT/'il2cpp-audit'
db=sqlite3.connect(ROOT/'il2cpp-dump/symbols.sqlite')
names=['UIBlurController','UIBlurLayerManager','UIPartsBlurMusicJacket','CommonBackgroundDot',
       'UIPartsLineSpectrumAnalyzer','UIPartsSpectrumAnalyzer','PanoramaAreaMultiScroller','SekaiUIBlurParameter']
for name in names:
    records=db.execute('SELECT type_id,namespace,declaration,start_line,body FROM types WHERE declaration LIKE ?',('%class '+name+' :%',)).fetchall()
    if not records: records=db.execute('SELECT type_id,namespace,declaration,start_line,body FROM types WHERE declaration = ?',('public class '+name,)).fetchall()
    (out/(name+'.declarations.json')).write_text(json.dumps(records,indent=2),encoding='utf-8')
components=json.loads((ROOT/'ui-data/components.json').read_text())
controller=next(r for r in components if r['script']=='UIBlurController')
sampling,scale=struct.unpack_from('<2f',bytes.fromhex(controller['raw']),32)
facts=dict(
    controller=dict(source=controller['file'],path_id=controller['path_id'],
                    BlurSamplingDistance=sampling,CaptureResolutionScale=scale,
                    confidence='Serialized defaults, verified field order; not per-page runtime values'),
    jacket=dict(prefab='dda81731e906904488b8ae15ce6e83ca',component=1303,
                shader='a7c3a9f13160e49a7b62548fbaa258ae',shader_name='Sekai/UI/UIGaussianBlur',
                SamplingDistance=2.799999952316284,thumbnail_alpha=0.2980392277240753,
                method='0x4C31850',behavior='Create RenderTexture at source dimensions, create material from shader, Graphics.Blit once, assign thumbnail texture',
                warning='Shader sampling distance is not CSS Gaussian sigma; compiled GPU kernel remains to decode'),
    spectrum=dict(prefab='28c0f589d6778da4db63687135fe3a6a',bars=6,width=8,height=72,
                  x=[-35,-21,-7,7,21,35],warning='Geometry verified. Web mock animation is not original audio-driven samples'),
    dots=dict(method='0x4FDE498',small_texture='bg_common_ptn_dot_s',small_size=[8,8],
              bottom_texture='bg_common_ptn_dot_l',bottom_size=[40,278],
              uv='small repeats width/textureWidth and height/textureHeight; bottom repeats width/textureWidth, vertical UV range 1',
              warning='Common component confirmed; per-page runtime composition still needs verification'),
    unresolved=['Distinct effective blur for LIVE versus selection, including capture chain',
                'Compiled jacket GPU kernel and final gradient/compositing mask',
                'Exact runtime audio samples and scroll inertia/bounds'])
(out/'ui-facts.json').write_text(json.dumps(facts,indent=2),encoding='utf-8')
print(json.dumps(facts,indent=2))
