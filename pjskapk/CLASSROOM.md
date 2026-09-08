# 教室 SEKAI（area5）实现记录

2026-09-08。原数据 + 网页适配，非完整 Unity 播放器。不挂载角色、商店、剧情气泡和区域道具。

## 来源和复查

- 逻辑包 `area/area5`，缓存 `analysis-6.8.1/map-bundles/3689d2eb3badf9bfbfece57278541c68`。
- SHA256 `44af2c7486f40fcde060b8e58b2b407f60760d235c944a2e2df000b5fc5add52`。来自连接设备缓存；目录名 6.8.1 不足以证明所有缓存资源属于此版本。
- `analysis-6.8.1/classroom-audit/objects.json`：原 GameObject / Transform / SpriteRenderer / ParticleSystem / MonoBehaviour 字段与字符串 path_id。
- 设备地图和内部截图：`analysis-6.8.1/classroom-map.png`、`classroom-inside.png`。本次实际进入教室核对，截图包含游戏人物，但网页资源不包含这些人物。
- 重跑：`pjskapk/analysis-tools/Scripts/python.exe pjskapk/export_classroom.py`；`pjskapk/analysis-tools/Scripts/python.exe pjskapk/export_area27_effects.py --area 5`。

## HOME-CLASSROOM：原层级 → 网页坐标

输出目录 `themes/sekai-next/source/game-assets/map/area5/`，`scene.json` 保留每层的完整节点、Sprite 和 Renderer path_id、位置、像素/单位换算后的大小、锚点及 sorting order。

| 原节点（均以 area5/ 开头） | Renderer path_id | 位置 x,y | order |
| --- | --- | --- | --- |
| Background/background | 8272486853535881450 | 0,0 | 10 |
| View/desk1_view/sprite | -541974967047912130 | 159,-1536 | 1536 |
| View/desk2_view/sprite | 928205672004214791 | 2779.40,-1233 | 1233 |
| View/desk3_view/sprite | -265684633956365251 | 3223.70,-1600.20 | 1601 |

背景 Sprite 7603141331213466008，约 3378.1444×1600 单位。Area 控制组件 -7246673203354479985 的 scrollMin=(0,0)、scrollMax=(3378,1600)、defaultPosition=(1750,785)。背景图直接导出 Sprite，不用设备截图，不重画桌椅。miku 占位 Sprite 明确排除。

`home-world.js/startClassroom` 读取 scene.json：按 order 排序；尺寸为 size×scale×背景显示比例；左边 = 背景左边+x×sx−宽×pivotX，顶边 = 背景顶边−y×sy−高×(1−pivotY)。这是 Unity 左上区域、Y 向上到 DOM Y 向下的换算。

网页仍采用既有首页 cover 裁切、110% 高度，拖动上限取 `max(0, floor(min(场景宽×12%, (图片宽−场景宽)/2−1px)))`，**没有照搬游戏 defaultPosition 或完整相机边界**。图片加载、窗口/元素尺寸变化会重新夹紧已有位移，保留1 CSS px的舍入余量，防止缩放后露出底色。桌椅依背景实际矩形更新，缩放、拖动时不脱层；背景不加模糊。所有桌椅处于粒子画布上方，是简化合成顺序，非完整 Unity 深度排序。

## HOME-CLASSROOM-FX：17 组粒子

`effects.json` 的 groups[].path/id 精确对应 ParticleSystem，sources 带包哈希，textures 带原 Texture2D path_id。来自：

- `area5/Background/background/effect1/fx_keion_sekai_tri_01/`；
- `area5/Background/background/effect2/fx_keion_sekai_tri_02/`；
- `area5/Background/background/effect3/fx_keion_sekai_circle_02/`；
- `area5/Background/fx_keion_sekai_light_01/` 和 `fx_keion_sekai_stars_01/`。

输出 5 张原贴图，沿用原 Mesh、颜色/透明度关键帧、寿命、发射率、旋转和 UV 数据。例：tri_02/pt_02_a 的 startSize 随机 6.075–364.5；circle_02/pt_01 随机 25–250；均按 scene 背景比例换算。动态由 `home-effects.js` 共用渲染器驱动；页面隐藏暂停，减少动画模式保留静帧。

限制：当前曲线线性插值，不是 Unity 全套切线算法；不完整模拟 3D 透视、所有 Shape 类型和粒子缩放模式。黑板星点的单位换算与拖尾投影为网页适配，见下方修正记录；不代表所有 17 组都已逐帧还原。

## 2026-09-08 · 粒子与世界切换修正

### 尺寸、密度及发黑原因

