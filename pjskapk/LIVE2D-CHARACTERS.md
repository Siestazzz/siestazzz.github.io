# LIVE2D-CHARACTER / LIVE2D-TALK — 2026-09-20

最新语音补充：四人3条现有台词均接入对应设备原声，覆盖下文旧“没有语音”。按talks.json同条voice配对，首个可见ready及点击播放；切页/换句/静音停止，.4网页gain。铃/连/初音为原partvoice短语音。证据、实现、限制与验证见[LIVE2D-VOICE.md](LIVE2D-VOICE.md)。

## 当前挂载与边界

本轮验证：build与verify-live2d-random.cjs通过；新增6.5秒等待监测parallelMotion，确认不再自动发起Idle/其他动作且原台词保留；四人首帧/淡入/点击/返回/减少动画/失败重试/入口遮罩回归通过。已查看收窄后的桌面截图，未重测游戏UI精确尺寸。

最新：桌面对话框width64%、left18%（原72%/14%），保持中心、字体、padding与移动端48%布局。删除5秒后自动回Idle/normal及returnAt状态，台词动作自然结束，呼吸/眨眼保持；仅点击或页面重新进入启动下一组/开场。初始化隐藏Idle仍保留。该5秒原为网页自设而非游戏数据，现已移除；此条覆盖所有旧5秒描述。

**最新更正**：下文旧“预演成功”结论不成立，框架update只是累加时钟。现改为每步internalModel.update真正求解，清deltaTime，45步基础+45步台词后绘制。淡入已取得游戏方法体证据：ShowCharacter0x4C484D0→FadeOpacity，250ms linear；取代180ms ease-out，且不在入口白遮罩下面提前播放。完整根因、原始RVA/反汇编、网页偏离、测试及实机验证限制见[LIVE2D-REVEAL-AUDIT.md](LIVE2D-REVEAL-AUDIT.md)，以下按历史记录保留。

LIVE2D-REVEAL：模型/台词准备完成后同时180ms ease-out淡入（opacity0→1），只作用viewport/talk；从ready=false再次进入ready=true会重播，后续点击换台词不重播。减少动画直接显示。这是用户要求的网页加载呈现，未找到原游戏淡入时长证据；不暴露预演中的模型默认姿势。

2026-09-20 首屏台词修正（覆盖下文旧初始文案/单阶段预演）：首次显示直接使用talks.json第一条motion、expression、serif。`select`先隐藏预演Idle45帧补齐身体姿势，再通过共用`playTalk`启动台词动作/表情并隐藏预演45帧；每帧16.667ms，共1.5秒模拟时间，不是定时等待。`fit`绘制后ready=true，画布和文字框同时显现；加载中隐藏台词框，失败则显示重试。后续点击从第二条开始，进入/返回均重新开场。可见后5秒回待机。清理parallelMotionManager预约以允许连续台词共享同一表情。这是Web启动调度，原动作路径、path_id、0.5/0.25秒fade不改，不声称为游戏加载算法。

2026-09-20 后续调整（覆盖旧选择栏/姓名/三角/坐标）：删除角色选择栏、台词框姓名与三角；每次阅读页挂载四人等概率随机，不读取旧sessionStorage选角，不保证随机结果必不重复。文字框桌面width72%、left14%、padding17px 20px，移除125px最小高度，窄屏去掉100px最小高度。人物保持原比例，上移8%容器高：桌面y=-38%，窄屏y=-6.5%；标题改READING。初始parallelMotion启动完成后，在隐藏画布中步进45×1/60秒（0.75秒模拟时间，覆盖原0.5秒动作淡入）并绘制后才设ready；非原游戏加载算法。加载期间停止ticker，失败可点立绘/台词重试。原模型/动作/path_id不变；设备高度参考既有live2d-device-live.png，不冒充Unity精确坐标。

本轮测试改用 tools/verify-live2d-random.cjs；旧verify-live2d.cjs依赖已删除的选择栏，仅对应旧交互，不再作为当前回归入口。

LIVE2D-REVEAL验证：构建通过；Chrome回归读取实际CSS Animation并采样0/90/180ms，四角色均满足透明→部分可见→完全可见。原首屏台词/动作及点击回归通过；此验证不是原游戏时间曲线对照。

