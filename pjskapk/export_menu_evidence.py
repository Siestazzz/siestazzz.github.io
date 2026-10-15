from pathlib import Path
import json,shutil,UnityPy
root=Path(__file__).parent/'analysis-6.8.1'
out=Path(__file__).parent.parent/'themes/sekai-next/source/game-assets/menu'
out.mkdir(exist_ok=True)
index=json.loads((root/'export-index.json').read_text(encoding='utf8'))
names=['btn_menu_profile','btn_menu_characterArchive','btn_menu_mylist','bg_base_menu','icon_menu_profile','icon_menu_collection','icon_menu_text']
assets=[x for x in index if x.get('name') in names]
for x in assets:shutil.copyfile(root/x['output'],out/(x['name']+'.png'))
env=UnityPy.load(str(root/'unpacked/assets/bin/Data/dead2c85644b14045bcd265cf80918c6'))
nodes=[]
for ob in env.objects:
 if ob.type.name not in ['RectTransform','MonoBehaviour']:continue
 try:d=ob.read_typetree()
 except Exception:d={'raw':ob.get_raw_data().hex()}
 name='';path=''
 try:
  go=ob.read().m_GameObject.read();name=go.m_Name
  tr=next(c.component.read() for c in go.m_Component if c.component.type.name=='RectTransform')
  path=name
  while tr.m_Father.m_PathID:
   tr=tr.m_Father.read();path=tr.m_GameObject.read().m_Name+'/'+path
 except Exception:pass
 nodes.append({'id':ob.path_id,'type':ob.type.name,'name':name,'path':path,'data':d})
(out/'provenance.json').write_text(json.dumps({'prefab':'dead2c85644b14045bcd265cf80918c6','assets':assets,'nodes':nodes},ensure_ascii=False,indent=2),encoding='utf8')
print('exported',len(nodes),'nodes',len(assets),'assets')
