# 场景、动画与交互对照手册

更新日期：2026-09-08。对象：Hexo 主题 `sekai-next` 当前本地实现。

这是后续复刻和迭代的总索引；详细提取记录仍保留在 `pjskapk/`。本次根据模板、CSS、JavaScript 和既有分析记录整理，**没有重新录制设备，也不代表所有效果已经逐帧验收**。

**“为什么这样实现”的依据见 [游戏实现证据对照](GAME-IMPLEMENTATION-EVIDENCE.md)**：E01 点击、E02 背景模糊/点阵、E03 手机、E04 首页轮播/按钮、E05 地图布局/Tween、E06 地图粒子、E07 世界树、E08 选文频谱/按钮、E09 好友框体、E10 称号。没有游戏证据的部分单列，不用网页代码反向证明游戏实现。

## 1. 如何读这份文档

每个页面分成五部分：背景场景、静态布局/素材、持续动画、交互/状态、切换与生命周期。不要只按“背景、元素、动画”分工：布局坐标、状态和渲染生命周期是这些部分共同依赖的约定。

来源标记：

- **原始数据**：本地 APK、Prefab、贴图、Mesh、Shader、Spine 或 IL2CPP 中有对应证据。
- **网页适配**：使用原素材/参数，但屏幕投影、尺寸、曲线或触发方式为网页实现。
- **网页自制**：CSS/JS 装饰、博客业务功能，没有对应原游戏实现证据。
- **待核实**：没有拿到足以证明运行时行为的数据，不能用“看起来像”替代证据。

一个效果可以同时包含上述几种来源。原贴图不等于布局、动画、透明度也全部原样还原。

本文路径以仓库根目录为基准。下文简称 `T` = `themes/sekai-next`，`JS` = `T/source/js`，`CSS` = `T/source/css`，`ASSET` = `T/source/game-assets`。

## 2. 场景与入口

### 2026-09-09 · MAP-ENTER 单击进入

按用户要求，sekai-map.js删除首次旋前/再次确认分支；点击开放世界立即busy锁定并调用原world-transfer。箭头和拖动旋转、拖动抑制误点保留，提示仍视觉隐藏但无障碍文字同步为点击进入。覆盖此前所有两次点击的历史记录。属于博客交互适配，原素材/粒子/转场参数不变；见WORLD-TRANSITION.md和E12同日补充。

### 2026-09-09 · NAV-VEIL 连续显隐

用户仍报告live→首页闪烁；整页请求回归为0，但此前首页filter:none且遮罩display:none，与内页保留滤镜的切换不同。sekai-map.css保持blur(0px)终态，refinements.css首页遮罩opacity0替代display:none；滤镜和遮罩均180ms ease-out，减少动画禁用。首页最终无模糊/点阵/暗色，不动原粒子。此为网页合成适配，不能冒充原过场时长；E22/PAGE-ROUTER.md记录验证与限制。

### 2026-09-09 · SELECT-READ / FX-BACK

第三页read-start增加flex-shrink:0，恢复已有215×80px，超高内容继续滚动；原按钮图/52切片不变。导航放行当前世界首页的world查询：此前popstate恢复此地址会误触整页加载，现保留文档/场景/人物canvas。真实换世界仍独立转场。原证据边界及验证见E08、E22和PAGE-ROUTER.md同日记录。

### 2026-09-08 · MAP-LAYOUT / MAP-ENTER 原过场粒子

选择容器整体上移3svh，底部“点击世界转到前方”提示视觉隐藏，双击确认流程不变。MAP-ENTER删除旧CSS教室贴图碎片，改为原AreaTransitioner粒子21/24的渐变图集与出生/大小/透明曲线，配套20/22/25/26闪光。transition-particles.js有限时canvas，跨文档时钟延续、结束/离页清理；白场导航时间由1200改1500ms，其余950ms拉近/1000ms显现/8s加载保护不变。原算法与网页投影差异、原包完整节点、方法体调用及本轮设备/浏览器截图见[WORLD-TRANSITION.md](../pjskapk/WORLD-TRANSITION.md)和E12。覆盖下方旧“CSS近似碎片”的历史描述。

### 2026-09-08 · FX-BACK 历史上级恢复

固定目标不变：正文→选文→阅读入口→首页。page-router.js优先从同源Navigation历史中查找最近的匹配父级路径并traverseTo，不盲目退上一页；带显式查询须匹配，世界标记不同的条目跳过。没有匹配或不支持API时仍软导航。跨文档允许浏览器BFCache复用，同文档仍保留当前场景画布。未改任何动画参数。测试工具此前默认关闭BFCache，本轮移除该测试开关后实际验证persisted=true；细节见PAGE-ROUTER.md / E22。路由脚本增加版本查询便于刷新更新。

### 2026-09-08 · HOME-PAN 原生选择冲突

主页范围user-select:none、图片/链接-webkit-user-drag:none；home-world.js持久body监听只在page-type-index取消dragstart，背景pointerdown排除按钮/链接后preventDefault。避免拖动生成文字选区或图片拖拽影子，保留普通鼠标、平移阈值5px与按钮点击；内页正文仍可选中文字。属于浏览器输入适配，非游戏字段。专题见PAGE-ROUTER.md，证据E22补充。

### 2026-09-08 · NAV-SHELL / FX-BACK

