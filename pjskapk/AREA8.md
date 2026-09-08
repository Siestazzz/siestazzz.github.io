# STREET SEKAI / area8 场景数据包

2026-09-08。范围是咖啡街头主页背景，不加角色、商店交互、对话、道路跳转；主页功能与地图入口由主 agent 统一接入。

## 来源与证据

- 原逻辑包 `area/area8`，缓存 `analysis-6.8.1/map-bundles/72d3d07a229f5dae5b7ce0f3c98e5841`，SHA256 `198263e7827cc629c299c14b1a10256079ff8ec0251609e81e3cd79ac0e75c8f`。
- `analysis-6.8.1/area8-audit/objects.json` 保存 GameObject、Transform、SpriteRenderer、ParticleSystem、MonoBehaviour、AnimationClip 的原 typetree；`renderers.json` 保存粒子渲染器。64位 path_id 在运行元数据中转为字符串，避免 JS 精度损失。
- `area8-audit/6228555572980372533.{json,glsl.txt}` / `-1595268760865149387.{json,glsl.txt}` 保存 shader 包及原 GLES 代码。JSON 自带源包 SHA256。
- 主 agent 实际进入设备咖啡街头并采集 `analysis-6.8.1/world8-reference.png`，本 agent 已看图核对背景、涂鸦、海报、DJ、话筒、CD堆、咖啡磨、音箱与灯光位置。未把截图作为网页背景，不把截图中的初音角色挂载。
- 目录名6.8.1和UnityPy fallback版本均不能独立证明缓存版本；这是实际设备缓存内容。

## HOME-STREET：静态场景和道具

运行目录 `themes/sekai-next/source/game-assets/map/area8/`。

`scene.json` 接口：`groundFile="bg.png"`、`coordinateSize=[3378.144396322671,1600.0000314614213]`；`sprites` 保留原文件、position、scale、size、pivot、order、Renderer/Sprite ID及完整路径。背景应按groundFile识别，不要把同一Sprite重复挂成前景。

背景节点 `area8/Background/background`，Renderer `-886002802204957162`，Sprite `-6128862185610540869`，position(0,0)，pivot(0,1)，order0。原资源只有1张基础背景，不虚构舞台的light1/light2或前景层。

AreaDataController `-4995832909970931675`：scrollMin(0,0)、scrollMax(3378,1600)、defaultPosition(1689,785)、BaseLineY1141、ScaleRev.0017000000225。网页cover/拖动边界仍属响应式适配，不把默认相机当成已复原。

`items.json` 含10个原Sprite：

| bundle / 挂点 | 内容（主数据名称） | position x,y | size |
| --- | --- | --- | --- |
| areaitem0801 / 1 | カフェの看板 | 212,-1174 | 332×226 |
| areaitem0802 / 2 | 古びたDJセット | 1162.19995,-875 | 243×114 |
| areaitem0803 / 3 | 謙さんのCD | 646,-940 | 155×97 |
| areaitem0804 / 4 | ２本のマイク | 1062,-915 | 120×44 |
| areaitem0805 / 5 | カフェのハンドベル | 798,-805.90002 | 39×77 |
| areaitem0806 / 6 | レンのヘッドフォン | 491.29999,-971.20001 | 93×80 |
| areaitem0807 / 7 | コーヒーミル | 1027,-782 | 59×75 |
| areaitem0808 / 8 | 『RAD WEEKEND』のフライヤー | 2573,-833 | 205×233 |
| areaitem0809 / 9 | グラフィティ | 2067,-840 | 399×270 |
| areaitem0810 / 10 | ミュージックスピーカー | 1417.09998,-905.59998 | 161×127 |

证据链：社区主数据仅用于定位 areaId8 → bundle/spawnPoint（`area8-audit/master-area-items.json`保存URL及记录）→ 设备原areaitem包 → area8 Transform挂点 → Sprite原尺寸/pivot。不是从社区下载图片。每个包SHA256、完整 `areaitem08xx/root/sprite` 路径、Renderer、Sprite、spawnTransform均在items.json；原组件保存在 `area8-audit/areaitem08xx.json`。新增缓存只写本世界 `area8-audit/bundles`，不修改共享缓存。

所有道具pivot(.5,0)，order4025；`webLayer="front"` 是现阶段静态合成策略，不等于已恢复Unity动态深度排序。按原挂点随背景一起投影：left=background.left+x×sx−width×pivotX，top=background.top−y×sy−height×(1−pivotY)。不加CSS染色、阴影或人为光晕。

