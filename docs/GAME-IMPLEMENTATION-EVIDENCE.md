# 游戏实现 → 网页实现：证据对照

## 2026-10-16 · POST-COVER-OFF / BLOG-STATS-30S

用户明确要求停用文章封面以降低加载开销，移除列表/手机预览/旧大厅精选图片与封面模糊模块挂载，移除所有封面fallback，不影响正文图片和游戏背景。原封面文件保留本地供恢复，Hexo exclude和Git ignore防止生成/发布。列表继续已有CSS频谱：未选中animation:none/scaleY(.35)/opacity .45，选中原动画/opacity1；这是网页适配，不是新恢复的游戏字段。文件/生命周期见总索引同日条目。
statistics.js阅读前台累计5000→30000ms，其他去重和Worker不变，本次无需重新部署Worker。verify-statistics-browser.cjs用浏览器虚拟时钟验证29s不计数、30s计数及软导航清理。未在正式统计中写测试记录。

验证已完成：Hexo clean/build通过；verify-statistics-browser通过29s/30s、卸载、去重、本机禁用；verify-statistics本地SQLite回归通过；verify-no-covers确认search.json无cover字段、生成目录无封面文件、选文DOM和网络均不请求封面、切换文章正常。已实际查看1440×900和390×844截图，原列表/手机结构保留且无封面空图片；截图在忽略目录backups/verification。git diff --check通过。提交目标当前codex/game-menu，不合并main，因此不触发仅监听main的Pages工作流。

## 2026-10-15 · BLOG-STATS：博客统计，不属于游戏复刻

### 防护升级（本日后续，覆盖下方早期安装/验证状态）

交付结果：正式Worker版本`7983fbde-44aa-4845-a696-36505747f72d`已部署；保留原compatibility_date=2026-10-13、preview_urls=false、原observability日志设置以及全部原绑定/密钥。新增Cron `17 3 * * *`。正式接口实际验证10篇文章、cache HIT（含任意query）、CORS拒绝、未知文章404；只发无效写请求，无正式计数写入，D1复查visits=0/reads=0/receipts=0。真实接受事件、去重和两种429均在独立测试库验证，停写开关也已云端验证。测试Worker当前STATS_WRITES_ENABLED=false，库保留visits=1/reads=1用于复测。正式未做压力测试、未模拟真实浏览器新版本博客上报，未部署博客/提交GitHub。数据库schema未迁移；本轮只更新后端和文档，无需Hexo重建。

首次正式部署因读取Cloudflare metadata超时失败，使用本机代理重试成功；Wrangler报告服务分组tags未应用（不影响接口/绑定）。中间部署默认日志/preview设置与原云端不同，随即在最终配置显式恢复，以上最终版本为准。回滚可用 `wrangler rollback ad5e8a8d-f7f0-4012-8909-9dc286e95bbb --config workers/statistics/wrangler.jsonc`（只在确有需要时执行，旧版无本轮防护）；Cron等独立设置需对照备份单独核对。

- `worker.mjs`在D1前调用READ_LIMITER/WRITE_LIMITER；正式120/60次每60秒，测试30/12次每60秒。IP经日粒度HMAC生成限流key，不写数据库；共享IP可能误限，分布式/IP轮换仍能绕过。绑定限流仅节点级近似限制，不作为计费硬上限，也不能消除Worker请求用量。
- GET `/stats`在Cache API缓存60s；固定内部路径`/__statistics_snapshot_v2`不含任意query；缓存不含CORS头、错误不缓存。先验证Origin/限流，命中后按请求重新加CORS。允许数字延迟，不在写事件后删除缓存，避免恶意写请求击穿缓存。
- `STATS_WRITES_ENABLED`仅字符串`true`开启；`false`返回503 `writes_disabled`，数据库不写、查询照常。没有READ/WRITE绑定或密钥时fail-closed 503。SQL去重/触发器不变；保留旧KV `VIEWS`、全部正式数据与旧rate_limits表。
- 正式配置`workers/statistics/wrangler.jsonc`已填真实DB、KV绑定；ALLOWED_ORIGINS和STATS_SECRET沿用现有云端Secrets，不读取/打印或更换。新增开关为普通变量，keep_vars=true保留控制台变量。Cron每日UTC03:17；此前云端schedules为空，需要本次部署补齐。
- 独立测试配置`wrangler.test.jsonc`，Worker和D1均名`siestablog-stats-test`，不绑定正式库；测试用独立随机Secret。生产前备份`backups/cloudflare/20261015-235452`含Worker multipart、绑定、部署版本、Cron、表结构及总数/文章快照；目录被Git忽略，无OAuth token入库。升级前版本`ad5e8a8d-f7f0-4012-8909-9dc286e95bbb`。
- 验证工具：`verify-statistics.mjs`新增限流/停写零DB访问、cache-buster无法绕缓存、CORS不串用；本地SQLite全部通过。`verify-statistics-remote.mjs`默认仅写测试Worker，`--production`只查询和发送被拒绝的无效事件，不新增正式阅读；`--disabled`验证停写。已在真实测试D1确认visits=1/reads=1、重复事件去重、查询/上报429和cache HIT，旧限流表行数0。
- 运行远程HTTP测试时本机Node直连workers.dev超时，改为本机系统代理127.0.0.1:7890与Node `--use-env-proxy`，没有改变全局代理设置。
- 官方依据：[Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)、[Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/)。全部属于博客后端工程，无新增游戏实现来源。

停写操作：Worker Settings → Variables → STATS_WRITES_ENABLED改false并部署；恢复true。CLI等价：`wrangler deploy --config workers/statistics/wrangler.jsonc --var STATS_WRITES_ENABLED:false`。注意以后普通CLI部署会按配置文件true恢复，长期暂停时也需修改配置。未实施Turnstile、WAF或预算告警，不宣称完全防刷。

阅读/访问计数是网页自制业务，无游戏Prefab、path_id或RVA对应。5000ms阅读阈值、1800s去重窗口、请求限额是博客策略，不冒称游戏字段。视图仍使用原统计框，不改其素材/动画。实际实现和状态边界见总索引 BLOG-STATS。

### Cloudflare Dashboard 安装（现有 Worker，不需要换网址）

1. 已创建 D1 `siestablog`，在 Worker 绑定中确认变量名是 `DB`；旧KV `VIEWS`保留，代码不会读写它。
2. 在该D1数据库的Console执行 `workers/statistics/setup.sql` 的完整内容。文件由 `node tools/statistics-seed.cjs` 从构建后的10篇文章生成；所有CREATE IF NOT EXISTS/INSERT OR IGNORE可重跑，不会清零现有数据。
3. 将 `workers/statistics/worker.mjs` 全文粘贴到 Worker 编辑器替换旧代码。
4. Worker设置 → Variables and Secrets：添加文本 `ALLOWED_ORIGINS` = `https://siestazzz.github.io`；添加Secret `STATS_SECRET`，值用密码管理器生成至少32字节随机值，不放主题配置、不发到聊天。多个域名用英文逗号分隔。更换Secret会让旧去重记录失效，但不清零统计。
5. 设置Cron Trigger `17 3 * * *`（UTC每天03:17）用于清理临时记录，保存并部署Worker。Dashboard部署不需要本地wrangler文件中的database_id；CLI部署才需填真实ID，不能直接部署占位配置。
6. 浏览器打开 `https://siestablog.2259670306-11c.workers.dev/stats`，应返回JSON visits、reads、articles。新库为0；503请核查DB绑定/建表。然后从正式博客验证POST请求；本机localhost故意不计数。GET成功不代表POST/Secret/CORS已经验证。
7. 发布新文章：固定front matter `stats_id`（英文小写/数字/连字符，≤120字符）；运行 `npm.cmd run build`、`node tools/statistics-seed.cjs`，在D1执行更新后的 `articles.sql`。改标题/日期不得改ID。当前快照最多500篇，达到上限前改分页方案。删除文章不自动删除历史统计。

维护文件：`worker.mjs`接口、`schema.sql`结构、`articles.sql`白名单、`setup.sql`合并安装SQL；后两者是生成文件。主题配置 `statistics.endpoint/origin` 对应正式域名。不导入旧KV或本地mock值。免费额度包括索引/触发器/限流的行写入，并非一次访问只写一行；公开接口需要上线后观察用量、防刷规则。

验证边界：`tools/verify-statistics.mjs` 使用本地SQLite和D1形状适配器验证SQL/接口，并非远程D1测试；`tools/verify-statistics-browser.cjs` 使用Chromium隔离fixture与模拟接口验证前端计时/卸载/去重，本机预览不发送统计。远程绑定与正式域名联调仍待用户部署后执行。

2026-10-13 PROFILE/SEARCH/POST-COVER：资料文案/字号/统计项与搜索圆角、浅底属用户要求的博客UI适配，非恢复游戏参数；放大镜继续原icon_search_h34_wh.png。#139d91取当前网页ONLINE颜色，不冒称游戏原色。封面WebP为用户壁纸的体积优化，不属于游戏资源证据，原图与来源保留。

2026-10-13复制提示/文章封面：移除复制成功文字、3篇demo，10篇封面改用用户本地壁纸，来源映射source/images/post-covers/sources.json。属于博客内容配置，无新游戏数据来源；不以这些壁纸作为游戏原素材证据。原渲染/动画逻辑不变，本轮依用户要求只构建不截图。

2026-10-13友链文案精简：原NoneInfo白字/半透明Outline材质的网页适配移用于“友链示意”h2；删除用户指定说明文字。原path_id/颜色证据不变，标题字号与3px描边仍为网页值。验证与文件见FRIENDS.md最新记录。

2026-10-13 FRIENDS-EMPTY-TEXT：e826a636f6cfb4d87bec3fbd81243737 CustomTextMesh245 / NoneInfo（WORD_MISSING_ADD_FRIEND）→字体a3006a04bcc9ee4499918d8b6e934230 MonoBehaviour3、材质f462a70057e82454c82159c935ac584b Material1→_FaceColor白、_OutlineColor#44446680、SDF _OutlineWidth=.5→friends.css白字/同色描边。3px网页描边不是SDF .5直接换算；中文回退与680px卡片均博客适配。详见FRIENDS.md。