首屏修正验证：build、verify-live2d-random.cjs、verify-entry-screen.cjs通过。MutationObserver在ready首次揭示时检查四人的talkId/motion/expression/serif与各自首条记录一致，点击后确认切到下一条；同表情连续台词（初音）、返回重载、减少动画、加载失败重试通过。查看一歌/初音ready截图确认显示台词和非默认展臂姿势；参数非默认断言仅为补充，不再独自作为首帧正确的证据。未做游戏逐帧时间匹配。

本轮实际验证：build与新回归通过，控制随机源覆盖四人及返回后重新选角，首个ready帧参数已偏离模型默认值，点击台词配对/renderer复用/单画布/失败点框重试/减少动画通过。桌面首帧和手机截图已目视检查，人物顶部接近READING标题高度；不是游戏坐标数值逐项相等的声明。

阅读首页 `/`、`/live/`、兼容 `/map/` 用真正的 Cubism WebGL 模型替代原 len-standing.webp 图片摇摆。四名角色单人切换：星乃一歌、镜音铃、镜音连、初音未来，均为 `*_normal` 服装。入口 `/entry/` 的合成插画不改变；标题遮罩未结束时不加载 Live2D 库/模型。没有恢复旧地图/大厅。正文与选文页不显示 Live2D，保留之前的背景 Spine 角色（不是同一个系统）。

四按钮选择角色并保存 sessionStorage；点击角色区域或台词框，按序切换该角色三组原动作/表情/日文台词。键盘按钮可用。没有语音，未自行翻译台词。首次文案“点击角色，看看想说的话吧”是博客自制。每次仅保留一个当前模型；切换角色成功后销毁前一个模型和纹理。

## 原始资源证据

设备 `19bd96b8` 包 `com.sega.pjsekai`：`/sdcard/Android/data/com.sega.pjsekai/files/data/<prefix>/<md5(bundle)>`。沿用 `extract_map_assets.fetch/decode` 只读拉取，导出脚本 `export_ichika_live2d.py [ichika|miku|rin|len]`。实际渲染资产位于 `themes/sekai-next/source/game-assets/live2d/<角色>/`。

| 角色 | 原 bundle 后缀（均在 live2d/model/） | MOC TextAsset path_id | Physics TextAsset path_id |
|---|---|---|---|
| 一歌 | 01ichika_normal | -4584627221076030796 | -4809675227882425917 |
| 铃 | 22rin_normal | 6732125377404294541 | -328944596605282747 |
| 连 | 23len_normal | 7464630159336609291 | -6054518466529146956 |
| 初音 | 21miku_normal | -3588211499420891378 | 5825190783553163610 |

每角色 `source.json` 记录原 bundle key/cache/SHA256、所有选中 clip 与 fade MonoBehaviour path_id；`build-source.json` 保留 BuildModelData 的纹理路径和文件名，`motion-inventory.json` 记录原基础动作包清单。MOC 原二进制和 physics/model JSON 从 TextAsset 导出，纹理从原 Texture2D 解码到对应2048目录；没有抠图重做模型。

基础动作包分别 `live2d/motion/{01ichika,21miku,22rin,23len}_motion_base`。用 sssekai 0.8.0 的 AnimationHelper/to_motion3 转换 Unity AnimationClip 曲线，并用原 MOC 中参数/部件名字 CRC32 补充路径映射；未解析 CRC 直接报错，不将数字ID假装正确参数。最初试验的一歌 default01 存在两个未解析CRC，已改用能完整绑定的 pose01，default01 导出草稿不在运行配置中。

例如一歌 w-normal-tilthead06 Clip1439103488540952285 → motions/w-normal-tilthead06.motion3.json；原 FadeInTime/Out 为0.5秒，face 表情对应0.25秒。保留 m_MuscleClip.m_LoopTime，不沿用转换器默认的 Loop=true。无 dump.cs 方法体还原声明。

## 台词配对来源（不是本地原包证据）

