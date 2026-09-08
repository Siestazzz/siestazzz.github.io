"""Repeatable APK layout facts, without treating IL2CPP declarations as method bodies."""
from extract_map_assets import *
import struct
source=ROOT/'analysis-6.8.1/unpacked/assets/bin/Data/1a97dd8c82a0a42729f6cf3ba44aeb0b'
env=UnityPy.load(str(source))
controller=next(o for o in env.objects if o.path_id==1146)
raw=controller.get_raw_data()
radius,x,y=struct.unpack_from('<fff',raw,44)
facts={'source':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'component_path_id':1146,
 'class':controller.read(check_read=False).m_Script.read().m_ClassName,
 'serialized_field_offset':44,'RADIUS':radius,'X_RADIUS_RATE':x,'Y_RADIUS_RATE':y,'raw_hex':raw.hex(),
 'il2cpp':{'PlayListWorldsController.Setup':'0x4D558C8','CalcWorldPositions':'0x4D59324','Next':'0x4D58500','Prev':'0x4D588D4','SelectByIndexAsync':'0x4D577E4'},
 'note':'RVA values identify methods in dump.cs, not decompiled implementation. Browser scaling/depth/timing is separately adapted.'}
(ROOT/'map-layout-metadata.json').write_text(json.dumps(facts,indent=2),encoding='utf-8')
print(facts)