- 原 ParticleSystem `-4484558035598598364` 的 `SizeModule.enabled=true`，曲线首值约 0.453983；`-6991735587387441494` 首值约 0.435578。之前漏乘此模块，造成尺寸偏大。现在 `startSize × SizeModule(age/life)`，按原曲线变化，不加统一主观倍率。
- 教室组改按 `1/rate` 发射间隔排布槽位、寿命结束后隐藏；不再把取整后的平均寿命粒子数永久保持在屏幕上。不改原发射率。仍是周期预热近似，不是 Unity 发射随机序列。
- `mat_sekai_02` 的 Shader 引用 `6228555572980372533` 来自依赖 `shader/particles`（缓存 `9d4b915e1050eebe5e8a63cb2a819ad7`），实际名 `Sekai/Particles/Additive`；`rtBlend0` 为 SrcAlpha=5 / One=1，ColorMask=14。旧代码凭材质名是否含 ADD 判断，导致上部变成暗色普通透明三角。
- 现在按 Shader ID 识别加法混合；RGBA 预乘后 RGB 使用 ONE/ONE 累加，不向背景写遮挡 alpha。源 Fragment 为 `texture(_MainTex) * vs_COLOR0`，不自行加亮 RGB。材质名不含 ADD 也正确发光。
- `audit_classroom_fx.py` 保存原 Shader typetree、GLES 程序及 Renderer 到 `classroom-audit/`，可复查 `.json` 的包 SHA256；17 组中 Shader ID 记录到运行 effects.json。

### HOME-CLASSROOM-METEOR

`area5/Background/fx_keion_sekai_stars_01/root/pt_01` / `3795898463928772856`：TrailModule.enabled=true、life=1s、widthOverTrail=0.5、startSpeed=0.2；原 `fx_T_tail_01.png` 与 Additive 材质。pt_02 / `1515076418617680885`、pt_03 / `-259582382718841034` 为闪烁星点。原坐标约(2084,-777/-795)、Circle 半径0.25/0.44/0.13。

网页按 Circle 径向出生方向、原 startSpeed 和寿命绘制流星线带，宽度按原 0.5×粒子尺寸；星点同时使用原尺寸/透明度生命周期。**局部单位到背景单位采用600倍是网页取景校准，不是已恢复游戏常量**；线带尾端淡出为网页简化，未完整模拟 Unity Trail 的所有顶点规则。位置和拖动仍以背景图为参照。

### MAP-ENTER：跨文档切换

- 设备录像 `analysis-6.8.1/world-transition.mp4`、时间序列 `world-transition-frames.jpg`，可用 `inspect_world_transition.py` 重查：点击后世界拉近，青色播放标记出现，碎片与白场覆盖，随后教室从白场显现。
- APK Prefab `f41fb1615e34a444faafcc8ccbf15a05` 的 `PlayMark` / CustomRawImage 32 引用原 Texture2D `btn_play_h264_gn`；`export_world_transition.py` 导出到 `game-assets/map/transition/`，provenance.json 含源文件 SHA256、组件原字节与引用。
- `SekaiTransitionController.FadeIn` RVA `0x60a172c` 实际反汇编尾调用 `ColorFader.Play`，duration 来自参数；`FadeOut` RVA `0x60a2178` 只审计了前段，不能据此宣称恢复完整控制器。记录见 il2cpp-audit 相应 asm。
- `world-transfer.js`：围绕所选按钮950ms拉近2.5倍，1200ms白场覆盖后才导航；首页首帧保持白色、等背景和粒子/树加载，再1000ms显现，失败最长8s后放行。时间和缩放倍率是依录像做的网页适配，不是原游戏常量。
- 使用原播放贴图与原三角贴图；转场三角的排布、色相变化、旋转仍是 CSS 近似，非完整原 UIParticle 模拟。替换了原300ms跳转和未播完的旧map-transfer遮罩。减少动画模式不缩放/漂浮，BFCache返回清除遮罩。

本次浏览器确认上部无原先暗色三角、黑板有星点/流星，点击地图可进入教室且遮罩会清除、控制台无错误。构建及四项回归检查通过。无需变更业务路由。

## 验证

### 2026-09-08 · HOME-CLASSROOM-ITEMS

补入9件静态原区域道具（无角色、无购买/升级交互）：`areaitem/areaitem0501`–`0509`，依次为CD、玩偶、星空图鉴、志步贝斯、初音吉他、巡音贝斯、天体望远镜、四人合照、音箱。原PNG与元数据在 `themes/sekai-next/source/game-assets/map/area5/items.json` 同目录；每项保存原包SHA256、Sprite/Renderer path_id、spawnTransform、原size/pivot/order。完整原对象在 `analysis-6.8.1/classroom-audit/areaitem050*.json`。

定位链：社区日服主数据areaItems的areaId=5 → assetbundleName/spawnPoint（定位线索保存在classroom-audit/master-area-items.json）→ 实际设备缓存areaitem包 → area5原Transform挂点。不是从网站下载道具图片，也没有按截图手摆坐标。复现：`pjskapk/analysis-tools/Scripts/python.exe pjskapk/export_stage_items.py --area 5`；脚本保留旧名称，默认area7兼容原舞台流程。