## 2026-10-13 · FRIENDS-EXCHANGE 圆角证据

e826a636f6cfb4d87bec3fbd81243737 / ScreenLayerFriend/ComponentRoot/ComponentRoot/ApprovalPendingFriendList/UIPartsGroupVerticalListView/Background → CustomImage → 09ce39af28da6034fbd6cbc9707b80b8 Sprite1 bg_base_r20_wh → friends/provenance.json及设备friend-add-20261013.png → friends.css `.friends-exchange`12px裁切。原圆角底板仍复用九宫格，12px是网页适配，不宣称游戏方法参数。pointer、description和隐藏称号为博客业务变更，无新增游戏实现断言。构建及verify-friends-update.cjs通过；详见FRIENDS.md。

2026-09-20 WELCOME TO对齐微调：left4%桌面/6%手机，按用户E对齐S要求适配博客文字；非游戏坐标。原Sprite设计证据与其他参数不变。

2026-09-20 WELCOME TO左移：.title-logo-kicker left19%→16%，为用户要求的网页偏移，原logo_all/Sprite2设计证据不变；无新增游戏字段或动画结论。

## ENTRY-TITLE-LOGO：WELCOME TO · 2026-09-20 重绘

Prefab188c6d7b97278b04d85321e2ae62cb9d SpriteRenderer96 / logo_all → a7728392fc4670f48a36f2c83876ca7b Sprite2（525×210）→本地title-original-logo.png → welcome-to.svg及.title-logo-kicker。原图证明几何字/白底片的设计结构，不证明网页字形、颜色和百分比为游戏参数；新英文手绘矢量属于网页自制。细节与验证见TITLE-ENTRY.md最新条目。

2026-09-20 ENTRY-TITLE-EXIT / SEARCH-HOVER：按用户要求删除网页自制“正在进入…”状态文字及搜索外框hover色；保留原入口动画资源和搜索按钮变色。无新增游戏字段结论。verify-entry-search-feedback.cjs通过，改动仅entry-screen.js及refinements.css。

## LIVE2D-VOICE / 标签反馈 / WELCOME TO · 2026-09-20

SYSTEM_LIVE2D_VOICE_BUNDLE_NAME路径常量→既有systemLive2ds台词的assetbundleName/voice→设备ACB TextAsset→vgmstream同名Cue→本地ogg→live2d-character.js同条台词调用site-audio.js播放。完整节点path_id、包hash、子流与采样信息见[LIVE2D-VOICE.md](../pjskapk/LIVE2D-VOICE.md)及voice-sources.json。不把常量当方法体，不把partvoice当全字幕配音。Gain .4、预载/取消竞争为网页适配。WELCOME TO和选文hover属于博客文案/交互适配，无新增游戏字段证据。

## ROOT-ENTRY · 2026-09-20

根入口→`/live/`是用户要求的网页URL映射，无对应Unity路径或新游戏字段。ENTRY-TITLE视频/Logo/退出粒子及E26音频证据不变；仅layout.ejs入口条件及默认上级、entry-screen.js目标、page-router.js入口排除列表变化。不声称网页地址来自游戏。验证及状态见TITLE-ENTRY.md最新补充。

## TAXONOMY-HOVER / PROFILE-AVATAR · 2026-09-20

本轮无新增游戏字段/方法结论。分类队标沿用既有原Sprite；hover的150ms、青色及分类25%混白为网页反馈，不是Unity参数。post.ejs分类链接读取Hexo category.path，使用既有软路由。头像来自用户指定GitHub URL，与游戏资源无关。文件、数值、来源及验证详见[TAXONOMY-UI.md](../pjskapk/TAXONOMY-UI.md)。

更新：2026-09-08。与 [场景/效果总索引](SCENES-AND-MOTION.md) 配套。

本文回答的是“为什么这样写”，而不仅是“现在有什么”。路径均相对仓库根目录。记录中的游戏 RVA 针对已分析的本地 6.8.1 ARM64 库；设备缓存资源单独按包哈希追踪，不据此推定缓存版本。完整哈希与元数据还原信息见 [IL2CPP.md](../pjskapk/IL2CPP.md)。

## 证据要求

### E26 · BGM与交互音效

静音/专用入口音最新证据：设备split_UnityDataAssetPack.apk/assets/MenuCommon_Built_in.acb → vgmstream子流20 SE_TITLE_ENTER → audio/SE_TITLE_ENTER.ogg与manifest.json → site-audio.js入口click分支；SoundDefine.SE_TITLE_START常量作名称交叉定位，不当原触发方法体。BGM静音改GainNode=0、源持续，恢复.112；页面初始化尝试播放，自动播放限制保留。增益/浏览器生命周期为网页适配，完整原文件hash及验证见BLOG-AUDIO.md。

用户位置/音量覆盖：按钮改右下、增益均为前版40%（BGM .112、普通SE .12、滚动 .064），非原游戏音量字段；原素材、采样循环点、提取证据不变。site-audio.css/js与BLOG-AUDIO.md记录。

musicSoundTracks社区master id101/103 → 设备mysekai/sound/bgm/music0001/0002 TextAsset → ACB/HCA采样循环点 → audio-audit/sources.json、game-assets/audio/manifest.json → site-audio.js AudioBufferSource循环。MenuCommon TextAsset6456530718845575496 → 子流130/128/30 → 确认/返回/选文滚动；SoundDefine常量仅名称定位，不当方法体或完整Cue解码证据。按钮原vs_on Sprite2dbf7d013f50eb347b0f774190034db9/path_id1复用。完整源缓存/hash/参数、old2返回音效边界、网页时序与真实验证见[BLOG-AUDIO.md](../pjskapk/BLOG-AUDIO.md)。

分类队标尺寸补充：`.category-unit-icon`52→64px、原列内居中；仍复用下文六张原Sprite。按用户要求放大约23%，不是原游戏尺寸变更；来源链不变，验证见SYSTEM-MENU.md。

分类队标更新：game-assets/provenance.json记录六张icon_tab_unit_*_on原Sprite path_id1 → categories.ejs按CTF/Android/漏洞挖掘/逆向工程/AI/其他映射vs/ln/mj/vb/ws/25 → refinements.css `.category-unit-icon`52px contain。原素材直接复用，分类业务映射/尺寸为网页适配；完整源文件哈希见SYSTEM-MENU.md。不再显示之前的编号圆底。

2026-09-20 E23/分类配色适配更新：原MenuDialog 904宽RectTransform证据保持（SYSTEM-MENU.md），网页按用户要求进一步改39vw/max750/min380、手机86vw，不视为原游戏尺寸。categories.ejs编号底色改选文六个unit图标对应的既有配色，与post.ejs categoryPalette一致；分类名称与颜色映射为博客业务适配，非游戏原分类。原图标/菜单动画没有改动，详见SYSTEM-MENU.md最新记录。

### 2026-09-20 · E24补充：实际标题电影

最终循环媒体兼容修复：浏览器自然播放结束后的事件日志确认HTTP媒体定位7.533秒却回到0，仅seeked等待未解决；entry-screen.js改fetch一次MP4并创建Blob ObjectURL，循环在同一数据内定位226帧，退出abort/revoke。浏览器兼容策略和约10.7MB首播缓冲成本明确区分原游戏实现，详见TITLE-MOVIE-AUDIT.md最新记录。

最新循环时序：原loopPointFrame226及Seek→PrepareForRendering方法证据不变；网页entry-screen.js改ended→设置currentTime→seeked→play，标签恢复也避免在seeking时play。该事件门控属于浏览器异步定位适配，不声称是新增恢复的原游戏方法；不重新加载背景资源，避免回零播放入场。验证记录见TITLE-MOVIE-AUDIT.md。

最新用户排版覆盖：撤销本节下文textPath适配，layout.ejs恢复水平em，entry-screen.css将主标题字号约增8%、字距-.06→-.02em，副标题略增大并设.025em字距。原谱线Sprite3/谱号Sprite9和行星六星素材、2/3组缩放不变；无新增游戏数据结论，曲线SVG已移除，不再是运行功能。精确断点/验证记录见TITLE-ENTRY.md。

同日字标适配：原logo_back与六星（Prefab188c6d7b97278b04d85321e2ae62cb9d，来源详见TITLE-ENTRY.md）→ `.title-logo-ornaments`中心缩放2/3，内部原相对坐标保留；谱线Sprite来自2db94450cae9c364498878acb6b5244d/Sprite3 → 原logo-subtitle-3.png背景 → 新SVG textPath贴合其弯曲排版。贝塞尔控制点/30单位字号/275文本长度是按原谱线图形作的网页适配，不是提取出的游戏曲线或原文字字体；实际使用文件layout.ejs、entry-screen.css。生命周期与导航未变。

**现已接入（覆盖本节旧未接入结论）**：原TitleContent与Seek方法证据 → export_title_movie.py按CRI chunk过滤@SFV type0负载 → title-background.mp4 → layout.ejs `.title-entry-movie` / entry-screen.js movieReady、movieTick、ended、stopMovie。网页保留226帧循环起点；2倍开场、压至1920宽/H264 CRF21、cover裁切、6秒失败回退为适配。原图分层与intro粒子仅失败回退挂载，不与视频重复叠加。UI副标题增大/下移6px/合成粗体是博客文案适配，不是原游戏字号。视频全量解码无报错、桌面/手机截图已查；构建和入口回归覆盖动态像素、循环定位、资源释放、提前退出、失败/减少动画回退。尾部旧USM警告由容器元数据/EOS直读路径引起，显式抽取视频包后不再出现；无损像素级同游戏逐帧验收未做。

设备`title_screen/anniversary_5th_bg` → TitleContent path_id5656993926448481586（movies=1/live2ds=0/loopPointFrame=226）→ MovieBundleBuildData path_id2767517214885464949（24分块顺序）→ `title-movie-audit/inventory.json`、原USM与预览。OnFinishMovie.MoveNext RVA0x4AF3EBC在0x4AF41CC读取element+0x28，0x4AF41D4调用Seek，证明循环字段实际使用。详见[专题](../pjskapk/TITLE-MOVIE-AUDIT.md)。网页entry-screen.js尚未引用视频，built_in Clip不能证明原游戏无持续动作。本轮仅审计，未构建/浏览器回归。

