"""Read serialized Graphic color from the original AreaTalkBalloon prefab."""
import hashlib,json,struct
from extract_map_assets import ROOT,UnityPy
data=ROOT/'analysis-6.8.1/unpacked/assets/bin/Data'
file=data/'0068713dcb71542b5b0836a70731a030'
env=UnityPy.load(str(file))
records=[]
for obj in env.objects:
    if obj.path_id not in [22,23,25,26]:continue
    component=obj.read(check_read=False)
    raw=obj.get_raw_data()
    records.append({'path_id':obj.path_id,'node':component.m_GameObject.read().m_Name,
                    'script':component.m_Script.read().m_Name,'rgba_offset':44,
                    'rgba':struct.unpack_from('<4f',raw,44),'raw':raw.hex()})
out=ROOT/'analysis-6.8.1/characters-audit/balloon-opacity.json'
out.write_text(json.dumps({'file':file.name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),
                          'layout':'MonoBehaviour header 32 bytes, Graphic.m_Material PPtr 12 bytes, Graphic.m_Color RGBA at 44',
                          'components':records},indent=2),encoding='utf-8')
print([(r['node'],r['rgba']) for r in records])