| 包尾号 / 挂点 | 挂点Transform path_id | 原位置 x,y | 原尺寸 |
| --- | --- | --- | --- |
| 0501 / spawn-point1 | 3881803546576239245 | 1717.30005,-835.79999 | 131×94 |
| 0502 / spawn-point2 | 1160350850142954815 | 672.09998,-834.20001 | 144×80 |
| 0503 / spawn-point3 | -3130006092783963592 | 2226.30005,-841.29999 | 103×104 |
| 0504 / spawn-point4 | 5053319516070978291 | 2674,-1065 | 198×312 |
| 0505 / spawn-point5 | 4888504328043930403 | 2411.80005,-1034 | 190×273 |
| 0506 / spawn-point6 | -6152235756265071288 | 2545,-1049 | 191×301 |
| 0507 / spawn-point7 | -1581527794336647225 | 1986,-832.09998 | 119×143 |
| 0508 / spawn-point8 | 5713371003934451133 | 1378,-843.20001 | 98×50 |
| 0509 / spawn-point9 | 7103044729893405145 | 532.29999,-1108.90002 | 267×199 |

示例：望远镜包SHA256 `43ab17192c123731e9916594ca41715babd58efe7b7812e552f80baa9c7c30bb`，Renderer `4516759715176253063`，Sprite `-7837391513762777256`；原pivot(.5,0)。所有道具局部Transform位移0、缩放1，Renderer order4025。0501–0503的非零pivot.y保留，不统一强行设为0。

网页 `home-world.js/startClassroom` 加载items.json并与scene.json合并，同一个paint投影/MutationObserver使道具随背景一起拖动。教室道具order4025排在三层桌椅之后，沿用静态DOM分层；未恢复Unity运行时相机、角色遮挡与道具排序算法。不修改现有黑板流星、粒子数量或透明度。

实际验证：Hexo构建、verify-classroom/stage/home-pan通过；无头Chrome在1280×720/DPR1/100%缩放进入教室并保存 `analysis-6.8.1/classroom-items-browser.png`，已人工看图。浏览器脚本 `tools/verify-stage-browser.cjs --classroom` 确认9张道具及3张桌椅全部加载、17组粒子运行；1280×720、1920×1080、699×842双端拖动不露底，转场、持久化、HERE与无pageerror通过。本轮未重新录制平板教室；位置依据原数据而非宣称逐帧视觉完全相同。

2026-09-08 拖动覆盖修正：`home-world.js/setPan/reframe` 按背景实际尺寸夹紧，并通过resize、load及ResizeObserver处理旧偏移；适用于教室和？？？共用相机。未换底色掩盖空隙。Chrome当前1276.67px场景、1595.83px背景实测两端±153px，右拖图片左边−6.58px，左拖图片右边1283.25px，均覆盖场景。verify-home-pan对宽/窄/小数尺寸与缩放遗留位移的数学边界检查通过；构建及classroom/area27回归通过。浏览器实测两端拖动，窗口缩放本轮由边界测试覆盖，未另外逐档手动缩放。

### 2026-09-08 · 向上扇形、发射率与背面修正

后续方向分布修正：原 Shape.arc.mode=0 是随机采样，前版网页却只在加载时随机一次并永远循环，少量流星容易固定偏向右侧。当前黑板星点/流星将原扇区按槽位分层，每次出生在各层内重新随机角度和半径；原扇角、旋转、速度、发射率不变。**分层均匀采样是为满足用户“比较平均”的网页适配，不声称原游戏采用分层算法**。本次修复不增加流星数量，不改为固定朝右的方向。

- 流星 `3795898463928772856` 原 `ShapeModule.arc.value=214.039993°`，`m_Rotation.z=-19.23°`；星点 `1515076418617680885`、`-259582382718841034` 为200.399994°/-13.6°。此前出生区域与速度方向均硬编码360°，造成向下射出。现按原扇角取样，并将形状旋转同时用于出生点与速度方向。**是略宽于半圆的上方扇形，不硬改成180°，边缘允许少量低于发射原点**。600倍投影下流星下缘约109区域单位，旧整圆最多330；并非用裁切遮住错误轨迹。
- 上部碎片 `-2723858980962753314` 发射率 mode=3、min=1/max=2；圆斑 `4191182512176923101` 为mode=3、min=0/max=2。以前只导出scalar上限，现保留完整rateCurve，网页周期预热采用区间均值1.5/s、1/s，分别较旧值减25%、50%。其他常量发射率不变。这是随机发射率的均值适配，不等于完整Unity随机发射模拟。
- 原 `Sekai/SekaiEffect` Shader `-1595268760865149387` 的 `m_State.culling.val=2`（Back），原厚三角有18个面；旧WebGL未剔除背面。现在只有该Shader启用BACK/CCW，避免前后面重复alpha合成；Additive Shader的culling=0保持双面。原透明度关键帧不再额外乘人为透明度系数，修复的是合成方式。
- 本次重新读取源objects.json与Shader审计JSON，对照设备 `classroom-compare.png`（用户当前视角靠近黑板）；网页截图确认星点聚集在黑板上方扇区，未见原先直向下的流星。构建、verify-classroom/map/area27及JS语法检查通过；并未逐帧证明全部粒子和游戏完全一致。

Hexo 构建、verify-classroom / verify-map / verify-area27 / verify-home 通过。浏览器实测教室背景加载、3 张桌椅 complete、17 组画布 ready、动画时间推进；横拖 83.88px 时背景与桌椅等量移动。设备进入教室截图对照。人物未实现。地图允许教室及？？？，其余四个保持不可进入。