每项应形成：**游戏包/节点/组件或方法 → 原字段/算法 → 本地证据文件 → 网页映射 → 保留或偏离的理由**。

- `dump.cs` 的类型、签名、RVA 只能证明定位，不能证明方法体逻辑。称“算法已确认”必须有反汇编或 Shader/动画数据依据。
- Prefab 默认值不能冒充游戏运行时最终值；贴图 alpha、组件 alpha、父级 alpha 和合成结果不能混为一个数。
- 当前引用既有审计结论的条目注明专题文档；本次未把每个方法重新反汇编。需要继续验证时按地址和脚本复查。
- 没找到游戏实现的效果，明确列入末尾“无原始实现依据”，不为了凑齐证据填入无关方法。

## E01：点击圆环与三维碎片


对应：`FX-TAP-RING`、`FX-TAP-MESH`。

**游戏定位**：Prefab `e5cd519baaf464685bf5e0a5bcc4d162` / `fx_Tap_single`。

| 游戏组件/引用 | 数据说明 | 网页为什么这样写 |
| --- | --- | --- |
| `PT_01` ParticleSystem path_id 14 | Burst 1；life 0.5s；4×4 UV 序列；alpha 1 | 用单张序列图播放圆环，不再额外加一个白环或统一乘 0.8 透明度 |
| Renderer → `89238adfbd2d1b046be2d83b53172fac` / `mat_tap_texturesheet` | 贴图已有青色内环和白色外环；不是另一个 `_1` 材质 | 圈的颜色、双环边缘来自原图，不手绘两层圈 |
| `particle2` / `particle2_1`，ParticleSystem 13 / 12 | Burst 8 / 7；life 0.1–0.7 / 0.2–0.7s；2×2 随机 UV | 两组总共 15 片，随机生命和四格颜色 |
| Renderer → `568a878723d034146899b0eebd8ca058` / `mat_sekai_01_1` | `_MainTex` → `ec92a5114c5efd0439a94b59a4714420` / `tex_sekai_01_1` | 直接采样原渐变，不能改成单色半透明三角形 |
| `sekai_PT_05` Mesh + 法线、UV；Z 自转 0.2617994rad/s | 有正反面和边缘，三轴初始姿态不同 | `tap-mesh.js` 进行三维投影/法线着色，而非仅 CSS 平面旋转 |

证据：[tap-effect.json](../pjskapk/analysis-6.8.1/ui-data/tap-effect.json)、[Shader 程序](../pjskapk/analysis-6.8.1/ui-data/tap-shader-9-0.txt)、[详细审计与尺寸校准](../pjskapk/TAP-EFFECT.md)。复查脚本：`pjskapk/inspect_tap_effect.py`。

网页：[tap-mesh.js](../themes/sekai-next/source/js/tap-mesh.js)、[effects.js](../themes/sekai-next/source/js/effects.js)、`refinements.css` 的 `.tap-atlas` / `tap-frames`。

偏离：alpha 第一关键点约 0.050004 / 0.047059 在网页统一为 5%；原较大碎片与圈比例由一次设备录屏人工校准，因此 72px 圈和 10–22px 碎片是网页尺寸，不是游戏常量。屏幕位移和正交投影未完整还原。

## E02：街景模糊、底部点阵和压暗

对应：`FX-SCENE-BLUR`。

| 游戏定位 | 原始实现/字段 | 网页映射与理由 |
| --- | --- | --- |
| `46db4f81f977f1b42abad83cef375dcd` / 10，`UIBlurController` | `BlurSamplingDistance=1.5`，`CaptureResolutionScale=0.5` | 半分辨率绘制、普通页面默认 distance 1.5；这是控制器默认值证据 |
| `SekaiUIBlurParameter()` RVA `0xA98DD8C`，常量 VA `0x1ED4538` | 默认 scale .5、distance 3 | 选文/正文使用 3 的候选依据；**游戏逐页运行时映射仍待证实** |
| Shader `092154f9c823d420f88f7701eae0b6b5` / `Hidden/CP/PostEffect/UIEffect`；`ExecuteBlur` RVA `0xA984EC0` | 依次 pass 0、1；偏移 .65/2.43/4.37 × distance，权重 .204/.198/.098；分母是相机描述尺寸 | `street-blur.js` 两方向依次绘制，不用 CSS blur，也不用降采样纹理尺寸代替原分母 |
| `CommonBackgroundDot.SetDotImage` RVA `0x4FDE498` | 小纹理 8×8、底部 40×278，底部纵向不重复 | 大点是原点阵纹理，不是越来越大的模糊圆 |
| `af5f1b95e91154c278a5156c9f5ecd32`，CustomRawImage 254 / 331（ButtomDot） | alpha 128/255 / 30/255 | `refinements.css` 分别用 .501960814 / .117647059，避免底部出现白块 |

证据：[ui-facts.json](../pjskapk/analysis-6.8.1/il2cpp-audit/ui-facts.json)、[Shader/原生方法审计记录](../pjskapk/IL2CPP.md)。重提取：`extract_ui_facts.py`、`extract_shader_programs.py`；原生方法用 `il2cpp_audit.py disasm`。

网页：[street-blur.js](../themes/sekai-next/source/js/street-blur.js)、[refinements.css](../themes/sekai-next/source/css/refinements.css)。

偏离：`.scene-dim` 每层 .22、两层 `1-(1-.22)^2=.3916` 是网页校准，暂无游戏运行时 alpha 证据；首页不模糊是用户需求和当前场景设计。不要将压暗值写入原版数据栏目。

## E03：手机封面模糊与柔边

对应：`FX-JACKET-BLUR`。

- 游戏组件：`dda81731e906904488b8ae15ce6e83ca` / 1303 → Shader `a7c3a9f13160e49a7b62548fbaa258ae`，`Sekai/UI/UIGaussianBlur`，SamplingDistance 2.8。
- `UIPartsBlurMusicJacket.Blur` RVA `0x4C31850`：创建 RenderTexture 和材质，Blit 一次后赋图；Shader 为横/竖各七次采样各占 .5，不是双 pass 可分离卷积。
- `UIPartsBlurMusicJacket.<LoadJacketAsync>d__11.MoveNext` RVA `0x4C31B64` → `GetMusicJacketThumbnailName()` RVA `0x60B6E3C`；实际 `thumbnail/music_jacket` 缓存检查为 256×256。因此网页先裁切缩略图，不能直接用 2048px 正文原图套同一纹素步长。
- 手机 Prefab CustomRawImage /1216 的 alpha 为 76/255；RectMask2D /1008 的 softness=(0,389)，padding=0；父 /816 高574，外层 /650 为700×700。因此网页使用 `.298039228`、700/574 区域比例和 `194.5/574=33.885%` 柔边比例。
- 手机外壳由 `CellPhoneLoader.Awake` RVA `0x4B03928` 加载 `ui/smartphone`；原图 1034×1942，保留原边框/刘海，不用手绘假框。

证据：[IL2CPP.md](../pjskapk/IL2CPP.md)、[phone/provenance.json](../themes/sekai-next/source/game-assets/phone/provenance.json)、上述 `ui-facts.json`。网页：[jacket-blur.js](../themes/sekai-next/source/js/jacket-blur.js)、`.phone-jacket-wash` CSS。

偏离：当前取原核采样半径的 **0.35 倍**，为用户要求减弱模糊；CSS mask 不等于 Unity RectMask2D 的逐像素等价物。序列化整数 **60 是 Shader 外部引用编号，不是强度**。

## E04：首页精选、底栏图标与按压反馈

对应：`HOME-FEATURED`、`HOME-BUTTON`，以及 GACHA 的静态美术部分。

- 首页包：`1b7a0ea3397cc4b50afa58eaa2030516`；`ScreenLayerHome/ComponentRoot/BottomLeft/HomeBannerList/BannerList` / `PageChanger`。
- raw offset 56=`scrollSec .2`、72=`changeMode 13`（AutoInterval|Swipe|Flick）、76=`autoIntervalSec 3`。因此网页 3s 自动换、.2s 滑动；不是随意选择轮播时长。
- `PageCarousel spacing=30`，选中点20×20；网页 0.7 倍得到14px点和21px中心距。`bg_base_round_h40_wh` 原50×40、左右切片24，只拉中间2px，因此不整张拉伸圆点底座。
- CustomButton 415（Live）/440（Gacha）的 Unity transition=0：闲置 ColorBlock 不是有效高亮依据。
- Gacha → `GraphicButtonTapEffect` 412 → Image365，palette2 `base_wh`→44 `tap_gn_1`，RGBA=(161,244,235,255)。Live → `SwapGraphicButtonTapEffect`384 → Image377 / Effect342，切换 `btn_home_live` / `btn_home_live_on`。
- `ButtonViewInteractionBase` 的 `FADE_IN_TIME=.1`、`FADE_OUT_TIME=.4`；既有 OnPressed/OnReleased 反汇编确认调用相应时长 getter 后淡入淡出。
- `btn_home_gacha` 包 `54ee7ea838838fc4686bfcca73e5f914`：英文区主要 RGBA=(255,255,255,153)。因此保留 .6 alpha；“看起来灰”不是简单填灰。新“随机一篇 / GACHA”文字与文章抽取是博客需求。

证据：[home-banner-metadata.json](../pjskapk/home-banner-metadata.json)、[HOME.md](../pjskapk/HOME.md)。复查：`inspect_home_banner.py`、`inspect_home_geometry.py`、`inspect_home_button_states.py`。

网页：[home.js](../themes/sekai-next/source/js/home.js)、[home.css](../themes/sekai-next/source/css/home.css)。偏离：linear 缓动、hover/focus、精选规则、手势阈值和新文案均为网页适配，不据此宣称游戏有“精选博客文章”。

## E05：地图布局、箭头、浮动与光晕

对应：`MAP-ORBIT`、`MAP-ARROW`、`MAP-BOB`、`MAP-GLOW`、`MAP-HERE`。