后续性能诊断：导航耗时不等于持续帧率。实测area27粒子CPU回调约14.9ms/帧，暂停粒子后约58→144fps；模糊开关影响小，18次软切换没有测出RAF堆积。原粒子数据不变，瓶颈为home-effects逐面重复旋转/临时数组等网页算法。本轮仅诊断未修复，详细方法、三世界计数和限制见[ANIMATION-PERFORMANCE.md](../pjskapk/ANIMATION-PERFORMANCE.md)。

固定返回不变，普通站内页面改为常驻场景+局部UI导航：保留背景/Spine/点击效果，不重复初始化；main/reader/live/home/friends/jacket按页面作用域初始化和清理。加载期间保留旧内容，120ms .75→1显现，减少动画跳过；顶部2px提示、失败原生回退。地图选择/真正换世界仍独立转场。此条覆盖此前“每页重新启动角色时钟”的普通站内导航描述，刷新/地图换世界依旧重新启动。详见[PAGE-ROUTER.md](../pjskapk/PAGE-ROUTER.md)、E22及NAVIGATION.md；实际循环往返/画布同一性/资源请求与截图已验证。

### 2026-09-08 · FX-BACK

返回改为固定上级场景，正文左栏与左上同步；首页地球不变。具体路由见NAVIGATION.md；原icon_back_wh.png保持，未新增/修改转场动画。删除真实历史拦截代码，键盘或新标签页遵循原生href。此为用户指定博客导航映射，不声称恢复了游戏完整返回栈方法体，证据见E21。

### 2026-09-08 · POST-QUOTE / POST-CODE / POST-NAV

同日POST-CATEGORY-ACCENT：文章顶部装饰线/标题下分割线取对应大类选中图标主色，post.ejs按CTF→Android→漏洞挖掘→逆向工程→AI→其他确定所属大类，配色来自原on贴图采样，正文用途为适配，见E20与READER-PRESENTATION.md。

正文引用块改不透明浅底+青色左边；代码行号自然按位数撑宽、左右11px，语言标签取Hexo生成class；长代码默认最多16行并限55svh，支持展开全文/收起，短代码隐藏按钮。文末导航英文12px、标题18px。修正2篇3处裸链接吞句。均为博客适配，不属于原游戏效果；源码、状态、参数和真实验证见[READER-PRESENTATION.md](../pjskapk/READER-PRESENTATION.md)与证据E20。

### 2026-09-08 · LIVE-CARDS横向留白 / LIVE-SCALE

`live-menu.js`保留上一版统一倍率s，新增设计宽`(手机宽/s+800)/2 px`；`live-menu.css`应用该宽度，使两个卡片到手机两侧的留白各减半，文字大小及卡片高度不变。背景LIVE移至right9%，不缩放文字，避免伸出屏幕。此条覆盖此前固定800px内容宽，属于用户要求的网页适配；证据边界和验证见E19及[SCENE-PROJECTION.md](../pjskapk/SCENE-PROJECTION.md)。

### 2026-09-08 · HOME-CHARACTERS / HOME-CHARACTER-BALLOON

六个主页世界新增一组原区域角色（2/2/3/2/2/1人），原Spine 4.1骨骼与各自atlas、原ActionSet待机/说话/倾听/惊讶/喜悦、日文台词和逐字气泡；只展示，不进剧情。原格子位置、Direction、0.6缩放、2tick/秒、0.2秒混合、0.075秒逐字均有资源/方法体依据。默认朝左，Right=4才FlipX：双人两侧相向，街头两人朝MEIKO，非背对背。详情及限制见 [CHARACTERS.md](../pjskapk/CHARACTERS.md)，证据E18。此前各世界记录的“不挂载人物”为当时范围，本条更新当前状态；游乐园机器人/人偶服依然是独立道具。

挂载 `JS/home-characters.js`、`CSS/home-characters.css`、`ASSET/characters/plans.json`，只加载当前世界图集。与背景共用pan/sx/sy；前后排按原Y排序，未恢复完整道具遮挡/透视、漫游/账号随机角色。隐藏页暂停、减少动画时骨骼静止且定时展示全文、BFCache恢复、WebGL失败回退。台词仅按原脚本自动循环，点击不再重播或跳转。MAP-ENTER增加等待人物首帧，保留8秒上限。六世界实际浏览器验证原文、动作计时、FlipX、拖动、点击不跳转与减少动画；设备截图/录屏及浏览器截图在characters-audit，详见E18。

气泡后续修正：原bg_base_r30_wh四个34px角片以18px显示（原网页12px），SVG单层裁切原PNG并填充原白色中心，移除CSS border-image内部接缝。18px显示尺寸与1px重叠为网页适配。自动循环检查覆盖出现→消失→再次出现，点击不推进台词时钟。

透明度恢复：按原AreaTalkBalloon的CustomImage23/26颜色alpha=230/255，对已合成背景及尾部设置opacity≈0.901961，文字保留alpha1。证据balloon-opacity.json及E18；自动循环、相向站位不变。