`analysis-6.8.1/live2d-audit/systemLive2ds.json` 是社区仓库 `Sekai-World/sekai-master-db-diff/main/systemLive2ds.json` 快照。每角色 `talks.json` 明确记录来源URL与选取规则，保留原id/characterId/unit/serif/motion/expression/publishedAt/closedAt/voice等字段。选择与本地动作包兼容的前三组配对；虚拟歌手只选 piapro。此首版展示存档台词，**未按原季节开放时间、权重和当前账号条件筛选**，不能称游戏当前实际抽取结果。voice字段仅证据，未拉取和播放音频。

网页使用两个 parallelMotion 通道，身体 Motion 和面部 Expression 均从同条talk记录查索引，等待动作接受后更新文字；不拿exp3接口加载面部motion。优先级3以允许再次点击打断。5秒后回到网页选定基础姿势/normal表情，为网页展示调度；连的基础姿势采用 n-normal-nod01，一歌/初音/铃为 w-normal-pose01，不宣称已恢复游戏待机状态机。

## 框架与网页适配

- PixiJS 7.4.3、@sekai-world/pixi-live2d-display-mulmotion 0.5.1：独立 `tools/live2d-deps/package.json` 和 package-lock.json，避免改动现有 Hexo 的 pnpm 依赖树。`tools/prepare-live2d.cjs` 复制发布包到 source/vendor/live2d，保留许可证。
- Cubism Core 从官方 `/sdk-web/core/05/live2dcubismcore.min.js` 获取，本次运行版本整数83951616；精确文件SHA见 vendor/live2d/provenance.json，不使用运行时CDN。Core是独立专有许可，游戏素材也不由MIT授权；详见同目录NOTICE.md。未复制 GPL Viewer 应用源码，自己的加载/交互适配器在 js/live2d-character.js。
- 原physics3由框架求解；实际已确认 internalModel.physics 存在。无鼠标跟随，关闭自动命中和模型自身自动Ticker，独立 app.ticker 每帧只调用一次 model.update。
- 原model JSON的EyeBlink组为空，网页按模型实际 ParamEyeLOpen/ROpen 驱动自动眨眼：周期4.5秒，闭/开各150ms，乘现有开眼量以保留闭眼表情。呼吸ParamBreath周期3.2秒、peak0.5、weight0.5。**这些定时值是网页适配，不是游戏字段。** 原动作/表情曲线仍原样播放；减少动画关闭自动眨眼与常驻渲染。
- 单画布DPR上限1.5、60fps上限、dt上限50ms；原模型保持等比。桌面按min(容器宽/模型宽,容器高/模型高)×2.6，x50%、y=-30%容器高；窄屏乘1.55、y1.5%。角色切换栏和取景大小是博客布局适配。
- 同文档离开阅读页detach画布、停ticker，返回复用模型和renderer。document.hidden/pagehide暂停，pageshow恢复；入口遮罩期间暂停。快速切换使用递增ticket，迟到模型立即销毁；失败给出重试提示，不恢复旧静态图片摇摆。角色点击冷却仅覆盖动作启动请求，不屏蔽后续合法点击。

## 验证与剩余差异

实机截图 live2d-device-live.png / live2d-device-tap.png（当前设备角色为司，不是这四人）用于确认阅读选择页半身立绘、点击与台词框结构；不作为四人动作逐帧验收。截图只留本地。

build通过。verify-live2d.cjs：Chrome1280×800逐个加载四人、点击后参数变化、台词/表情匹配talk记录；阅读→选文暂停→返回同model/renderer、只有一个canvas；模拟hidden事件暂停、快速切换竞争、390×844截图。四人及手机截图已查看。独立诊断确认原physics已加载、存在真实眼睛/呼吸参数。未量测真实设备GPU帧率、未逐帧对齐游戏、未添加声音/自动台词调度/原季节筛选。

最终回归：再次构建后四人/台词/切页/快速切换测试通过；prefers-reduced-motion 下ticker不运行；模拟MOC请求503时显示失败提示，解除故障后点击角色按钮能重试成功。verify-entry-screen.cjs全套入口/提前点击/退出/菜单/手机回归通过。浏览器唯一观察到的404为站点既有favicon.ico，与模型资源无关。没有提交或推送。