| 游戏定位 | 原数据/方法 | 网页对应 |
| --- | --- | --- |
| `1a97dd8c82a0a42729f6cf3ba44aeb0b` /1146 `PlayListWorldsController`，序列化偏移44起 | `RADIUS=345`、`X_RADIUS_RATE=1.8500000238`、`Y_RADIUS_RATE=.8500000238` | 按原比例计算椭圆；网页视口再缩放 |
| 同包 /1067 右箭头、/1331 左箭头，`TweenPosition` | x=-10→10 /10→-10；.75s 单程，PingPong | `arrow-nudge`，位移乘地图缩放系数，左右相反 |
| 同包 /1278，`CenterOfRingCell/AnimationRoot/WorldTex/effectImage`，`TweenAlpha` | alpha=0→.75，2s单程 | 原 `_eff` 覆盖图做透明度变化，不降低整个星球主图透明度 |
| `PlayListWorldCell.Update` RVA `0x4D53694` | `sin((defaultAnimateValue+animateValue)/180*PI)*15` 写 image.localPosition.y，animateValue+=1 | `--world-bob` 每帧更新；网页按60Hz折合6s，不让144Hz浏览器加速 |
| HERE TweenRotation，位置见 map-motion/index.json 中 HereIcon/WorldMapHere | 1s单程、0→-5°，既有审计结论 | CSS坐标方向取+5°；应区分普通 Here 与多个区域 Here 副本，进一步核查按完整节点而非仅类名 |

证据：[map-layout-metadata.json](../pjskapk/map-layout-metadata.json)、[map-motion/index.json](../pjskapk/analysis-6.8.1/map-motion/index.json)、[MAP.md](../pjskapk/MAP.md)。Tween 原始组件字节保存在 `index.json` 数组中，按 `file=1a97dd8c82a0a42729f6cf3ba44aeb0b` 与 `id=1067/1331/1278` 联合检索，读取 `path/script/raw`；并非每个组件都有独立 JSON 文件。

网页：[sekai-map.js](../themes/sekai-next/source/js/sekai-map.js)、[sekai-map.css](../themes/sekai-next/source/css/sekai-map.css)。布局提取用 `audit_map_layout.py`，Tween 用 `audit_map_motion.py`。`SelectByIndexAsync` RVA `0x4D577E4` 供继续定位；100ms默认时间引用既有审计，linear曲线、分散相位、网页中心/深度/竖屏布局不视为已解码游戏算法。

## E06：地图厚三角粒子

对应：`MAP-PARTICLES`。Prefab `6b1761911113a413584e12b882e29c34`，`WorldMapPlayListBG/SekaiEffect/back`；ParticleSystem `particle3 /19`、`particle1 /20`、`particle2 /21`。

原模块到网页字段：

| 原模块 | 导出运行时数据 | 采用理由/限制 |
| --- | --- | --- |
| InitialModule | `life`、`size`、初始朝向 | 保留每组不同生命/尺寸区间；屏幕单位换算是适配 |
| EmissionModule | `rate` | 以发射率和平均生命估计存活数量，不把全部塞进视口 |
| RotationModule | `spin`、`separateAxes=false` | 只取生效Z角速度 .08726646rad/s，不叠加未启用X/Y值 |
| VelocityModule | `orbit` | 三组-.08/-.2/-.3分开保留；轨道投影不是完整Unity模拟 |
| ColorModule | `alpha`五关键帧 | 出生/消失渐变来自生命周期数据，不统一常量透明度 |
| UVModule、Renderer/Mesh/Material | 2×2格、`mesh`、`textures` | 原30顶点18面、法线和双纹理参与着色，保留厚度与渐变 |

证据：[完整粒子数据](../themes/sekai-next/source/game-assets/map/motion-particles.json)、[精简运行时数据](../themes/sekai-next/source/game-assets/map/motion-runtime.json)、[export_map_motion.py](../pjskapk/export_map_motion.py)。**运行时数组顺序是 particle3、particle1、particle2**，不能凭数组索引猜名称。

网页：[map-particles.js](../themes/sekai-next/source/js/map-particles.js)。当前 LightVector：particle3=[.85,1,.85]，其余=[-1,2,1]；分别使用原绑定的主/发光纹理。相机单位 `max(w/6.2,h/2.75)`、视口外1.1倍分布等是网页适配，不能记为原数据。

## E07：主页世界树与场景来源

对应：`SC-HOME`、`HOME-TREE`、`HOME-PAN`、`HOME-CLOUD`、`HOME-MOTES`。

- `area/area27` 提供 `bg.png` 和 `tex_cloud_01.png`；`area_sd/wish_tree_ppr` 提供树；设备缓存 `092e/5cecc036cace036fcfccdc5233232cb3`。
- Spine骨骼4.1.23自带 `wish_tree_common_idle_01` / `wish_tree_common_sway_01`。这两段确实播放原动画数据，不是逐帧重绘；网页用4.1.56 runtime解析。
- [map/provenance.json](../themes/sekai-next/source/game-assets/map/provenance.json) 按 `source/name/file` 查对应包 SHA256 和 Unity path_id，避免把公开镜像主数据当成实机美术来源。
- [MAP.md](../pjskapk/MAP.md) 记录设备 `map-inside.png`、`map-tree-tap.png` 等观察。点击触发与回idle、拖动边界目前由网页逻辑组织；这不证明原游戏事件绑定已全部恢复。

网页：[home-world.js](../themes/sekai-next/source/js/home-world.js)、[home-world.ejs](../themes/sekai-next/layout/_partial/home-world.ejs)。±12%拖动边界仍为网页约束。

### E07 补充：2026-09-08 云、场景粒子、独立树光效

证据详见 [AREA27-EFFECTS.md](../pjskapk/AREA27-EFFECTS.md)、[effects.json](../themes/sekai-next/source/game-assets/map/area27/effects.json)；新增网页实现 [home-effects.js](../themes/sekai-next/source/js/home-effects.js)。

- 原 `area27/Background/fx_cloud` 下15个节点，两张2×4图集，按UVModule选择格子；原RectTransform/Velocity/InitialModule数据分别保留。移除旧整张图集95s平移，云位置与背景实际矩形绑定，因此拖动同步。
- `fx_tri_bottom/pt_tri` /1793550804831504547：size20–35、life10–15、原30顶点Mesh；左右两组10–20。原上下层6个有材质的组代替旧CSS飘粒。
- 树特效独立包 `area_sd/world_link_effect/wish_tree`：通过`GetWorldTreeEffectAssetBundleName` RVA0x60BE068的格式串定位，不是猜包名；`PlayTreeEffect` RVA0x607F554确认实例化到树Transform、读取+0x2C的480偏移。6组`wish_tree_ppr_idle`接入。
- `pt_seedling_glow_01`虽有Mesh引用，Renderer实际为0（Billboard）；导出只在RenderMode4时使用Mesh。MinMaxCurve mode0忽略闲置minScalar，rotation3D=false忽略闲置X/Y值。
- 原始对象审计保存在`analysis-6.8.1/area27-audit/`，脚本`audit_area27.py` / `export_area27_effects.py`可复用；包SHA256和path_id保存在effects.json。
- 当前云/树米制到网页投影仍有明确校准，曲线与速度只实现子集，不能宣称整套Unity场景逐帧移植。

## E25 · LIVE2D-CHARACTER / LIVE2D-TALK（2026-09-20）

最新网页偏离更正：移除没有游戏证据支持的5秒returnAt→idle分支；原motion3曲线/Loop字段不改，播完不再主动切Idle/normal，点击才启动下一组。idle只用于初始化。台词框桌面64%/left18%为用户要求的收窄适配，非Unity精确坐标；移动端48%保留。覆盖下文旧5秒调度与72%宽描述。

**最新证据覆盖**：6.8.1 libil2cpp.so `ShowCharacter`0x4C484D0，在0x4C48520/524设置target1/duration0.25，调用FadeOpacity0x8A2A684；协程MoveNext0x9A1695C在0x9A16A40–64执行clamped linear lerp，Time.deltaTime推进 → 本地il2cpp-audit对应地址.asm → CSS live2d-ready-in **250ms linear**，替换180ms ease-out。台词框同步与入口遮罩等待仍是网页适配。mulmotion.update只积时间，旧预演无效；warmPose改直接求解内部模型90步，不是原游戏算法。详见[LIVE2D-REVEAL-AUDIT.md](../pjskapk/LIVE2D-REVEAL-AUDIT.md)，包含实际录屏未成功的限制，不能再把下文“未取得淡入方法证据/已消除展开姿势”当成最新结论。

LIVE2D-REVEAL补充：用户要求加载完成短暂淡入，CSS `live2d-ready-in` 在ready=true后对viewport/talk执行180ms ease-out，opacity0→1；减少动画禁用。这是网页自制显隐时长，暂无对应Unity加载淡入组件/Clip证据，不能标为游戏原值。原模型/动作证据链不变。

首屏台词后续修正：保留以下原bundle/path_id证据。一歌原基础pose01含身体参数，tilthead06为台词动作；社区systemLive2ds.json配对 → 各角色talks.json第一条motion/expression/serif → `select/playTalk`。先隐藏预演Idle45帧补齐身体，再隐藏预演首条Motion/Expression45帧并同帧揭示台词；每段0.75秒模拟时间。`live2d-character.css` 的ready门控同时控制画布和台词。两阶段初始化、第一条固定开场、可见后5秒回待机均为网页适配，未恢复原游戏加载状态机。通道stopAllMotions用于解除相同表情的预约拒绝，避免动作启动而台词不更新。原fade/曲线文件不修改。

同日首帧修正：上述原Idle/Expression曲线与0.5/0.25秒fade不改，live2d-character.js/select等待parallelMotion后隐藏步进45帧×16.667ms，fit绘制后ready才可见，解决默认模型先于动作显示的问题。0.75秒模拟预热是Web初始化适配，不是游戏RVA恢复。使用既有设备阅读页截图对照角色高度，y由-30%改-38%（手机1.5%改-6.5%）；去名字/三角、框72%宽、READING标题、每次挂载随机均为用户要求的网页适配。原素材与来源链不变。