| 场景 ID | 页面 | 当前背景与布局 | 功能边界 |
| --- | --- | --- | --- |
| SC-HOME | `/` 主页 | area 27 树与云、area 5 教室或 area 7 舞台/灯光/前景/粒子；均不模糊，保留主页 UI | 精选文章、随机一篇、阅读入口、FRIENDS、GitHub、地球 |
| SC-MAP | `/map/` 选择世界 | 独立 `bg_sekai.png` 背景、三组 Mesh 粒子、环形星球 | 六个世界均可选择；无现实世界/记忆碎片/活动角色/子区域 |
| SC-LIVE | `/live/` 阅读入口（第二页） | 街景模糊，手机和两个入口 | READING 进入文章选择；SOLO LIVE 音游尚未实现 |
| SC-SEARCH | `/search/` 文章选择（第三页） | 较强街景模糊；分类、搜索、文章列表、手机预览 | 分类/检索/选择/开始阅读/随机选择；非真实音乐播放 |
| SC-POST | 文章永久链接 | 较强街景模糊；正文自然整页滚动，右侧章节目录 | 顶栏随滚动隐藏/恢复；代码高亮与溢出滚动 |
| SC-FRIENDS | `/friends/` | 街景模糊；好友列表、排序、称号和前往按钮 | 不实现游戏好友详情；网址和称号只展示，外链由“前往”触发 |
| SC-OTHER | `/archives/`、`/categories/`、`/tags/`、`/about/` 等 | 共用街景模糊和基础主题布局 | 博客档案、分类、标签、个人介绍；不视为已完整复刻游戏场景 |

主要关系：`主页 → 地图 → 主页（切换背景）`；`主页 → 阅读入口 → 文章选择 → 正文`；`主页 → 精选/随机 → 正文`；`主页 → 友链 → 外部网站`。更多路径见 [NAVIGATION.md](../NAVIGATION.md)。

**当前支持 area 5 / 7 / 8 / 9 / 10 / 27。** `sekai-home-world` 存储选择，除地图选择页外，各页首帧前读取并挂载同一当前世界的背景/粒子/角色，不再使用旧area1街景。主页不模糊，普通内页CSS blur4px、选文/正文8px（网页合成适配，旧street-blur原卷积通路不运行），原点阵/暗度保留。上表“街景模糊”的历史描述由本条当前世界背景替代。旧 `/map/?area=27` 回到 `/`。

HOME-PROJECTION：背景统一`s=max(1.25W/Cw,1.1H/Ch)`，纵向居中，消除原固定高度+min-width导致的横纵倍率不同；人物及物品保持原比例、原挂点与共同pan。LIVE-SCALE：手机外框继续可拉伸，800×720内容改统一min倍率、水平居中。具体来源/适配边界与测试见[SCENE-PROJECTION.md](../pjskapk/SCENE-PROJECTION.md) / E19。

### 2026-09-08 · 三世界并行交付

新增 `HOME-STREET` / `HOME-STREET-FX`（area8：1背景+10道具、18粒子），`HOME-WONDERLAND` / `HOME-WONDERLAND-FX` / `HOME-WONDERLAND-TWEEN`（area9：11场景图层+9道具、28粒子含2云、2个原TweenPosition），`HOME-EMPTY` / `HOME-EMPTY-FX`（area10：3场景层+8道具、15粒子）。原数据/完整ID/提取命令见 [AREA8.md](../pjskapk/AREA8.md)、[AREA9.md](../pjskapk/AREA9.md)、[AREA10.md](../pjskapk/AREA10.md)，证据索引E15–E17。

三个子agent独占世界目录，主agent独占设备输入、截图、共享代码、构建和浏览器；具体 [协作约定](MAP-AGENT-WORKFLOW.md)。共享 `home-world.js` 读取groundFile/coordinateSize/webLayer；scene.sekaiProjection把所有道具/特效绑定同一拖动。`home-effects.js` 对新世界使用显式webUnits/webUnitScale换算局部发射器；area9的云独立于设施层但仍共用相机，保留原UV/shape/velocity，木马和气球浮动用独立area9-motion.js。MAP-ENTER增加等待所有场景图片解码，超时回退仍8秒。

2026-09-08主agent实际进入三个游戏区域，截图world8/9/10-reference.png，另录world9-motion.mp4；逐一查看1280×720/DPR1浏览器world8/9/10-browser.png。三世界均通过地图进入、图片加载、动画计时、1280×720/1920×1080/699×842两端拖动、HERE/持久化与无pageerror检查；教室/舞台浏览器回归通过。未恢复完整Unity相机、多层视差、加权粒子曲线或逐帧随机序列；不能称全部动画1:1。游乐园机器人和人偶服是原静态道具，不是活动角色。

### 2026-09-08 · 舞台新增记录

`HOME-STAGE`：原 area7 背景、两张灯光叠层、前景，加9张区域道具。主舞台绿光/四叶草/屏幕来自areaitem0707，在原spawn-point7(2041,-912)合成；初版遗漏该层已补。基础排序10/11/100粒子/1600前景，道具背/前景分层明确为网页适配；同一背景投影与拖动上限，不引入角色。`HOME-STAGE-FX`：20组粒子与5张原图集；自定义混合通道、三维尺寸、聚光灯角速度积分和发射时间轴。沿用 MAP-ENTER 和减少动画/隐藏暂停/WebGL恢复。原数据与600局部投影适配的边界、节点ID和验证见 [STAGE.md](../pjskapk/STAGE.md) / E13。地图开放7，返回主页仍使用同套博客UI。

