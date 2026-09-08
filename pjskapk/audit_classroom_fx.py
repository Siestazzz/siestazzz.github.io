"""Preserve source shaders and particle renderer settings for reproducible fixes."""
from extract_map_assets import *
from UnityPy.helpers import CompressionHelper
import re
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--area',type=int,choices=[5,7],default=5);area=parser.parse_args().area
dest=ROOT/('analysis-6.8.1/'+('classroom' if area==5 else 'stage')+'-audit');dest.mkdir(exist_ok=True)
for key in ['area/area'+str(area),'shader/particles']:
 p=fetch(key);e=UnityPy.load(decode(p.read_bytes()))
 for o in e.objects:
  if o.type.name!='Shader' or o.path_id not in [-1595268760865149387,6228555572980372533,6140383380374060507]:continue
  s=o.read();stem=str(o.path_id)
  (dest/(stem+'.json')).write_text(json.dumps({'source':key,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'data':o.read_typetree()},indent=2),encoding='utf8')
  for i,platform in enumerate(s.platforms):
   if platform!=9:continue
   offset=s.offsets[i][0];raw=CompressionHelper.decompress_lz4(bytes(s.compressedBlob)[offset:offset+s.compressedLengths[i][0]],s.decompressedLengths[i][0])
   (dest/(stem+'.glsl.txt')).write_text('\n'.join(x.decode() for x in re.findall(rb'[\x09\x0a\x0d\x20-\x7e]{30,}',raw)),encoding='utf8')
e=UnityPy.load(decode(fetch('area/area'+str(area)).read_bytes()))
(dest/'renderers.json').write_text(json.dumps([{'id':str(o.path_id),'data':o.read_typetree()} for o in e.objects if o.type.name=='ParticleSystemRenderer'],indent=2),encoding='utf8')