本地设备缓存 live2d/model/01ichika_normal → TextAsset MOC -4584627221076030796、Physics -4809675227882425917、model3 3565766830816995838、Texture2D351714437228227777 → export_ichika_live2d.py → game-assets/live2d/ichika（原MOC二进制、PNG、physics3、model3）。另外三人MOC：21miku_normal/-3588211499420891378、22rin_normal/6732125377404294541、23len_normal/7464630159336609291；完整SHA256/BuildModelData/纹理/动作path_id都保存在各自source.json/build-source.json。

live2d/motion/01ichika_motion_base 的 w-normal-tilthead06 Clip1439103488540952285 → sssekai 0.8.0 AnimationHelper三次曲线转换与参数CRC表（用原MOC名字补充）→ .motion3.json → live2d-character.js/talk → parallelMotion身体/表情两个通道。原Fade MonoBehaviour身体0.5秒、表情0.25秒原样记录并引用；Loop从原m_MuscleClip.m_LoopTime恢复，不沿用转换器固定true。未映射曲线直接失败；一歌旧default01有两个未映射CRC，运行配置已换成完整可解析pose01，草稿不挂载。

台词配对单独证据等级：社区master systemLive2ds.json（原包未核实）→ characterId/unit/serif/motion/expression → 各角色talks.json → 同时更新DOM和动画。选存档前三组且忽略季节时间/weight、5秒返回姿势为网页适配；无语音。实际设备阅读选择页截图确认交互结构，不等同四人原动作逐帧验证。

运行库Pixi7.4.3、MIT mulmotion0.5.1、官方Core05（本次版本83951616）→ vendor/live2d/provenance.json → live2d-character.js/prepare。原physics3直接求解；原EyeBlink组为空，网页用真实ParamEyeLOpen/ROpen做4.5秒周期、闭开各150ms，ParamBreath周期3.2秒/peak.5/weight.5，都是网页自定。模型等比取景×2.6桌面/×1.55窄屏、独立Ticker/DPR1.5/60fps上限、离页停/返页复用为Web管理，不对应游戏RVA。验证与限制详见[LIVE2D-CHARACTERS.md](../pjskapk/LIVE2D-CHARACTERS.md)。

## E24 · ENTRY-TITLE（2026-09-20）

最新坐标证据：原188c6…/Star_mult位置(.219,.195) + o_01–06_star局部位置、scale.36、各Sprite rect/PPU100 → .title-logo-stars nth-child绝对定位，4.5×2.6统一坐标窗 → 原六星错落关系；logo_back原(.819,.225)、scale1.5、212×140/108 PPU同窗映射。全部字段/换算详见TITLE-ENTRY.md。组挂载网页48%宽及位置、加厚8/5px描边、Allura字体为网页适配；不冒充原游戏字体。原bg Prefab SpriteRenderer28–31的Sprites/Default及Clip bg_before scale0/bg scale3/bg_after alpha14 → entry-screen.js分层入场，修正base索引。已解析数据没有独立人物动作，未凭观感添加持续摆动。

最新标题素材补齐：Prefab188c6d7b97278b04d85321e2ae62cb9d / logo_back Renderer106 → 6be32414f5e695f47bc3321c8b20b8be Sprite2 → logo-logo_back.png → .title-logo-planet。星星Renderer122/107/95 → 1582a1f54acbb4b47b0f86fd64e5aa9f Sprite3/5/4补齐第4–6颗。五线谱2db94450cae9c364498878acb6b5244d Sprite3（parts_2，含金色尾饰）、Sprite9（parts_7，高音谱号）→ logo-subtitle-3/9.png → em背景及.title-logo-clef。均由export_title_logo.py从原Sprite解码，source/path_id见logo-provenance.json。32%宽行星、谱线contain排版、六星间隔延展是网页适配，不冒充原Transform数值。Mesh贴图仅导出证据未挂载。TAP原79d6…/Sprite2自带灰底，去掉CSS重复底色。标题/测试用语清理为博客文案，计数范围仍在tooltip说明，不改变统计实现。

ENTRY-TITLE-LOGO 最新链：Prefab188c6d7b97278b04d85321e2ae62cb9d（anniversary_5th_logo，GO38）→ Clip fe9600cac223bf6479c00229834f9efc/AnimationClip1 clip_title_5th_logo_in_03 → decode_title_clip.py → entry/title-logo-timeline.json → entry-screen.js binding/sample/logoFrames → .title-logo-letter/wordmark/flash。Logo/Logo_mult scale index90：3.216667s=6、4.05s=1；其 01_C Euler index60：Y90°→0（3.216667–3.616667s），alpha index118：0→1；Logo/Logo_add alpha index133：3.683333s=0、4.05s=1.083107、4.216667s=0。Euler 属性4按3通道解码，四元数属性2按4通道，不能混用。网页将14个原字母的时序按博客标题字数映射，alpha夹至0–1，终态不执行原后续合成切换，所有时间除2。

原 Renderer108/124/94 → 1582a1f54acbb4b47b0f86fd64e5aa9f Sprite14/2/11（三星）；Renderer116 → 2db94450cae9c364498878acb6b5244d Sprite8（colorobi）→ export_title_logo.py → entry/logo-provenance.json 与 logo-*.png → layout.ejs/entry-screen.css。星星原开始3.8/3.85/3.9s、缩放0→.36，用网页0→1及75ms适配显示尺寸；字幕450ms平移为自制。字体/描边/配色排版是参考原截图的 CSS 适配，原字样是图片而非可替换字体；未挂载 white_obi_gosenfu 和 circle_mdl MeshRenderer82/83。构建/入口回归与截图检查通过；详细复查命令和验证见 TITLE-ENTRY.md。

用户速度覆盖：原Clip6.4333334s及原曲线不变→entry-screen.js introRate=2将WAAPI时长/延迟除2，title-fx.js遮挡粒子时钟乘2→网页3.216667s。属于用户要求的网页适配；不宣称游戏原速。持续光点与点击退出仍用原网页时钟。layout.ejs preload与head提前fetch仅网络调度优化，无新的游戏实现结论。

本轮粒子证据链：7560a2da64ae7764ebc7aff8487a7787/anniversary_5th_bg_built_in/root/white_moya ParticleSystem18、white_moya_sml20、white21→ShapeModule.mesh 外部26164c16c48ac0f4094f89bb1c8d581d/Mesh2（20顶点24面）、c668210bb67ac5a45a35953ffc6e7bd3/Texture2D1 tex_5th_anv_ver→export_title_particles.py→title-particles.json→build_title_fx.py→title-fx.json→title-fx.js meshPoint/sprite。原20+20发射、寿命2–5s、尺寸1–3/1–1.36、alpha1→.930588→0，white单粒子4s；网页使用同图集/随机范围/曲线，mesh归一化到cover背景为适配。circle_eff ParticleSystem16原rate3/s、life3–4.5s替代旧CSS14光点。

开始效果：21812d99e497bd249b7b677175a9bb3c/fx_title_start_effect/root/fx_live_transition_v2_03_b/root/pt_outside/tri_02 PS24、tri_03 PS31、flare_white_out27/first28/flash32/circle33→title-start-particles.json；tex_sekai_v2_02来自cd1fa9418c0c2d1428572302a6612b32/Texture2D1，tex_transition_01来自43ec8beda1d49499ba7a564838ca54cd/1，tex_transition_03的完整引用见导出JSON。e1e202e24129e8846ac2a18ad3185935/AnimationClip1 clip_title_start_effect_emit：pathCRC1733383287=fx_live_transition_v2_03_b，.25s激活；保存title-start-activation.json。网页保留burst/size/life/alpha/atlas，径向屏幕投影及1500ms白场为适配；原renderer序列化enabled=false/pt_outside scale0，未恢复完整UI粒子桥接、控制器与原投影，不将网页可见性当作原字段已还原。

实机title-detail.mp4及8.4s起50ms采样确认标题开始有碎片/渐白；网页双Canvas避免additive黑底，screen近似混合不等于完整GLES shader。未移植原logo拼合、两组空材质环境碎片。构建、verify-entry-screen、截图视觉检查完成；详见TITLE-ENTRY.md。

独立路由补充：source/entry/index.md的title_entry标记→layout.ejs只在/entry/挂载原入口→entry-screen.js取消接受存储、盖白后sekaiNavigate('/')→page-router保留场景。进入/entry/例外使用原生加载以重播文档级片头。URL/历史/访问策略是博客适配，不来自游戏；三张原图、Clip/path_id、数值及下列证据不变。

原957845c1491bc3e4eb3cc5b3f636410b/Texture2D1 bg03→entry/provenance.json源SHA→layout.ejs标题背景；79d6e129c2f0fe24e9b3af3b6ba39cd9/Sprite2→txt_tapToStart.png。

ENTRY-TITLE-INTRO：原背景Prefab7560a2da64ae7764ebc7aff8487a7787的bg/GameObject1/Renderer30→bg01，bg_before/GO4/Renderer29→bg02，bg_after/GO7/Renderer28→bg03（外部Sprite2引用分别9/8/7）。原cfe864a549e85814fba9d168b785fec6/AnimationClip1 m_MuscleClip.m_Clip.data.m_StreamedClip→decode_title_clip.py解码4系数三次曲线及层级CRC32→entry/title-timeline.json→entry-screen.js value/frames→.title-entry-base/tree/characters/flash。原缩放.88到.8除终态.8适配cover；alpha曲线直接使用；白光3.8s=.7、3.9667s=.7217。原长6.4333334s、60Hz采样，非dump.cs签名推测。white_moya粒子、原logo拼合未实现，网页标题显示时序自定。

ENTRY-TITLE-EXIT：设备title-start.mp4确认点击后渐白→网络等待，未解出原退出Tween。网页650ms盖白+就绪后350ms揭白、14光点及访问门禁为适配，无原算法背书。title-intro-clean.mp4验证树→白闪→人物顺序；build与verify-entry-screen.cjs通过，截图已查看。完整参数、原数据路径、真实验证与缺口见pjskapk/TITLE-ENTRY.md。

## E23 · FX-MENU（2026-09-20新增）

用户后续要求略缩小：面板改43.3vw/max832/min414px，手机90vw；不是原904字段变更，系网页显示缩小约8%。原资源证据不变，参数及验证见SYSTEM-MENU.md最新记录。

