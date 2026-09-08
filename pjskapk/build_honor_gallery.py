"""Build a local contact-sheet HTML from downloaded original images, no image edits."""
import html,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
LIB=ROOT/'honor-library'
index=json.loads((LIB/'background-index.json').read_text(encoding='utf-8-sig'))
cards=[]
for key,items in index.items():
 images=[p for p in [(LIB/key/'degree_main.png'),(LIB/key/'degree_sub.png')] if p.exists()]
 if not images: continue
 label=items[0].get('group') or items[0]['name']
 cards.append('<article><h3>'+html.escape(label)+'</h3><code>'+html.escape(key)+'</code>'+''.join('<img loading="lazy" src="'+p.relative_to(LIB).as_posix()+'" alt="'+p.name+'">' for p in images)+'</article>')
assets=ROOT.parent/'themes/sekai-next/source/game-assets/honors'
frames=[]
for p in sorted(assets.glob('*.png')):
 frames.append('<article><h3>'+p.stem+'</h3><img loading="lazy" src="../../themes/sekai-next/source/game-assets/honors/'+p.name+'" alt="'+p.stem+'"></article>')
page='''<!doctype html><meta charset="utf-8"><title>称号素材目录</title>
<style>body{background:#252536;color:#eee;font:15px system-ui;margin:32px}input{padding:12px;width:80%;font:inherit}section{display:grid;grid-template-columns:repeat(auto-fill,minmax(390px,1fr));gap:16px;margin:24px 0}article{background:#44445b;padding:16px;overflow:hidden}h3{margin:0 0 12px;font-size:16px}code{display:block;font-size:12px;margin-bottom:14px}img{display:block;max-width:100%;height:auto;margin:8px 0;background:repeating-conic-gradient(#bbb 0% 25%,#eee 0% 50%) 0/16px 16px}[hidden]{display:none}</style>
<h1>称号素材目录</h1><p>通用素材：本机 6.8.1 APK。彩色主体图：社区日服镜像，不保证与 APK 同版本。部分图含原日文，不是可直接替换文字的空白背景。</p>
<input placeholder="搜索名称或资源编号" oninput="document.querySelectorAll('article').forEach(e=>e.hidden=!e.textContent.toLowerCase().includes(this.value.toLowerCase()))">
'''
page+=f'<h2>APK 通用素材：{len(frames)}</h2><section>'+''.join(frames)+'</section>'
page+=f'<h2>已获取背景资源包：{len(cards)} / {len(index)}</h2><section>'+''.join(cards)+'</section>'
(LIB/'index.html').write_text(page,encoding='utf-8')
device_manifest=LIB/'device-textures.json'
if device_manifest.exists():
 grouped={}
 for item in json.loads(device_manifest.read_text(encoding='utf-8')):grouped.setdefault(item['logical_bundle'],[]).append(item)
 dcards=[]
 for key,items in sorted(grouped.items()):
  label=(index.get(key) or [{}])[0].get('group') or key
  dcards.append('<article><h3>'+html.escape(label)+'</h3><code>'+html.escape(key)+'</code>'+''.join('<div>'+html.escape(i['texture'])+'</div><img loading="lazy" src="'+html.escape(i['path'],quote=True)+'" alt="'+html.escape(i['texture'],quote=True)+'">' for i in items)+'</article>')
 dp=page[:page.index('<h2>')]
 dp+='<p>本页全部贴图来自已连接平板缓存；未知逻辑名称保留 unmapped/哈希。版本号未由缓存独立证实。<a href="index.html">APK通用素材与镜像目录</a></p><section>'+''.join(dcards)+'</section>'
 (LIB/'device.html').write_text(dp,encoding='utf-8')
 (LIB/'index.html').write_text(page.replace('<h1>称号素材目录</h1>','<h1>称号素材目录</h1><p><a href="device.html">打开平板缓存原图目录（含排名图、滚动纹理）</a></p>'),encoding='utf-8')
 print('Device gallery:',len(grouped),'bundles')
print('Gallery:',len(frames),'local assets;',len(cards),'downloaded background bundles')
bm=LIB/'bonds-textures.json'
if bm.exists():
 records=json.loads(bm.read_text(encoding='utf-8'));parts=[]
 for category in ['character','word']:
  selected=[r for r in records if r['category']==category]
  parts.append('<h2>'+category+' ('+str(len(selected))+')</h2><section>')
  for r in selected:
   parts.append('<article><h3>'+html.escape(r['name'])+'</h3><img loading="lazy" src="'+html.escape(r['path'],quote=True)+'" alt="'+html.escape(r['name'],quote=True)+'"><code>'+r['bundle']+'</code></article>')
  parts.append('</section>')
 bases=''.join('<article><h3>'+p.stem+'</h3><img src="bonds-layers/'+p.name+'" alt="'+p.stem+'"></article>' for p in (LIB/'bonds-layers').glob('*.png'))
 bp=page[:page.index('<h2>')].replace('<h1>称号素材目录</h1>','<h1>羁绊称号 · 原生分层素材</h1>')
 bp+='<p>这里的角色和字样来自平板的两个独立资源目录，背景/底色/花纹来自APK羁绊称号Prefab。没有抠图或补画。白色底色素材由运行时染色；Prefab示例颜色不代表所有称号配色。</p><h2>背景、底色、花纹与框体</h2><section>'+bases+'</section>'+''.join(parts)
 (LIB/'layers.html').write_text(bp,encoding='utf-8')
 for target in ['index.html','device.html']:
  dest=LIB/target
  text=dest.read_text(encoding='utf-8')
  dest.write_text(text.replace('<h1>称号素材目录</h1>','<h1>称号素材目录</h1><p><a href="layers.html">原生分层素材：独立角色、字样、背景</a></p>'),encoding='utf-8')
 print('Layer gallery:',len(records),'original textures')