### 2026-09-08 · 教室新增记录

`HOME-CLASSROOM-ITEMS`：补入areaitem0501–0509九件原静态道具，按area5 spawn-point1–9的位置与Sprite尺寸/pivot挂载；与桌椅共用背景投影和拖动，不加角色、不改粒子。具体包SHA256/Transform/Renderer证据见CLASSROOM.md新条目及E14。浏览器实测9图加载、宽窄拖动/转场/持久化/HERE通过。

新增 `HOME-CLASSROOM`（背景和三层桌椅）、`HOME-CLASSROOM-FX`（17 组原粒子数据）。来源/完整节点与 ID/坐标换算/未还原部分见 [CLASSROOM.md](../pjskapk/CLASSROOM.md) 和证据表 E11。首页根据选择加载 area5 或 area27；不挂载人物。沿用首页拖动及粒子隐藏暂停/减少动画生命周期。地图和导航同步开放教室。构建及 verify-classroom、verify-map、verify-area27、verify-home 已通过，设备教室和浏览器实际检查；星点缩放/拖尾仍未完整对应。

## 3. 代码装配规则

2026-09-08 HOME-PAN覆盖修正：上限为原12%操作范围与图片实际横向余量的较小值，另留1px舍入余量；resize/load/ResizeObserver重新收紧旧偏移，避免背景露青。保留背景、桌椅、粒子共用位移。游戏scrollMax仍是原区域依据，网页夹紧公式属于响应式适配；实测双端拖动和verify-home-pan通过，详见CLASSROOM.md。

黑板方向分布补充：HOME-CLASSROOM-METEOR 不再循环复用加载时的少量随机角度。每次出生在原扇区的分层区间内重新采样，避免长期偏向右上；这是均匀分布的网页适配，原arc.mode仍为随机模式。具体见CLASSROOM.md。

2026-09-08 三次修正：HOME-CLASSROOM-METEOR 恢复原214.04°/-19.23°扇角及旋转，星点为200.4°/-13.6°；不再360°散射。HOME-CLASSROOM-FX随机发射率改用完整区间均值（上部1.5/s、圆斑1/s），厚三角按原Shader Cull Back剔除背面，修复密度及重复透明叠加。具体原节点、ID、换算和验证见 CLASSROOM.md 最新记录/E11。保留原alpha曲线，未盲调全部透明度。

2026-09-08 二次修正：`HOME-CLASSROOM-FX` 接入原 SizeModule 与 Shader-ID 加法混合，修复偏大及上部暗色；按原发射间隔和寿命隐藏结束粒子。新增 `HOME-CLASSROOM-METEOR`（原星点/TrailModule，局部投影600为适配）。`MAP-ENTER` 改为原播放标记、星球拉近、白场加载、主页显现，移除旧map-transfer；首帧加载、超时、减少动画和BFCache清理由 `world-transfer.js` 管理。详见 E11/E12 和 CLASSROOM.md；原图/原模块与网页转场时间、CSS近似已区分。构建、回归检查及浏览器点击通过。

入口：[layout.ejs](../themes/sekai-next/layout/layout.ejs)。

- 基础 CSS 顺序：`style.css`（源文件 `style.styl`）→ `game.css` → `refinements.css`，之后还有页面专用 CSS。查参数时必须看覆盖后的最终规则。
- 首页挂载 `_partial/home-world.ejs`；其他页面挂载 `_partial/street.ejs`。地图再用 CSS 隐藏共用 `.world-backdrop`，显示自己的地图背景。
- 全局脚本：`tap-mesh.js`、`effects.js`、`street-pan.js`、`street-blur.js`、`main.js`、`jacket-blur.js`。它们通过 DOM 判断是否工作，不代表每页都有全部效果。
- 页面脚本：首页 `home.js`、`home-world.js` 和 Spine runtime；地图 `sekai-map.js`、`map-particles.js`；阅读入口 `live-menu.js`；友链 `friends.js`；正文 `reader.js`。文章选择逻辑仍在 `main.js`。
- 应修改主题源文件，不手改 Hexo 的 `public/` 产物。

## 4. 全局效果与切换

`UI-CURSOR`最终选择：用户要求鼠标始终为普通箭头，不切换其他形状。全站cursor:default!important覆盖pointer/grab/grabbing/text等；继续隐藏扩展的合成指示箭头。输入插入光标和键盘焦点不受影响。此项为用户指定网页行为，不是原游戏数据。

2026-09-08 `UI-CURSOR`纠正：用户要去掉固定黑箭头，而非系统鼠标。已撤销cursor:none，恢复各元素原生光标；只对Codex扩展注入的 `#codex-agent-overlay-root` 使用display:none。保留点击圈/碎片、键盘焦点和输入插入光标。实查Chrome扩展content-scripts/codex.js中的同名宿主和images/cursor-chat.png引用；这是开发工具指示层处理，不是游戏数据。外部扩展DOM ID未来可能变化。

