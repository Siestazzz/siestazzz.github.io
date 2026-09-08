"""Local, reproducible inspection of the supplied APKS. Does not run game code."""
import argparse
import collections
import hashlib
import io
import json
from pathlib import Path
import re
import zipfile

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'analysis-6.8.1'

def save(name, data):
    p = OUT / name
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2, default=str), encoding='utf-8')

def prepare():
    source = ROOT / 'プロセカ_6.8.1.apks'
    inventory = []
    with zipfile.ZipFile(source) as outer:
        for part in outer.namelist():
            raw = outer.read(part)
            if part == 'base.apk':
                p = OUT / 'packages' / part
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_bytes(raw)
            with zipfile.ZipFile(io.BytesIO(raw)) as inner:
                for item in inner.infolist():
                    inventory.append(dict(package=part, path=item.filename, bytes=item.file_size))
                    if item.filename.startswith('assets/bin/Data/') or item.filename.endswith('AssetBundleInfo.json'):
                        relative = Path(item.filename)
                        if '..' in relative.parts or relative.is_absolute():
                            raise ValueError('Unsafe archive path')
                        p = OUT / 'unpacked' / relative
                        p.parent.mkdir(parents=True, exist_ok=True)
                        p.write_bytes(inner.read(item))
    save('package-inventory.json', inventory)
    save('source.json', dict(name=source.name, bytes=source.stat().st_size,
                            sha256=hashlib.sha256(source.read_bytes()).hexdigest()))
    print('Prepared', len(inventory), 'entries', flush=True)

def scan():
    import UnityPy
    directory = OUT / 'unpacked/assets/bin/Data'
    # Unity Android splits large serialized files; reassemble only into analysis output.
    for first in directory.glob('*.split0'):
        stem = first.name[:-7]
        chunks = sorted(directory.glob(stem + '.split*'), key=lambda p: int(p.name.rsplit('split', 1)[1]))
        (directory / stem).write_bytes(b''.join(p.read_bytes() for p in chunks))
    rows, errors = [], []
    files = [p for p in directory.iterdir() if p.is_file() and '.split' not in p.name]
    for n, p in enumerate(files):
        if n % 500 == 0:
            print('Scan', n, '/', len(files), 'objects', len(rows), flush=True)
        try:
            env = UnityPy.load(str(p))
            for obj in env.objects:
                row = dict(file=p.name, path_id=obj.path_id, type=obj.type.name,
                           unity_version=obj.assets_file.unity_version)
                try:
                    data = obj.read()
                    row['name'] = getattr(data, 'm_Name', '')
                    if obj.type.name == 'Texture2D':
                        row.update(width=data.m_Width, height=data.m_Height)
                    if obj.type.name == 'AnimationClip':
                        row['sample_rate'] = data.m_SampleRate
                    if obj.type.name == 'MonoScript':
                        row.update(class_name=data.m_ClassName, namespace=data.m_Namespace)
                except Exception as exc:
                    row['read_error'] = str(exc)[:150]
                rows.append(row)
        except Exception as exc:
            errors.append(dict(file=p.name, error=str(exc)[:180]))
    save('objects.json', rows)
    save('scan-errors.json', errors)
    counts = collections.Counter(r['type'] for r in rows)
    save('summary.json', dict(files=len(files), objects=len(rows), types=counts, errors=len(errors)))
    print(dict(counts), 'errors', len(errors), flush=True)

