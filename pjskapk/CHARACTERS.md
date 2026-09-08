# 主页活动角色 / HOME-CHARACTERS

2026-09-08，游戏 6.8.1；只实现区域中的骨骼动作和原日文气泡，不进入剧情、商店或角色详情。每个世界先挂载一组原区域动作，**不是完整角色池，也不复现账号当前的随机出场结果**。

## 资源与动作来源

提取程序：`extract_home_characters.py`。设备缓存按逻辑名 MD5 拉取，保存在 `analysis-6.8.1/map-bundles/`；解包使用 `extract_map_assets.decode`。最终运行资源为 `../themes/sekai-next/source/game-assets/characters/`。

- `area_sd/base_model`，SHA256 `526f85671a3e9c8252516cf1e457d02d45b4422087a4e48613b780f578b17bfb`；`sd_main.skel` TextAsset **2649553002027659004**，SkeletonData **3450148420557674355**，原版本 **4.1.23**，defaultMix **0.20000000298 秒**。
- `area_sd/v2_base_model`，SHA256 `9d38d6409aad939354a449f9edc79a1048880b987eb44aef4ffd46d274f55786`；`v2_sd_main.skel` TextAsset **2596513503481095065**，SkeletonData **5822070906608754**。用于当前 area27 的新版角色。
- 单个角色包的 BuildData.skeletonName 为空、textures 指向 `sekai_atlas_Atlas.asset`；不是缺少人物骨骼，而是复用基础模型。各角色目录 `source.json` 保留完整包名、SHA256、TextAsset/Texture2D/BuildData 的 path_id。网页按角色 atlas region 名覆盖基础 atlas；原图集 PMA 保留，未生成或重画人物。
- `actionset/group0` SHA256 `4f83b30243f678986fbabdce5ecb0fa302d6f58b4ae977af34a4878432d3fd8b`；group2 `aff5bb11e49a6321197298537b95c710203cb049cdcb9d2b871b8a83f8183dfe`；group27 `653c2d28e3adab245c3da13610fa373340376af18bdcb4296ef82e48bc388b3a`。

| 世界 | ActionSet / 原脚本 | MonoBehaviour path_id | 原格子坐标和朝向 |
| --- | --- | --- | --- |
| 5 教室 | 18 / as_2_136 | 3667464770222195210 | 咲希 (34,28) 右；一歌 (39,28) 左 |
| 7 舞台 | 294 / as_2_280 | 8997218641624731841 | 实乃理 (42,26) 右；初音 (46,26) 左 |
| 8 街头 | 46 / as_3_134 | -8082630565878291422 | 彰人 (47,27) 右；心羽 (50,26) 右；MEIKO (54,27) 左 |
| 9 游乐园 | 247 / as_2_189 | 1795707601922001694 | 司 (30,25) 右；笑梦 (34,25) 左 |
| 10 无人 | 299 / as_2_128 | 4151623087171653752 | 绘名 (32,28) 右；奏 (37,28) 左 |
| 27 ？？？ | 2725 / as_wl_finale_02_002 | -1644715039948725689 | 铃 (46,28) 左 |

`plans.json` 保存原 `Details.ActionPaths`、`MotionName`、`TickToPlayProgress`、`DurationTick`、`Direction`、`Balloons.Message/DelayTick/ShowTick`，以及原 GridData 的完整 ID/CellSize/Offset。未手写对话。当前选中路径均为 Stay；有待机、说话、倾听、惊讶、喜悦动作，**未接入漫游/寻路和跨脚本同步**。原格子 CellSize=(46,40)，Offset=(0,0)；网页跟随背景 sx/sy 和 pan 换算，不随意改人物站位。

社区 master 仅用于定位动作属于哪个 area、角色与服装的映射，来源 `https://raw.githubusercontent.com/Sekai-World/sekai-master-db-diff/main/` 下 actionSets/character2ds/costume2ds，抓取快照保存在 `analysis-6.8.1/characters-audit/`。不是把在线最新 master 冒充 6.8.1 的本地内容；实际动作、台词、骨骼和图集全部从本机游戏资源取得。Costume2dGroupId=0 的动作在网页固定选择组1，不模拟账号自动服装选择。

## 方法体 → 网页实现

方法体证据是 `analysis-6.8.1/il2cpp-audit/0x<RVA>.asm`，由 `il2cpp_audit.py disasm --address ... --size ...` 生成，非仅引用 dump.cs 签名。