| 效果 ID | 触发/表现 | 当前值与实现 | 来源、限制 |
| --- | --- | --- | --- |
| FX-TAP-RING | 指针按下，包括空白区域 | `effects.js` + `refinements.css`；单张 4×4 序列贴图；圈约 72px，原粒子生命 0.5s | 原始圈贴图中已含青/白环，不是两个独立 CSS 圈；屏幕大小为网页校准 |
| FX-TAP-MESH | 同次点击向外散开、有厚度与渐变的碎片 | `tap-mesh.js`；两组 8+7 个；生命 0.1–0.7s / 0.2–0.7s；三轴初始倾斜、Z 自转 0.2617994rad/s；网页约 10–22px | 复用原 Mesh、材质贴图和 Shader 逻辑；屏幕尺寸/投影/运动映射仍属适配；无 WebGL 回退 CSS 碎片 |
| FX-AMBIENT | 共用环境漂浮装饰 | `effects.js` 创建 24 个 CSS 图形；周期 12–20s、错开延迟；尺寸部分为 65px，其余 8–26px | 网页自制，区别于地图 Mesh 粒子；实际可见性还受页面遮挡影响 |
| FX-MENU | 菜单开关、遮罩、焦点切换 | `main.js` + 基础 CSS；支持 Escape、焦点管理、aria/inert | 博客适配菜单，不应称为完整原游戏菜单 |
| FX-NAV | 同站链接退出反馈 | `main.js`：添加 `page-leaving`，167ms 后 `location.assign`；pageshow 清除状态 | **仍是整页导航，不是 SPA/PJAX**，不能保证不存在空白；修饰键、锚点、外链等另行处理 |
| FX-BACK | 返回按钮 | 正文→选文→阅读入口→首页；地图/友链等回首页；分类/标签详情回总览 | 固定href；最近匹配历史父级优先traverseTo恢复，否则软导航；不退到无关来路。网页适配 |

点击证据与完整路径见 [TAP-EFFECT.md](../pjskapk/TAP-EFFECT.md)：Prefab `e5cd519baaf464685bf5e0a5bcc4d162` / `fx_Tap_single`，提取脚本 `pjskapk/inspect_tap_effect.py`。不要把普通 CSS 环境三角形当成点击碎片来调。

## 5. 背景与模糊是两套系统

### FX-SCENE-BLUR：整页街景模糊

实现：`JS/street-blur.js`、`CSS/refinements.css`、`layout/_partial/street.ejs`。证据：[IL2CPP.md](../pjskapk/IL2CPP.md)。

- 首页不使用该街景，也不加模糊。地图使用自己的背景，不显示这层街景。
- 其他普通页 `distance = 1.5`；文章选择和正文 `distance = 3`。
- 使用 UIEffect 双 pass 核；成对采样偏移/权重为 `0.65 / 0.204`、`2.43 / 0.198`、`4.37 / 0.098`。
- 半分辨率离屏绘制、DPR 上限 2；偏移换算基于完整相机尺寸，不能把 `distance` 当成 CSS `blur(px)`。
- 网格/点纹和压暗由 CSS 叠层控制，包含 `bg_common_ptn_dot_s` / `bg_common_ptn_dot_l`。模糊、白色光斑、遮罩透明度是不同变量。
- Shader/参数有原始证据，但 **1.5 和 3 对应这些网页页面的分配属于当前适配，不能直接声称是游戏逐页运行时的实测值**。
- 图片加载、窗口改变和场景样式改变会重绘；无 WebGL 时保留原背景。

### FX-JACKET-BLUR：手机内封面模糊

实现：[jacket-blur.js](../themes/sekai-next/source/js/jacket-blur.js) + `CSS/refinements.css`。

- 使用原 `UIGaussianBlur` 十字方向单 pass 核，**不是整页模糊的双 pass**。
- 先取封面中央正方形缩为 256×256，再计算；原采样位置 `±8.4 / ±5.6 / ±2.8 / 0`，权重见代码。
- 当前按用户要求只取原采样半径的 **35%**；这是明确的网页调小，不是原版数值。
- 下部变实心的观感由 CSS 渐变叠层形成，不只是统一降低图片透明度。
- 选中文章更新封面 `src` 后重新绘制；失败/跨域污染/WebGL 不可用时保留普通图片。

## 6. 主页动画

| 效果 ID | 当前行为/参数 | 实现与原版对应 |
| --- | --- | --- |
| HOME-TREE | 循环 `wish_tree_common_idle_01`；点击树区域播放 `wish_tree_common_sway_01` 后恢复 idle | `home-world.js`；`ASSET/map/sd_world_link_wish_tree.{skel,atlas,png}` 原 Spine 动画；不是完整 Unity 场景渲染 |
| HOME-PAN | 拖动背景水平平移，超过 5px 视作拖动；范围约 ±12% 视口宽；避开链接/按钮，拖后抑制点击 | `home-world.js`；网页输入和相机映射 |
| HOME-CLOUD | 15个实际云节点、两张2×4原图集；按节点位置、缩放、生命/速度绘制；随背景拖动 | `home-effects.js` + `map/area27/effects.json`；原节点数据，屏幕尺度为适配；旧95s整图平移已移除 |
| HOME-MOTES | 6组上下层碎片/尘粒，含原20–35尺寸的大Mesh碎片 | `home-effects.js`；原Mesh、材质、粒子主要参数，替换旧28个CSS三角；完整Unity模拟尚未完成 |
| HOME-TREE-FX | 6组独立idle柔光/闪点/碎片，跟随Spine投影及拖动 | `wish_tree_ppr_idle` 原粒子；`PlayTreeEffect`原生方法确认独立挂载及Y=480偏移；渲染尺度适配，sway粒子未接 |
| HOME-FEATURED | 优先 `featured: true` 最多 5 篇，否则最新 3 篇；每 3s 切换，位移过渡 0.2s；圆点/方向键/滑动切换，首尾克隆衔接 | `home.js` + `home.css`；原 PageChanger 的 3s / 0.2s 有证据，线性曲线及文章内容是适配 |
| HOME-BUTTON | GACHA / READING 悬停、聚焦、按下微变色；进入 0.1s、退出 0.4s | `home.css`；原按钮素材及 TapEffect 色值依据见 HOME.md；鼠标 hover/focus 是网页扩展 |
| HOME-GACHA | 从文章路径抽取一篇，尽量避免连续重复，然后导航 | `home.js`；没有虚构抽卡角色/抽卡演出，不是游戏完整 Gacha |