## HOME-STREET-FX：18组原粒子

`effects.json` 为共用home-effects.js数据契约，18个group、4张Texture2D：`tex_ui_common_03.png`、`tex_sekai_aura_01.png`、`tex_sekai_01.png`、`tex_common_02.png`。纹理来自原包，Mesh/UV/法线来自原渲染器，未重画。

| 原节点（area8/Background/前缀） | 示例 ParticleSystem ID | 原字段 |
| --- | --- | --- |
| fx_lamp/lamp_01…05 | -7458014952931632731 | size常量.2，life随机.5–1.5s，rate2/s，duration1s；暖黄色startColor(1,.852228,.514151,.501961)，alpha 0→1→0 |
| 各lamp下/bg_light | 6138946506213814322 | size常量.3，life1s，rate0，0s burst1，duration1s，单独底光 |
| fx_area_light/pt_dust_01 | -5426470822149326201 | size .09–.1，life5–10s，rate5/s，Box5.38×2.56，XY速度各±.05 |
| fx_area_light | 7322117296358963166 | size1–6，life5–10s，rate1/s，startColor.mode4随机渐变，alpha峰值.274509817 |
| background/sekai_ef/pt_tri_01 | -4994239075538485091 | 原厚三角Mesh30顶点，size13.5–40，life5–10s，rate4/s，speed110 |
| background/sekai_ef/pt_tri_02、03 | 3933132000735369785 / 3439535218546215594 | size10–15 / 3–6，rate2/s / 1/s，speed55 |
| background/sekai_ef/pt_tri_2line_01、02、03 | 4740189116358249621 / -854567094089973186 / 5061011142850012274 | size7.35–30 / 12.5–25 / 5.6–10.5，rate1/2/1每秒 |

18组均原sortingOrder100。Shader `6228555572980372533` 为 `Sekai/Particles/Additive`，原SrcAlpha/One、Cull Off；12组灯/尘/区域光为加法。六组三角使用 `Sekai/SekaiEffect` ID `-1595268760865149387`，SrcAlpha/OneMinusSrcAlpha、Cull Back、_LightTex与_LightVector，不能换成平面CSS透明三角。

**坐标尺度是显式网页适配**：六组三角原尺寸已为区域量级，`webUnits=1`；灯、底光、区域光的归一化四顶点mesh，以及虽是billboard却使用局部Box/速度的小尘粒，设`webUnits=600`。沿用既有局部粒子投影标定，不声称600是原游戏常量。倍数用于粒子size、shape局部偏移与velocity，不再乘原挂点position。特别不能只按mesh顶点数分类，否则尘粒会挤成不可见一点。片元使用原alpha曲线，不能另外统一压透明度或放大。

`Take 001` AnimationClip `71823977615303516` 只有常量旋转，stopTime .0416666679，无position/float/rotation曲线、无Animator；没有证据将其当成店招摇摆。持续效果来自上述ParticleSystem，不额外编造Spine/灯架动画。

## 边界、生命周期与验证

数据准备完成；主 agent 统一接入home-world.js/home-effects.js、地图可进入状态、持久化、转场与全局文档。目标沿用隐藏暂停、减少动画静帧、WebGL恢复以及拖动跟随；本独立数据包没有注册第二个输入处理器、RAF或浏览器控制进程。

网页曲线仍线性插值、发射随机序列和相机并非完整Unity模拟，Shape旋转/透视等最终支持程度以主渲染器为准；不能声称逐帧一致。

复现：

```powershell
& pjskapk/analysis-tools/Scripts/python.exe pjskapk/export_area8_scene.py
& pjskapk/analysis-tools/Scripts/python.exe pjskapk/export_area8_items.py
& pjskapk/analysis-tools/Scripts/python.exe pjskapk/export_area8_effects.py
& pjskapk/analysis-tools/Scripts/python.exe pjskapk/export_area8_audit.py
node tools/verify-area8.cjs
```

已执行四个提取程序和verify-area8：背景/10道具/18组/4图集存在，source SHA256匹配，原模块尺寸寿命duration一致、挂点/Renderer存在、不包含角色。已人工看原背景和主 agent 提供的设备截图。为避免控制竞争，本 agent 未操作设备input、截图、浏览器、Hexo构建/服务；浏览器运行/拖动/转场检查交由主 agent 合并后执行并写入总文档。未提交、推送、部署。