原dead2c85644b14045bcd265cf80918c6/GameObject9 MenuDialog→RightSubWindowComponent/Window/ContentRoot RectTransform106宽904、Bg122宽904；btn_menu_profile源8623af728d8a6cb4e8de1871f8be6e9a/Sprite1为392×184 → menu/provenance.json与实机menu-open.png → system-menu.css右侧面板/卡片比例。独立原图标映射中文五项，GitHub为非游戏图标。200ms缓动、五项布局、alpha.8/.92为明确网页适配，没有解码到原菜单动画方法体。完整证据/映射/验证见pjskapk/SYSTEM-MENU.md。

## E08：文章选择几何、频谱、按钮

2026-09-20 ENTRY-READING/WORLD-VISIT：场景仍沿用E07/E11–E18原始数据；地图选择和转场不挂载。30分钟访问随机、15秒本地心跳是网页规则，无原游戏字段/算法依据。visit-world.js仅决定场景ID；原素材与效果参数不变。实现文件/状态/验证见pjskapk/RANDOM-VISIT-WORLD.md。隐藏地图入口不等于素材获得授权。

2026-09-09 NAV-VEIL（关联E02/E22）：首页原有网页display:none/filter:none切换改opacity0/blur(0px)，180ms ease-out为浏览器显隐适配，**无对应游戏时长字段证据**。不改变原点阵资源和内页最终暗度/模糊值。源码、帧采样与未验证边界见PAGE-ROUTER.md同日NAV-VEIL条目。

2026-09-09 SELECT-READ：read-start增加flex-shrink:0防止flex压扁，保留215×80 CSS px及下述原贴图/切片。属于浏览器修复，无新游戏字段。FX-BACK（关联E22）同日修复同世界首页world参数被误判为换世界：不改变任何原素材/动画，仅导航资格判断。实测与边界见PAGE-ROUTER.md同日记录。

对应：`SEARCH-SELECT`、`SEARCH-FILTER`、`LIVE-SPECTRUM`。

- `MusicSelectSingleListCell` 频谱RectTransform：六柱8×72，中心x=-35,-21,-7,7,21,35。网页保留六柱排列。
- 频谱原 `Update` RVA `0x4C50358` 读取 `BGMPlayer.GetSpectrumLevels/GetIngameSpectrumLevels`。网页没有对应音轨，只用 `spectrum-bounce` 代替，**不能把CSS周期当成原频谱实现**。
- 同列表 `UnderLine /169` 白色alpha .2；`ChangeHighlightDisplay` RVA `0x5017F44` 激活HighlightPanel。因此非选中项用分隔线、选中才显示板。网页白底 .5 是用户校准，原粉色序列化值会被运行时覆盖。
- 手机 `PositiveButton/ButtonImage /1110`：`btn_round_line_h80_wh`，左右切片52、色#77EEDD；`ShuffleButton/Base /1229`：`btn_random_lgr`。
- 分类 `MusicSelectUnitTab/TabImage` 绑定 `icon_tab_unit_*_on/off`，不是 `icon_unit_*`。中文技术分类为网页业务映射。

证据：[IL2CPP.md](../pjskapk/IL2CPP.md)、[ui-facts.json](../pjskapk/analysis-6.8.1/il2cpp-audit/ui-facts.json)。网页：`main.js`、`refinements.css`。当前 `/live/` 的两卡片例外来自参考站素材，不应把上述原手机按钮证据套到这两张卡片上。

## E09：好友框体、侧栏与在线样式

对应：`SC-FRIENDS`、`FRIENDS-STATE`。

- 好友条目包 `f84c1c7438790a544bda1a125fc432d6`；页面包 `e826a636f6cfb4d87bec3fbd81243737`。
- `FriendListCell/Root/UIPartsFriendStatusImages/Online`：240×48，`bg_base_r12_wh`，RGBA=(0,.80000007,.73333335,1) → #00CCBB。因此使用真正Online节点配色，但文案改“前往”，不宣称站点实时在线。
- `FriendCount` 外220×62、alpha .8；内CountGroup204×48、#444466。两层嵌套得到横8/纵7原单位的白边，不凭观感添加6px边框。
- `BackPanel/Base` 宽360、右锚+8、组件alpha1；`tab_bg_dbl`中心像素自身alpha137/255。因此“组件不透明”不能推导整个底板不透明。
- 侧栏文本包 `60480bb795857084d8f9489a797c7dac`：Cell132高、View128、Selected112居中；Selected实际是 `tab_dot_select_wh` 染#77EEDD；Line192×4右下锚定，实际 `line_dot_h4_wh` 染#444466。
- 顶部三控件原中心x=-207.49652/89.50354/281.50354，宽220/296/72；边缘间隔39/8。网页用同一缩放单位换算，不给三个控件统一gap。
- 九宫格 `bg_base_r12_wh` 34×34/border16；`bg_base_r16_wh`44×44/border21；`bg_base_r20_wh`50×50/border24。保留端帽，不能整图拉伸。

证据：[friend-layout-metadata.json](../pjskapk/friend-layout-metadata.json)、[friends/provenance.json](../themes/sekai-next/source/game-assets/friends/provenance.json)、[FRIENDS.md](../pjskapk/FRIENDS.md)。复查脚本：`inspect_friend_assets.py`、`inspect_friend_layout.py`。

网页：[friends.css](../themes/sekai-next/source/css/friends.css)、[friends.js](../themes/sekai-next/source/js/friends.js)。网页采样边界内移1纹理像素、端帽裁剪约束、小屏横排和.12/.167s反馈是浏览器适配，不是原Unity完整布局/动画参数。

## E10：称号分层

对应：`FRIENDS-HONOR`。

- `UIPartsBondsHonorImage` 有 leftBgImage/rightBgImage/leftCharaIconImage/rightCharaIconImage/wordImage/frameImage/patternImage 独立引用。
- Prefab `29864637d77434f119b95e2e1b65f812`：right→degree_bgBase，left→degree_bgColor，pattern→degree_bgTexture_main，frame→frame_degree_m_4。说明这类羁绊称号存在原生分层。
- 通用主框380×80、副框180×80；博客按相应比例组合，不拉成相同长宽。
- 已检查普通称号2893包只发现degree_main/sub、rank_main/sub、scroll五类贴图，不能推导普通成品图都有可去除字/人物的背景层。

证据：[HONORS.md](../pjskapk/HONORS.md)、[honors/provenance.json](../themes/sekai-next/source/game-assets/honors/provenance.json)。博客当前纯色#77EEDD底和自定义文字是用户选择；它不是找到了所有原生无字背景，也不是恢复被遮盖的像素。

## E11 · 教室 SEKAI（HOME-CLASSROOM / HOME-CLASSROOM-FX）

- 原包 `area/area5` / `3689d2eb3badf9bfbfece57278541c68`，SHA256 `44af2c7486f40fcde060b8e58b2b407f60760d235c944a2e2df000b5fc5add52`。
- `area5/Background/background` SpriteRenderer `8272486853535881450` → Sprite `7603141331213466008`，3378.1444×1600 单位、pivot=(0,1)。`area5/View/desk{1,2,3}_view/sprite` 独立层详见 [CLASSROOM.md](../pjskapk/CLASSROOM.md)。原组件 `-7246673203354479985` 给出 scrollMax=(3378,1600) 和 defaultPosition=(1750,785)。
- 审计文件 `pjskapk/analysis-6.8.1/classroom-audit/objects.json` 保留原字段；运行数据 `game-assets/map/area5/scene.json` 保留节点/Renderer/Sprite ID。`home-world.js/startClassroom` 用 background bounds、原位置、锚点及 order 组合，不把桌椅烘焙进背景。
- `effects.json/groups[].path,id` → 原 ParticleSystem；`textures[]` → 原 Texture2D ID；17 组提取自 Background 下 tri/light/stars/circle 节点。`home-effects.js` 按世界加载原 Mesh/贴图/颜色与透明度关键帧，使用区域尺寸投影。
- 本轮修复漏乘 SizeModule（例如 `-4484558035598598364` 首值0.453983）。材质 `mat_sekai_02` 实际引用依赖 `shader/particles` 的 Shader `6228555572980372533`，`Sekai/Particles/Additive`、SrcAlpha/One；不再凭材质名字判定混合。Shader JSON/GLES 留存在 `classroom-audit/`，复查脚本 `audit_classroom_fx.py`。
- 黑板流星 `fx_keion_sekai_stars_01/root/pt_01` / `3795898463928772856` 原 TrailModule 启用、width=0.5、StartSpeed=0.2；现在绘制原贴图线带和两组星点。局部600倍投影与线带尾部淡出属于网页适配，不是游戏常量。
- 网页差异：沿用首页 cover 与 ±12vw 拖动，不照搬游戏相机；简化合成顺序与粒子模拟，详见专题限制，不宣称全部粒子与游戏一致。
- 本次实际进入设备教室截图对照，浏览器检查背景/桌椅同步拖动及粒子画布；构建和四项回归脚本通过。无人物；地图开放 area5/27。

## E12 · 世界切换（MAP-ENTER）

2026-09-09：用户指定单击世界立即进入，删除sekai-map.js首次点击rotateTo分支；不是新恢复的游戏点击规则。原PlayMark、ParticleSystem来源及转场时间保持下述证据/适配边界。拖动与箭头依旧可旋转，busy阻止重复启动。

2026-09-08新增实际FadeOut方法体证据：0x60a2178内0x60a23a4→PlayMark.Setup，0x60a23c4→StandByCore，this+0x20加载sekaiEffect后0x60a23dc→ParticleSystem.Play(0xabd5918)。原c790a5c99b4fd4f80a2e34152b8f6fe7 → AreaTransitioner/sekai/fx_live_transition_v2_03_b/root/pt_outside的20/21/22/24/25/26粒子 → particles-raw.json含原字段/纹理引用/源SHA → transition-particles.js画布。使用原tex_sekai_v2_02渐变atlas和生命周期曲线，移除旧CSS教室碎片；VelocityModule/完整shader未复刻，投影min(viewport)/20、分层径向角和混合为网页适配。覆盖时间1500ms替代旧1200ms。录屏、节点逐项字段、数值边界和浏览器真实验证见[WORLD-TRANSITION.md](../pjskapk/WORLD-TRANSITION.md)。地图上移3svh、隐藏提示属用户要求的网页布局，无原常量背书。