精选轮播没有暂停按钮，但悬停、聚焦、隐藏页面和减少动态效果偏好会暂停自动轮播。主页原按钮尺寸、Sprite 九宫格、字体裁切等见 [HOME.md](../pjskapk/HOME.md)、[home-banner-metadata.json](../pjskapk/home-banner-metadata.json)。GitHub 图标为官方 Primer Octicons，属于来源例外，不是游戏素材。

旧 `street-pan.js` 还在全局加载，但它需要 `.street-scene` 和 `.game-home` 才绑定主页拖动；现主页用 `home-world.js`，不要再修改旧拖动来调整新主页。

上述三项新增详细证据见 [AREA27-EFFECTS.md](../pjskapk/AREA27-EFFECTS.md)。首页同时隐藏旧全局CSS环境飘粒，避免与area27原效果叠加；其他页不受影响。

## 7. 地图选择动画

实现：`layout/sekai-map.ejs`、`JS/sekai-map.js`、`JS/map-particles.js`、`CSS/sekai-map.css`。

| 效果 ID | 当前行为/参数 | 证据与适配边界 |
| --- | --- | --- |
| MAP-ORBIT | 五个外围世界，箭头每次转 72°；100ms 角度插值后重新算椭圆；拖动后吸附 | 布局 radius 345、scaleX 1.85、scaleY 0.85 来自数据；1920×1080 网页基准、中心与透视缩放为适配 |
| MAP-BOB | 星球贴图上下正弦浮动，名牌不跟着漂 | IL2CPP Update `sin(angle / 180 × π) × 15`、每帧角度 +1；网页按 60Hz 换为约 6s 周期，个体相位为适配 |
| MAP-GLOW | 星球 `_eff.png` 透明度 0↔0.75；2s 单程、4s 往返 | TweenAlpha path_id 1278；原贴图 + CSS 线性 ping-pong |
| MAP-ARROW | 左右原箭头水平往返，±10 设计单位，0.75s 单程 | TweenPosition 1067/1331；`btn_arrow_switching_wh.png`，右箭头旋转 180°；ease-in-out 为网页近似 |
| MAP-HERE | HERE 标识轻摆，1s 单程 | 原旋转 0→-5°，网页坐标映射为 +5°；标牌外观仍有 CSS 绘制 |
| MAP-PARTICLES | 背景三组有厚度、光照渐变、透明度生命周期的 Mesh 碎片 | 原 WorldMapPlayListBG、`sekai_PT_05` Mesh 30 顶点/18 面、Shader 和材质；WebGL 投影/发射区域为适配 |
| MAP-SELECT | 第一次点世界仅选中，环上世界沿最短角度旋到正前方；第二次点同一世界才进入 | 原环形布局/72°间隔沿用；两步行为依据用户指出的游戏交互，focused/rotating网页状态机；中央？？？不旋转但也需确认 |
| MAP-ENTER | 选中并旋转完成后，再点同一世界启动拉近/白场转场，等待场景就绪后显现 | world-transfer.js，当前时间和加载保护见E12；已替代旧300ms过场 |

粒子关键值：

- `particle1`：发射率 2/s、尺寸 0.01–0.05、轨道 Z -0.2。
- `particle2`：发射率 1/s、尺寸 0.005–0.02、轨道 Z -0.3。
- `particle3`：发射率 2/s、尺寸 0.01–0.06、轨道 Z -0.08。
- 初始三轴随机朝向；`separateAxes = false`，自转实际取 Z 轴约 0.08726646rad/s，不取未启用的 X/Y 值。
- 五关键帧透明度、生命周期、2×2 贴图格与材质完整值以 `motion-particles.json` / `motion-runtime.json` 为准。
- 深度测试和背面剔除开启；视口外也分布粒子。当前发射区域和相机换算不是完整 Unity 场景搬运。

来源入口：[MAP.md](../pjskapk/MAP.md)、[map-layout-metadata.json](../pjskapk/map-layout-metadata.json)、[motion-particles.json](../themes/sekai-next/source/game-assets/map/motion-particles.json)、[motion-runtime.json](../themes/sekai-next/source/game-assets/map/motion-runtime.json)。提取/审计脚本：`pjskapk/export_map_motion.py`、`pjskapk/audit_map_motion.py`。Prefab：`6b1761911113a413584e12b882e29c34`。