| 原方法 / RVA | 实际指令或字段 | 网页对应 |
| --- | --- | --- |
| CharacterCacheData.LoadResource / 0x6080F68 | 空 SkeletonName 跳过独立骨骼读取，继续读取 atlas | 基础 skel + 每人原 atlas |
| AreaObjectCharacter.BuildSpineModel / 0x6077874 | BuildFromCharacterCacheData 后应用静态 spineCharacterScaleRatio | Skeleton.scaleX/Y 乘0.6，再乘背景投影 |
| AreaObjectCharacter..cctor / 0x607D564 | `0x3F19999A` = 0.60000002384；COLLISION_BOX `0x44341D71` = 720.46002197 | 0.6；气泡锚点使用原碰撞尺寸，而不是贴图 bounds 的透明区域 |
| ConvertCellToCalcPosition / 0x60760AC | x×CellSize.x+Offset.x；y×CellSize.y−Offset.y，另取格子深度 | 原格子映射到同一背景，网页未恢复完整 Unity 透视/深度矩阵 |
| AreaClock..ctor / 0x6053064；TickToTime / 0x604E9B4 | timeSpeed `0x44160000`=600；tick×`0x43960000`=300 | TimeScale=1 时 2 tick/秒；每人按原 TotalTick 循环 |
| UpdateDirectionSideView / 0x607D258 | 正向X或Right=4 → `set_FlipX(true)`；负向X → Left=3、false | **原骨骼默认朝左**，Right=4 才令 scaleX 为负；修正初版反向映射 |
| SpineModel.set_FlipX / 0x4ACF414 | 转发到 Skeleton.set_FlipX | 不是将 Direction=Left 当作负缩放；双人相向，三人前后排保留原方向 |
| ShowDependAreaClock / 0x609F7D4（尾段0x609FBDC） | Size.y×0.75 传入 SetupHUD；get_Size / 0x60771DC 返回碰撞尺寸 | 气泡锚点使用720.46×0.6×0.75，另加 BalloonPositionOffsetY=30，做网页2D投影 |
| AreaTalkBalloon.ShowWords.MoveNext / 0x609F2A4 | rodata VA0x1ED07B8的float=0.07500000298；逐字符 Substring | 原文每0.075秒显示一字；保留全文占位，避免气泡随打字伸缩；减少动画时直接显示全文 |

气泡普通底图按 `AreaTalkBalloon.DefaultImageName = bg_base_r30_wh`，原 Sprite 文件 `0dc323102e63fd84e9976e0a07463cd0` path_id=1，70×70、border=(34,34,34,34)。2026-09-08修正：移除产生亚像素接缝的CSS border-image，`drawSurface`用一个SVG绘制层裁取四个原34×34圆角，显示尺寸由12px增至18px；白色中心/边缘交叉填充与角片重叠1px，避免框内横竖线。圆角仍是原PNG，不是另画轮廓。尾部复用 `balloon_talk_direction`（`146d3866bfb6942dc9f6d0053f0b05a7` path_id=1），网页旋转180°指向人物。详见 `balloon-source.json`。字体原常量32，经背景比例缩放、最小11px为阅读适配；18px角片显示宽度、文本排版和尾部24×16px均是网页适配，不宣称原Unity布局1:1。

## 运行边界与验证

2026-09-08透明度修正：原AreaTalkBalloon prefab `0068713dcb71542b5b0836a70731a030`，CustomImage backgroundButton/path_id23、shadow/25、triangle/26 的Graphic.m_Color（原始序列化偏移44）均为RGBA=(1,1,1,0.9019607901573181)，即alpha=230/255；text/22 的Graphic alpha=1。证据 `analysis-6.8.1/characters-audit/balloon-opacity.json` 含SHA256、完整raw及偏移，由 `inspect_character_balloon.py` 复现。网页 `.character-surface` 与 `::after` 整层opacity使用原值，文字不透明度不变；角片/白底先合成，再整体半透明，避免切片重叠处出现深浅线。shadow节点仅作为证据，本轮未新增阴影层。构建与浏览器computed style确认背景/尾部0.901961、文字1，截图 `balloon-opacity-browser.png`。

- `home-characters.js` 仅首页挂载；同一 WebGL canvas 渲染当前世界人物，骨骼原动画循环，按前后排Y排序。角色在现有道具层之上，**未完整恢复道具与人物交错遮挡/透视深度**。
- 页面隐藏暂停；减少动态效果冻结骨骼插值，但台词时钟继续，定时直接显示完整文字；pagehide 停止 RAF，BFCache 恢复继续，不为返回强制刷新。WebGL 丢失停止渲染，恢复时重新加载页面。
- 2026-09-08移除点击重播/定位脚本的监听器。气泡只按原TickToPlayProgress、DelayTick、ShowTick、TotalTick自动出现、消失、再次出现；点击人物或空白均不改变台词时钟，不触发原Reaction=Scenario。原先的点击重播是已撤销的网页适配，不是原游戏行为。
- 地图进入的白幕等待人物首帧和原场景就绪再撤除；失败允许场景继续，保留原8秒兜底。
- 当前台词的 VoiceId 为空，不制造语音；未实现完整剧情、声音、独立 Emote 特效或游戏账号进度。
- 实际设备游乐园截图 `../pjskapk/analysis-6.8.1/chibi-reference.png`、5秒录屏 `analysis-6.8.1/characters-audit/chibi-motion.mp4`。浏览器验证脚本 `../tools/verify-characters-browser.cjs`：六世界骨骼加载、原台词、计时、方向/FlipX、点击不导航、拖动共用相机、减少动画与无pageerror。截图/结果保存于 `characters-audit/`。不是逐帧完全等价验收。

复现：`npm.cmd run build`；`node tools/verify-characters-browser.cjs`（需本地4100服务）。资源导出：`pjskapk/analysis-tools/Scripts/python.exe pjskapk/extract_home_characters.py`（需ADB设备19bd96b8，或已缓存原bundle）。

气泡修正验证：构建及上述六世界测试通过；新增点击不推进台词时钟断言、教室自然出现→消失→再次出现检查。实际查看更新后的`characters-audit/world5-browser.png`，框内横竖线已消失，圆角加大。本次未重新操作设备，继续使用此前原Sprite/动作数据与设备证据。