def export():
    import UnityPy
    from PIL import Image, ImageDraw, ImageFont
    rows = json.loads((OUT / 'objects.json').read_text(encoding='utf-8'))
    directory = OUT / 'unpacked/assets/bin/Data'
    selected = []
    pattern = re.compile(r'^(btn_(menu|round|line|close)|bg_(common|base_menu|dialog)|icon_(back_wh|close|search|menu)|tab_(wh|gn|bg|line)|tex_(transition|tap|common_tri))|cellphone', re.I)
    atlases = re.compile(r'(CommonAtlas|TopMenuAtlas|MenuTopAtlas|BackgroundAtlas|FrameAtlas|TransitionAtlas|StoryAtlas|LiveAtlas)-')
    for row in rows:
        name, kind = row.get('name', ''), row['type']
        if kind == 'Sprite' and pattern.search(name):
            selected.append(row)
        elif kind == 'Texture2D' and (atlases.search(name) or pattern.search(name)):
            selected.append(row)
        elif kind == 'AnimationClip' and re.search(r'menu|phone|transition|slide|^PageForward$|^FadeIn$', name, re.I):
            selected.append(row)
        elif kind == 'Font':
            selected.append(row)
    exported, failures = [], []
    for n, row in enumerate(selected):
        try:
            env = UnityPy.load(str(directory / row['file']))
            obj = next(o for o in env.objects if o.path_id == row['path_id'])
            data = obj.read()
            name = re.sub(r'[^\w.-]+', '_', row['name'])
            stem = f"{name}__{row['file'][:8]}_{row['path_id']}"
            result = dict(row)
            if row['type'] in ('Texture2D', 'Sprite'):
                rel = f"images/{row['type']}/{stem}.png"
                p = OUT / rel
                p.parent.mkdir(parents=True, exist_ok=True)
                img = data.image
                img.save(p)
                result.update(output=rel, width=img.width, height=img.height)
                if row['type'] == 'Sprite':
                    result['border'] = {k: getattr(data.m_Border, k) for k in ('x','y','z','w')}
                    result['pixels_per_unit'] = data.m_PixelsToUnits
                if row['name'] in ('btn_round_h80_gn','bg_common_color','btn_round_h80_dsb','bg_base_menu'):
                    rgb = img.convert('RGBA')
                    colors = collections.Counter(pixel[:3] for pixel in rgb.getdata() if pixel[3] > 240)
                    result['opaque_colors'] = [dict(hex='#%02x%02x%02x' % color, pixels=count) for color,count in colors.most_common(6)]
            elif row['type'] == 'AnimationClip':
                tree = obj.read_typetree()
                rel = f'animations/{stem}.json'
                save(rel, tree)
                settings = tree.get('m_AnimationClipSettings', {})
                result.update(output=rel, settings=settings)
                result['tracks'] = [dict(attribute=c.get('attribute'), path=c.get('path'), keys=c.get('curve',{}).get('m_Curve',[])) for c in tree.get('m_FloatCurves', [])]
            else:
                result['font_bytes'] = len(data.m_FontData or [])
                # Identify font families without installing or copying font binaries into the website.
            exported.append(result)
        except Exception as exc:
            failures.append(dict(row, error=str(exc)[:250]))
        if n % 40 == 0:
            print('Export',n,'/',len(selected), 'failed',len(failures),flush=True)
    save('export-index.json', exported)
    save('export-errors.json', failures)
    images = [r for r in exported if r.get('output','').startswith('images/') and r['type']=='Sprite']
    font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 12)
    for page in range(0, len(images), 30):
        group = images[page:page+30]
        sheet = Image.new('RGB', (1200, ((len(group)+4)//5)*150), '#dedee7')
        draw = ImageDraw.Draw(sheet)
        for i, item in enumerate(group):
            x,y = (i%5)*240, (i//5)*150
            draw.rounded_rectangle((x+4,y+4,x+236,y+145), radius=8, fill='#555570')
            img = Image.open(OUT / item['output']).convert('RGBA')
            img.thumbnail((220,103))
            sheet.paste(img, (x+120-img.width//2,y+58-img.height//2), img)
            draw.text((x+10,y+114), item['name'][:31], font=font, fill='white')
            draw.text((x+10,y+130), f"{item['width']} x {item['height']}", font=font, fill='#9aefdf')
        sheet.save(OUT / f'contact-sheet-{page//30+1:02}.png')
    print('Exported',len(exported),'failures',len(failures),flush=True)

def details():
    """Summarize runtime clip timing without guessing hashed property bindings."""
    rows = json.loads((OUT / 'export-index.json').read_text(encoding='utf-8'))
    clips = []
    for row in rows:
        if row['type'] != 'AnimationClip':
            continue
        tree = json.loads((OUT / row['output']).read_text(encoding='utf-8'))
        muscle = tree.get('m_MuscleClip', {})
        start, stop = muscle.get('m_StartTime'), muscle.get('m_StopTime')
        result = dict(name=row['name'], source=row['output'], start_seconds=start,
                      stop_seconds=stop, duration_ms=round((stop-start)*1000, 3)
                      if start is not None and stop is not None else None,
                      sample_rate=tree.get('m_SampleRate'), loop=muscle.get('m_LoopTime'),
                      bindings=tree.get('m_ClipBindingConstant', {}).get('genericBindings', []),
                      value_deltas=muscle.get('m_ValueArrayDelta', []))
        clips.append(result)
        row['runtime_timing'] = {k: result[k] for k in ('start_seconds', 'stop_seconds', 'duration_ms', 'sample_rate', 'loop')}
    save('animation-summary.json', clips)
    save('export-index.json', rows)
    print('Summarized', len(clips), 'runtime clips')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['prepare', 'scan', 'export', 'details'])
    args = parser.parse_args()
    globals()[args.action]()