注意 `sekai-map.css` 里残留 `world-float` keyframes、旧 `.sekai-inside` 等样式，不等于现页面仍在使用；当前星球浮动由 JS 的 `--world-bob` 驱动。

## 8. 阅读、文章和友链

| 效果 ID | 当前表现 | 对应代码/边界 |
| --- | --- | --- |
| LIVE-SCALE | 手机可改变宽高比，内部两卡片和标题保持等比，放大8% | `live-menu.js`：800×720基准，统一1.08×min(手机宽×0.8/800,手机高×0.4/720)，水平居中、top12%；ResizeObserver更新 |
| LIVE-CARDS | 开始阅读/单人演奏；背景英文READING/SOLO LIVE；hover/按下反馈 | `live-menu.css`；0.12s过渡；图标沿用 `ASSET/sekai-ctf/`；背景英文改为SekaiRodin描边文字，不再挂载原CHALLENGES/SCOREBOARD ghost SVG；博客适配文案 |
| LIVE-SPECTRUM | READING LIVE 旁柱条跳动 | `refinements.css` 的 `spectrum-bounce`；网页 CSS 示意，无真实音频分析 |
| SEARCH-SELECT | 选中行显示高透明框、封面换为六柱频谱，手机更新摘要/封面 | `main.js` + `refinements.css`；频谱周期 `0.45 + bar×0.07`s、负延迟错开；没有完整原游戏频谱时间线证据 |
| SEARCH-FILTER | 全部 + CTF、Android、漏洞挖掘、逆向工程、AI、其他；搜索后重建列表 | `main.js`；分类图标有 on/off 原素材，业务分类为博客适配；重建列表不是动画排序 |
| SEARCH-DIAMONDS | 五个彩色菱形 | `icon_allPerfect.png` 重复五次，是静态原贴图，不是五段评分动画 |
| POST-NAV | 下滚隐藏顶部文章数/阅读量，上滚恢复 | `reader.js`：滚动超过 100px 后，方向累计 12px 触发；顶部、菜单打开、顶栏获焦时显示；CSS 0.22s |
| POST-TOC | 右侧章节定位与当前章节高亮 | `reader.js`：平滑滚动，减少动态效果时直接定位；原生正文滚动，非固定内部滚动框 |
| FRIENDS-STATE | 好友/交换信息页签、行选择、键盘操作、排序 | `friends.js` + `friends.css`；名称/加入两种顺序，升降序箭头 180°/0.167s；行/前往反馈 0.12s；无动画重排 |
| FRIENDS-HONOR | 名称下最多三个称号槽位 | 原主/副边框、底纹 + 当前纯色 `#77eedd` 底和博客文字；静态组合，不假称为游戏成就或已拆出普通称号人物背景 |

友链尺寸/色值/边框引用见 [FRIENDS.md](../pjskapk/FRIENDS.md)、[friend-layout-metadata.json](../pjskapk/friend-layout-metadata.json)。称号来源、已找到/未找到的分层范围、设备缓存和预览库见 [HONORS.md](../pjskapk/HONORS.md)。

阅读量为当前浏览器的本地演示计数，不是在线全站统计。正文高亮由 Hexo 生成；图片/正文等博客排版不属于原游戏 UI 原样复刻。

## 9. 动画生命周期与待核实项

- 全局点击尊重减少动态效果偏好；隐藏页清除点击残留、暂停环境飘粒。
- 主页 Spine 隐藏时跳过绘制；其 RAF 调度并不等于彻底销毁。减少动态效果时不继续推进动画状态。
- 地图粒子在隐藏时停止 RAF；减少动态效果时绘制静帧；星球 JS 浮动也有相应处理。
- **地图 CSS 箭头、光晕、HERE 当前未在 reduced-motion 规则里全部停用**；不要声称全站动态无障碍已完备。
- 复刻精度仍需验证：地图相机/发射器投影、完整 Unity 场景光效、Tween 原插值曲线、跨页转场。
- 只有页面样式中存在某条动画，不足以证明当前 DOM 使用它；记录时检查模板挂载、最终 CSS 和实际触发。

## 10. 素材与原始证据查找顺序

1. 当前模板/JS/CSS：确认页面实际引用什么。
2. `ASSET` 各目录 `provenance.json`：对应导出的图片、原包、path_id、尺寸/切片边界。另有 `rank-provenance.json`、`clear-provenance.json` 等专项文件。
3. `pjskapk/*-metadata.json` 与专题 Markdown：查 Prefab 层级、数值和提取方法。
4. 原 APK 解包目录 `pjskapk/analysis-6.8.1/unpacked/assets/bin/Data` 与 IL2CPP `pjskapk/analysis-6.8.1/il2cpp-dump/dump.cs`。
5. 设备截图/录像验证运行时状态；设备缓存版本不应仅凭解析器回退版本判定。

分析入口：[ANALYSIS.md](../pjskapk/ANALYSIS.md)、[IL2CPP.md](../pjskapk/IL2CPP.md)。普通称号成品图可能含不可分离的文字/人物；已找到的羁绊分层不能推广到所有普通称号。

## 11. 验证方法

在仓库根目录运行（本机使用 npm.cmd，不依赖 pnpm）：

```powershell
npm.cmd run build
npm.cmd run server -- --port 4100
```