E11/HOME-PAN覆盖追加：原area5组件 `-7246673203354479985` 给出scrollMax=(3378,1600)，说明原区域有界；网页不把此值直接当屏幕px。`home-world.js/panLimit` 按背景实际显示宽度，取min(视口12%, 半宽余量−1px)，resize/load/ResizeObserver重新夹紧已有偏移。12%与1px是网页操作/舍入适配，不是原游戏常量。双端实际拖动与多尺寸数学检查见CLASSROOM.md/verify-home-pan.cjs。

E11 黑板均匀性补充：原Shape.arc.mode=0（随机），旧网页固定随机角度循环不符合重复发射。当前在原扇角内按粒子槽位分层、每次出生重新随机，以解决少量流星长期偏向一侧；分层算法是用户要求下的网页适配，非已恢复Unity算法。没有改动扇角/旋转/发射率。

E11 追加修正（2026-09-08）：流星 `3795898463928772856` 的 ShapeModule.arc=214.039993°、rotation.z=-19.23°，两组星点arc=200.399994°、rotation.z=-13.6°；`home-effects.js` 的circleAngle与direction共同读取原扇角/旋转，不再360°。`-2723858980962753314` Emission.rateOverTime mode3/1–2，`4191182512176923101` mode3/0–2：exporter保留rateCurve，网页预热采用均值1.5/1，属明确适配。Shader `-1595268760865149387` 的原culling=2→runtime cullBack→gl.BACK/CCW，修复厚三角前后面重复合成；Additive culling=0不变。原证据均位于classroom-audit原对象/Shader JSON，而非仅以网页参数作依据。详见CLASSROOM.md最新记录。

原 Prefab `f41fb1615e34a444faafcc8ccbf15a05` 的 PlayMark/CustomRawImage 32 → Texture2D `btn_play_h264_gn`，已导出原图及源哈希/引用到 `game-assets/map/transition/provenance.json`。设备 `world-transition.mp4` 时间序列确认拉近→播放标记/碎片→白场→新场景。`SekaiTransitionController.FadeIn` / RVA `0x60a172c` 反汇编尾调用 `ColorFader.Play`；具体时长由调用参数传入，未声称恢复整条控制链。

`world-transfer.js` 代替旧300ms导航：950ms放大2.5倍、1200ms覆盖后导航、首页等待素材就绪后1000ms显现；这些是网页适配值，原素材不为网页时间/粒子算法背书。保留跨文档导航，使用短期 sessionStorage 标记跨页白场；8s超时放行、减少动画与BFCache清理。转场碎片为原三角贴图的 CSS 近似，不是已还原原 UIParticle。详见 [CLASSROOM.md](../pjskapk/CLASSROOM.md)。

## 无原始游戏实现依据 / 尚未对应完整的部分

| 效果/业务 | 当前依据 | 记录要求 |
| --- | --- | --- |
| FX-AMBIENT、MAP-ENTER | 网页装饰或参考设备观感 | 明写“网页近似”；HOME-CLOUD/HOME-MOTES已新增原数据映射，具体缩放/模拟差异见E07 |
| FX-MENU、FX-NAV、FX-BACK、POST-NAV、POST-TOC | 浏览器/博客需求 | 167ms、100px/12px阈值等不得标为游戏常量 |
| LIVE-CARDS / LIVE-SCALE | 用户要求采用参考站布局、窗口可自由拉伸 | 本地 `game-assets/sekai-ctf/SOURCE.md` +当前代码；无本机游戏算法证明 |
| HOME-GACHA 随机文章、精选筛选、搜索分类、阅读量 | 博客功能适配 | 游戏素材仅支持外观，不为业务算法背书 |
| SEARCH-DIAMONDS | 原 `icon_allPerfect.png` 静态图，按用户要求重复五个 | 静态资源引用不等于已还原游戏评分动画 |
| 所有尚未核实的Tween曲线、运行时模糊页映射、相机投影 | 有局部数据，缺完整运行时证据 | 保留具体缺口，不用“完全复刻”概括 |

## E13 · HOME-STAGE / HOME-STAGE-FX

完整证据与复现命令见 [STAGE.md](../pjskapk/STAGE.md)。area/area7 SHA256 `4d889dd6781e78c19afb1221204219a11f4d065ca82c269dec3167985e27320d` → 原背景/light1/light2/foreground的SpriteRenderer → scene.json → home-world.js投影。13张实际层=4张基础场景+9张原区域道具，不包含角色。

主舞台绿色背景不是网页着色：`areaitem/areaitem0707` SHA256 `e9172dfd24e35733c17450b2243139e2bbd71878ade1adbf4cbc130239c7c817`，Sprite `-783164797407340184` / Renderer `-8798323065312523174`，1601×913，pivot(.5,0)；对应area7 spawn-point7 Transform `-8906712583894700021`、(2041,-912)。原bodySprite pixcelSize相同；网页 `scene-back-layers` 合成原贴图。挂点用原数据，背/前景分层为网页适配，未声称恢复运行时排序方法体。

20组粒子 → effects.json → home-effects.js。Shader `6140383380374060507` 的One/OneMinusSrcAlpha与CustomData0.x判定已保存GLES；八组的vector0_0常量1使输出alpha为0，因此用加法，避免灯光黑底。spot_02 `7436878384713094626` 的size3D X2/Y4、burst0s/5s与spot_01 `7119853185533469995` 的30s角速度曲线，分别对应旋转前各轴缩放、重复发射时间轴和数值积分。局部600投影、32步积分、线性关键帧插值为网页适配；相机/随机/后处理仍非逐帧一致。

2026-09-08平板实际进入舞台；初版缺区域道具，补查原包后修复。1280×720浏览器截图与宽窄拖动/转场/HERE/持久化检查见STAGE.md；基础场景与教室回归通过。缓存无法证明全部属于6.8.1首次发布版本，UnityPy fallback版本也不作为原游戏引擎版本证据。

## 后续新增记录模板

`MAP-SELECT`（2026-09-08）：用户指出游戏先将选中世界旋至前方，再点进入。网页sekai-map.js复用原环形坐标与72°间隔（原几何证据E05），目标角度使index×72°+rotation=0 mod360，并取最短±180°；保持已有100ms旋转时长，不将该时长称为此次恢复的游戏常量。focused独立于持久化HERE：首击只选中，旋转期间忽略进入，完成后再击才写存储和调用转场；箭头/拖动清除确认状态，返回地图也清除。中央？？？固定居中，只做首击确认不虚构环绕旋转。两击状态机属按用户观察实现的网页适配，未声称已恢复原点击方法体。实际浏览器验证首击留在map、aria-pressed选中、二击进入游乐园及后续回归通过。

`UI-CURSOR`后续用户选择：在恢复原生鼠标后，进一步要求始终普通箭头；因此refinements.css统一cursor:default!important，覆盖按钮手形/拖动抓手/文本鼠标形状，仍保留输入caret、键盘focus和点击特效。扩展合成指针宿主继续隐藏。依据为用户交互要求，而非游戏组件参数。

`UI-CURSOR`（2026-09-08更正）：用户澄清保留原鼠标，仅去除固定黑箭头。已撤销全局cursor:none。原因为Chrome扩展hehggadaopoacecdllhhajmbjkdcmajg/1.26.901.11451_0/content-scripts/codex.js创建codex-agent-overlay-root并引用images/cursor-chat.png（browser-agent-cursor）；实际Chrome截图亦有固定黑箭头。网页只隐藏该注入宿主，不改鼠标cursor/点击特效，不卸载或修改扩展。此证据是开发工具层，不属于游戏实现。

### E15 · HOME-STREET / HOME-STREET-FX

原area/area8 SHA256 `198263e7827cc629c299c14b1a10256079ff8ec0251609e81e3cd79ac0e75c8f` → Background/background Renderer `-886002802204957162` / Sprite `-6128862185610540869` → area8/scene.json → home-world.js动态groundFile=bg.png。10道具的各包hash/挂点及18个ParticleSystem ID保存在items/effects.json及area8-audit。五组暖灯、背景光、尘粒以原size/UV/alpha/发射数据驱动；webUnits600是局部单位投影标定，六组区域单位厚三角为1。原加法和Cull Back Shader证据见 [AREA8.md](../pjskapk/AREA8.md)。原图与截图核对，非仿制店面绘图。

### E16 · HOME-WONDERLAND / HOME-WONDERLAND-FX / HOME-WONDERLAND-TWEEN

原area/area9 SHA256 `e1783986d6663d163be625673356a312f41e10c58b2df031eb5b87e6fd1c84e4` → sky Renderer1746001821669465501/ground6068266110396609117/设施分层 → scene.json及原sky等比纵向、横向平铺尺寸合成底；并非拿截图当背景。28组原粒子含两组120s云，原UV4×1/3×1、出生区域和速度 → home-effects.js clouds通路；600局部投影为适配。木马与背景气球TweenPosition原3s(0→15Y)/4s(-8→8Y)、原零切线 → area9-motion.js平滑往返；原路径、组件ID、粒子ID和合成记录在 [AREA9.md](../pjskapk/AREA9.md) / area9-audit。摩天轮用原光点，不虚构整座旋转；没有过山车行驶方法体证据，不擅自添加轨迹。多层视差未恢复。两个人形物件确认为原0903唱歌机器人、0905初音人偶服，非角色占位。

### E17 · HOME-EMPTY / HOME-EMPTY-FX

原area/area10 SHA256 `ca2388307160e9ceef5274b7b120564300605d5814d4ac34bd41bf3389d6dc84` → bg/try1/try2原Sprite及8件道具挂点 → scene/items.json → home-world.js。15组粒子的三个局部日光/地光保留原size3D、startColor mode4随机颜色梯度及加法Shader6228555572980372533，其webUnits600，其他12组为1；共享renderer在旋转前应用XY尺寸，非用粉色闲置maxColor替代随机渐变。完整原节点/Renderer/粒子/挂点ID与SHA见 [AREA10.md](../pjskapk/AREA10.md) / area10-audit。