按改动范围选用已有检查脚本，先阅读依赖和断言再运行：

- `tools/verify-home.cjs`、`tools/verify-map.cjs`：主页、地图产物结构和资源。
- `tools/verify-area27.cjs`：云/大碎片/树闪光数据、Renderer生效模式和主页挂载。
- `tools/verify-live.cjs`、`tools/verify-friends.cjs`：阅读入口、友链。
- `tools/verify-reader.cjs`、`tools/verify-reader-scroll.cjs`：正文相关检查。
- `tools/verify-local-posts.cjs`：导入内容相关检查。

这些脚本不替代实机/浏览器视觉比对。每次视觉验收记录：视口宽高、DPR、缩放比例、页面状态、设备画面、截图/录像路径，以及已确认/仍有差异的项目。特别检查连续循环、点击空白、拖动后误触、窗口缩放、返回、隐藏再显示及减少动态效果。

## 12. 后续更新约定

每完成一个新场景/效果，或修改已有素材、参数、布局和交互，**在同一次交付中更新本手册**：

1. 沿用现有 ID；新效果添加稳定 ID，不因改名重复建档。
2. 更新实际行为、参数单位、触发状态、负责文件和来源证据。
   同时维护 `GAME-IMPLEMENTATION-EVIDENCE.md`：给出包/节点/path_id 或方法RVA、原字段/算法、证据文件和网页映射理由；没有原始实现依据时明确记录缺口。
3. 分别标注原始数据、网页适配、待核实，保留用户要求的偏离（例如封面 35% 半径）。
4. 原始证据较多时更新相应 `pjskapk/*.md` / 元数据，本手册只保留索引和关键结论。
5. 路由变化同时更新 `NAVIGATION.md`；移除的效果注明替代项，不把死代码记为现有功能。
6. 记录真实执行的验证及剩余差异；不能以构建成功替代动画验收。未核实的保持待核实。

新条目模板：

```text
ID / 场景 / 状态：
触发与结束条件：
图层与坐标系：
素材路径与原始证据（包、path_id、组件/方法）：
参数（原始值 / 网页值 / 单位）：
实现文件：
响应式、隐藏页、减少动态效果、失败回退：
验证日期、方式、截图或录像：
已知差异 / 下一步：
```

### 更新记录

| 日期 | 范围 | 变更与验证 |
| --- | --- | --- |
| 2026-09-08 | LIVE-SCALE / LIVE-CARDS | 两卡片统一等比放大8%，入口改“开始阅读”，背景英文READING/SOLO LIVE；保留原路由与未开放音游状态 |
| 2026-09-08 | HOME-PROJECTION / LIVE-SCALE / SCENE-WORLD-SYNC | 修复宽屏人物/物品/手机内容压扁；内页共用当前SEKAI背景，保留模糊层级；六世界四视口、七类页面与手机矩阵回归，详情E19 |
| 2026-09-08 | HOME-CHARACTER-BALLOON 透明度 | 从原Prefab颜色核对背景/尾部alpha230/255、文字1；合成后整体应用，构建、浏览器样式与截图验证 |
| 2026-09-08 | HOME-CHARACTER-BALLOON 修正 | 角片12→18px；SVG合成原四角/白底消除框内接缝；删除点击重播，原脚本自动循环。构建、六世界浏览器回归、点击不推进时钟、教室出现→消失→再出现检查通过，实际截图确认无横竖接缝 |
| 2026-09-08 | HOME-CHARACTERS / HOME-CHARACTER-BALLOON | 六世界原角色、动作、日文逐字气泡；按原站位及朝向，修复Right/FlipX反向；构建与浏览器加载/台词/朝向/拖动/点击不导航/减少动画检查，来源与适配限制见E18/CHARACTERS.md |
| 2026-09-08 | HOME-STREET / HOME-WONDERLAND / HOME-EMPTY | 三agent独占资源并行、root独占设备与集成；新增三世界原图/道具/粒子/Tween，六入口开放，实际游戏截图和三视口浏览器验收完成；E15–E17及专题文档保留适配限制 |
| 2026-09-08 | HOME-CLASSROOM-ITEMS | 原9件教室道具与挂点接入；构建及classroom/stage/home-pan回归通过，1280×720截图与三个视口下的浏览器加载/拖动/导航检查通过；原数据及适配边界见E14 |
| 2026-09-08 | HOME-STAGE / HOME-STAGE-FX / SC-MAP | 开放舞台；4张原场景+9张原道具，补绿色四叶草主舞台，20组原粒子。设备截图及1280×720浏览器检查，宽窄拖动/转场/持久化/HERE检查与相关回归通过；数值投影与曲线适配见E13 |
| 2026-09-08 | HOME-CLOUD / HOME-MOTES / HOME-TREE-FX | 从设备场景与独立树光效包导出27组，补云/大碎片/树闪光；1280×720浏览器确认渲染、拖动150px后云与背景同步、无控制台错误；构建及area27/home/map检查通过。仍保留投影/曲线/速度模拟适配边界 |
| 2026-09-08 | 初始盘点及证据对照 | 按当前源码和既有分析建立场景/效果索引及 E01–E10 游戏证据链，明确来源、适配值、旧代码与未完成范围；检查文档本地链接；本次仅整理文档，未重新执行游戏视觉验收 |