E15–E17集成验证：root串行实际进入设备并保存world8/9/10-reference.png，浏览器1280×720截图人工检查；三个视口的加载/转场/动画计时/拖动/HERE/存储与无pageerror检查通过。共用改动同时回归教室/舞台。原数据和GPU效果可对应，但线性粒子关键帧、32步角速度积分、局部投影和初始化预热仍为网页模拟，不宣称逐帧一致。设备输入和共享文件归root独占，子agent未抢占。

### E14 · HOME-CLASSROOM-ITEMS

`areaitem/areaitem0501`–`0509`原包 → 原Sprite尺寸/pivot、局部Transform为0/scale1、Renderer order4025 → area5 spawn-point1–9原Transform位置 → `area5/items.json` → `home-world.js/startClassroom/paint`。完整九项ID/坐标表与验证在 [CLASSROOM.md](../pjskapk/CLASSROOM.md) 的HOME-CLASSROOM-ITEMS条目；所有包SHA256/Renderer/Sprite/挂点ID均在items.json，原typetree在classroom-audit/areaitem050*.json。

例：望远镜包SHA256 `43ab17192c123731e9916594ca41715babd58efe7b7812e552f80baa9c7c30bb` → Renderer4516759715176253063、Sprite-7837391513762777256、119×143、pivot(.5,0) → 挂点Transform-1581527794336647225、(1986,-832.09998)。网页用现有背景sx/sy投影，并按原pivot扣除偏移；不是自行选择位置/大小。场景动态相机和排序仍为网页适配，不把静态序列化order当完整运行时算法。社区master仅定位bundle与挂点名，图片/几何来自设备包。构建、结构回归、真实浏览器图像加载/宽窄拖动/导航检查通过；本轮未重新录制设备教室。

### E18 · HOME-CHARACTERS / HOME-CHARACTER-BALLOON

后续跨页挂载与投影修正见E19；人物不再仅首页渲染，原资源/方向/脚本未改。

透明度补充：原AreaTalkBalloon prefab `0068713dcb71542b5b0836a70731a030` → CustomImage23/25/26 的Graphic.m_Color.a=0.9019607901573181（原raw偏移56，230/255），文字组件22的Graphic alpha=1 → `characters-audit/balloon-opacity.json` / `inspect_character_balloon.py` → `.character-surface,.character-balloon::after` opacity=原值。不对整个气泡或文字应用透明度；SVG先合成再整体减alpha，保持无内部接缝。构建、浏览器样式读取与截图验证，未新增原shadow层或修改自动循环时钟。

完整资源与方法体链见 [CHARACTERS.md](../pjskapk/CHARACTERS.md)。`area_sd/base_model` skel2649553002027659004 / `v2_base_model` skel2596513503481095065 → 每角色BuildData/atlas → `actionset/group0/2/27`原Details/ActionPaths/Balloons → `ASSET/characters/plans.json` → `home-characters.js`。每个原bundle的SHA256/path_id在source.json及plans.json，社区master只定位映射，不作本地原始数据替代。

`BuildSpineModel`0x6077874 + `.cctor`0x607D564的0.6缩放；`AreaClock..ctor`0x6053064的600与TickToTime0x604E9B4的300 → 2tick/秒；`UpdateDirectionSideView`0x607D258→`SpineModel.set_FlipX`0x4ACF414 → **右=4开启FlipX，左=3不翻转**；原组站位保证相向，不能用“负scale就是向左”的猜测。`ShowDependAreaClock`0x609FBDC的0.75×碰撞尺寸与ShowWords0x609F2A4读取的0.075秒 → 气泡锚点/逐字。原普通气泡bg_base_r30_wh Sprite border34，非绘制一张假游戏气泡。动作混合0.2来自SkeletonData。

网页适配：各世界固定选一组脚本；服装组0固定组1；当前只执行Stay路径；2D背景投影、Y排序与气泡排版；不实现剧情/VoiceId为空的语音/独立Emote/完整Unity道具遮挡。点击重播已撤销，原ActionPaths/Balloons时钟独立自动运行。原70×70的bg_base_r30_wh（file0dc323102e63fd84e9976e0a07463cd0/path_id1）border34 → drawSurface裁切四角并以18px显示，SVG单层白色中心重叠1px消除原CSS border-image接缝；角片显示尺寸从12增至18为网页适配。人物首帧加入地图转场等待，8秒兜底不变。设备游乐园截图/录像已保存，六世界真实浏览器检查原资源、原文、朝向符号、计时、共同pan、点击不导航、减少动画；结果在characters-audit/browser-results.json，不宣称全部动作逐帧复刻。

### E19 · HOME-PROJECTION / LIVE-SCALE / SCENE-WORLD-SYNC

LIVE-CARDS横向加宽补充：手机原贴图来源仍见E03，卡片源自CTF参考布局；按用户反馈仅将设计宽改`(手机clientWidth/s+800)/2`，使每侧留白减半，保留s、字号、高度。背景LIVE的right=9%防止越过原贴图屏幕右边缘，字体不变。这两个值为网页适配，不是新恢复的游戏字段；实测记录见SCENE-PROJECTION.md。

LIVE-CARDS后续按用户要求：统一等比倍率乘1.08，保持原手机相对中心/顶部锚点；“开始阅读”与READING/SOLO LIVE背景字为博客适配。背景字从CTF ghost SVG换为SekaiRodin描边文字（112px/2px描边为设计面适配），不冒充原游戏文本资源；图标未变。

原各world的scene/items.json中Sprite size/scale/pivot及path_id，人物RVA0x607D564的等轴0.6 → 旧网页背景盒固定高且min-width撑宽产生sx≠sy → home-world.js/reframe用单一cover倍率，保留原挂点、朝向和比例。不是改原素材。手机内容800×720和CTF卡片为网页参考布局，原独立X/Y改min统一倍率；外框仍可拉伸。layout.ejs把内页背景由旧area1换为存储中的当前SEKAI，Hexo is_home区分档案页。详见[SCENE-PROJECTION.md](../pjskapk/SCENE-PROJECTION.md)。

内页当前CSS合成blur4/8px为网页适配，不宣称等同原UIEffect卷积；旧street捕获通路不运行，原暗度/点阵仍运行。六世界四视口人物/物品等比、背景覆盖、七类页面同步、手机统一缩放矩阵与截图检查见verify-scene-scaling.cjs。

### E20 · POST-QUOTE / POST-CODE / POST-NAV

FX-BACK相关新规则另见E21。

POST-CATEGORY-ACCENT素材链：`game-assets/icon_tab_unit_{vs,ln,mj,vb,ws,25}_on.png` → 不透明彩色像素众数RGB → READER-PRESENTATION.md六色表 → post.ejs categoryPalette → reader-card::before / article-head border-bottom。采用当前网页大类与图标映射，原图颜色不代表原游戏有博客分割线组件；未追加原Prefab字段结论。

无对应游戏Prefab/方法体：引用、代码语言/行号/折叠和上一篇下一篇为博客业务排版，不能以网页CSS反证游戏实现。Hexo highlight.js生成figure.highlight语言class和gutter/code表格 → reader.js提取语言、添加展开状态 → refinements.css不透明引用底色、按位数行号宽与有限代码视窗。具体参数、3处源文章链接修正和浏览器测试见[READER-PRESENTATION.md](../pjskapk/READER-PRESENTATION.md)。未修改原场景模糊或任何游戏素材。

### E21 · FX-BACK 固定上级场景

后续普通页面采用E22常驻场景，不改变本条固定路由。

原返回图标`game-assets/icon_back_wh.png`继续挂载；正文/选文/阅读入口映射固定父级，地图/好友回首页，属于用户要求的博客适配，不宣称这些路由来自Unity方法体。layout.ejs计算backPath，post.ejs正文侧栏回search，main.js删除history.back事件拦截。无新的游戏数据结论，完整跳转表及验证记录见NAVIGATION.md。

### E22 · NAV-SHELL

FX-BACK最新实现：原icon_back_wh.png不变，固定父级映射不变；Navigation.entries/currentEntry筛选最近同源父级，traverseTo允许浏览器恢复历史文档。不存在匹配时保留sekaiNavigate。世界信息同时存History和Navigation state，main.js检索状态replace保留已有state。API与缓存策略为网页适配，不是Unity算法。Playwright coreBundle默认含--disable-back-forward-cache，原诊断不能代表普通Chrome缓存能力；此次去掉该测试参数，实测跨文档persisted=true、原window标记仍在，见verify-fixed-parent-history.cjs。

HOME-PAN选择冲突补充：原图/场景投影不变；浏览器默认文字选择、原生图片拖拽没有对应Unity操作。refinements.css仅主页禁用user-select/user-drag，home-world.js主页dragstart取消、背景pointerdown preventDefault（先排除可点击入口）。这是网页输入适配，不冒充原游戏数据；验证见PAGE-ROUTER.md。

持续帧率补充：见ANIMATION-PERFORMANCE.md。原mesh30顶点/18面来自effects.json，但home-effects.js按54个面顶点重复rotate/法线计算是网页算法，并非原游戏方法体。隔离浏览器CPU profiler与开关对照确认其主线程开销；此诊断不新增游戏参数，也未修改效果。此前资源复用测试不等于动画性能验收。

性能适配，没有新的游戏方法体证据。E07树/E11–17场景/E18人物对应的同一原始资源和现有canvas保留，page-router.js只替换页面UI；因此没有用CSS自制场景代替原资源。register/scope负责页面模块清理，AbortController/12页HTML缓存/120ms内容显现均为网页参数，不冒充Unity返回栈或加载算法。地图/世界切换仍走E12原有网页转场。修改原因、文件、触发/结束状态、原流程实测和新浏览器验证见[PAGE-ROUTER.md](../pjskapk/PAGE-ROUTER.md)。

```text
证据ID / 关联场景与效果ID：
游戏版本或资源包SHA256：
原包、完整节点、path_id / 类.方法及RVA：
字段/算法原文或解码值（带单位）：
本地证据文件、JSON字段路径或检索键：
提取/复查命令：
为什么采用这种网页实现：
网页文件/函数/选择器及对应参数：
原值 → 网页值的换算与偏离理由：
证据等级：原数据 / 方法体已审计 / 设备观察 / 推断 / 未找到
验证与剩余差异：
```
