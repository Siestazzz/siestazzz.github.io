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

### 2026-10-16 · POST-COVER-EMPTY / FRIENDS / AUDIO-DEFAULT

按用户补充恢复选文列表和手机预览的空封面框，span/div代替img，不请求封面，不恢复jacket-blur模块；列表选中时仍显示原CSS频谱，未选中显示空框。框使用2px半透明白边、3px圆角、白色8%底，均为网页适配。移除入口title-entry-note“个人博客 · 非官方同人页面”，无许可证文件/技术证据文档删除。友链仅保留RinpoStk和JuicyMio及用户给定远程头像；未给简介用“这个人很懒，没有留下他的介绍”，JuicyMio简介Happy hacking。site-audio.js每次文档初始化enabled=true，不再读取旧localStorage静音偏好，仍立即unlock，受浏览器autoplay策略限制；当前页静音、增益与原循环点不变。验证见对应证据最新条目。本轮不提交/推送。

### 2026-10-16 · BLOG-STATS / POST-COVER-OFF

用户要求：阅读门槛由5000ms改为30000ms（statistics.js），前台累计计时、后台暂停和软导航卸载不变；30分钟去重不变。这是前端策略，不代表后端验证真实停留。
文章封面停用：10篇front matter去掉cover、search-index不输出cover；main.js不创建列表/预览封面或加载fallback；列表保留已有CSS频谱，未选中静态低透明，选中沿用原频谱动画。search.ejs删除phone-jacket-wash，layout不再加载jacket-blur.js；历史代码/样式保留但未挂载。旧大厅精选轮播也移除封面和正文首图fallback。正文内图片、世界背景、Live2D不变。source/images/post-covers原图本地保留，Hexo exclude且Git忽略，不输出/推送；重新clean/build去掉生成目录旧封面。网页自制性能取舍，不冒称游戏本来没有封面。验证结果见本轮交付及证据文档对应条目。

### 2026-10-15 · BLOG-STATS（网页自制）

本日防护升级：Worker原D1限流改为READ_LIMITER 120次/IP/60s、WRITE_LIMITER 60次/IP/60s，在所有数据库操作之前检查；限流是Cloudflare各节点近似窗口，不是全球精确限额。GET快照使用Cache API缓存60s，内部键固定且忽略查询参数，缓存只含JSON数据，响应按Origin重新附加CORS。数字最多延迟约60s，不在每次POST后清缓存。STATS_WRITES_ENABLED必须为字符串true才接受写入，false只停统计不影响阅读和查询；缺少限流绑定/密钥则503拒绝，不静默绕过。旧rate_limits表保留但不再新增记录，清理仍兼容旧数据。详情/云端交付记录见证据文档BLOG-STATS防护升级。

防护交付验证：正式Worker版本7983fbde-44aa-4845-a696-36505747f72d已部署，线上GET缓存/非法写拒绝通过，正式计数和receipts仍0；真实写入/去重/读写429/停写在独立测试D1验证通过。测试环境停写保留，正式原KV/密钥/日志/关闭预览设置保留，新增每日Cron。未部署博客/提交Git；下方“未部署”指早期基础接入阶段，当前以本条为准。

- 文件：`themes/sekai-next/source/js/statistics.js`、`main.js`、`layout/layout.ejs`、`layout/post.ejs`、`scripts/search-index.js`；服务端 `workers/statistics/worker.mjs`、`schema.sql`。
- 数据：D1 `DB`，数据库 `siestablog`。原 `sekai-demo-views` 不再读写，也不导入。10 篇文章固定 `stats_id`，修改标题/日期不改变 ID；新文章添加唯一 ID 并同步 SQL 白名单。
- 触发：正式 origin 可见页面计 visit；正文可见累计 5000ms 计 read。同浏览器/同文章 1800s 去重；服务端 receipt 条件 upsert + trigger 原子更新。UUID 存浏览器，服务端仅保存 HMAC；清缓存/跨设备不视为同访客，不宣称独立人数或完全防刷。
- 生命周期：软导航卸载清理 timer/visibility listener；选文、搜索、切换分类不计阅读。快照最多每 30000ms 拉取一次，事件后刷新；仅改计数字符，不重建场景和列表。请求超时 8000ms，失败保留已确认数字或“—”。本机及非正式 origin 不请求/不写入。
- 统计接口：GET `/stats` 返回 visits/reads/文章字典（上限500篇），POST `/events`；限流见上方本日升级，1024字节请求体限制、文章白名单、精确 CORS。IP 不落库，限流key为按日HMAC；定时清理24小时以上receipt和过期限流记录。CORS不是身份验证，公开接口仍可能被伪造请求刷量。
- 当前界面原“阅读量”显示全站 reads，列表和正文显示文章 views；visits 已统计但没有新加界面槽位。旧测试值不再显示。
- 验证：Hexo构建、Node语法检查及本地SQLite接口测试通过；`tools/verify-statistics-browser.cjs` Chromium隔离fixture通过：计数展示、5秒阅读、软导航卸载、重复进入去重、localhost禁用。`git diff --check`通过（仅已有CRLF提示）。未部署远程Worker、未向云端写计数；无新视觉动画，不需要游戏参数对照。
- 云端安装步骤见 `docs/GAME-IMPLEMENTATION-EVIDENCE.md` 的 BLOG-STATS 条目。本次没有修改页面路由。

2026-10-13 PROFILE / SEARCH / POST-COVER：资料角色改Reverse/Mobile/Agent、简介“这个人很懒”；移除STATUS项，2个计数用原ONLINE绿#139d91，PLAYER PROFILE字号15–19px、简介19–24px。搜索外框改14px圆角/细白边/浅底，原放大镜缩至25px，按钮10px圆角，仅按钮hover青色；位置与筛选逻辑不变。10张封面保留像素尺寸，tools/compress-post-covers.py按原字节50%预算转换WebP，文章cover与来源映射更新，原图保留，正文不动。上述为网页适配，无新游戏字段；验证记录见TAXONOMY-UI.md。

2026-10-13内容清理/封面：移除hello-world、build-a-small-tool、weekend-city-walk三篇demo源文，本地备份backups/demo-posts-20261013。其余10篇front matter添加固定cover，从用户D:/Pictures/壁纸中取10张不同图片（优先较小文件，排除截图名），原样复制至source/images/post-covers；sources.json保存映射。原壁纸不修改，正文图片不变。选文及手机预览沿用既有cover读取，无新动画。friends.js成功复制无文字提示，失败反馈保留。按要求本轮仅清理生成缓存并构建，不看图。

2026-10-13 FRIENDS-EMPTY-TEXT精简：移除交换欢迎/说明、联系未配置及底部互链提示，白字半透明灰紫描边仅保留在“友链示意”标题（空列表原提示仍可用）；信息卡四角12px。friends.ejs/friends.css，网页适配，无新动画。构建/友链专项通过，桌面已检查；详见FRIENDS.md。

2026-10-13 FRIENDS-EMPTY-TEXT：参考原NoneInfo / CustomTextMesh245与DB SDF Empty材质，交换页提示改白字半透明#44446680描边；中文SekaiHan补齐。居中最大680px信息卡/按钮，12px圆角，字号/3px描边是网页适配。原字段、path_id、CSS及验证见FRIENDS.md最新条目；构建和友链专项通过，桌面手机已检查。

### 2026-10-13 · FRIENDS-LINK / FRIENDS-EXCHANGE

友链前往悬停为pointer（局部!important覆盖全站default）；留言位置改显示description，未配置显示“暂未填写个人描述”，URL仅保留外链。称号DOM移除，素材/配置/CSS暂留不挂载。交换面板加12px圆角裁切及flex滚动区，修复标题盖角和内容高度计算；原bg_base_r20_wh切片与色值不变。已对照设备添加好友页和ApprovalPendingFriendList背景原节点，证据见FRIENDS.md最新记录。构建/专项浏览器验证通过，桌面手机截图已查看。

2026-09-20 ENTRY-TITLE-LOGO再次左移：WELCOME TO桌面left4%、手机≤700px left6%，以末尾E与主标题首个S大致垂直为目标；大小、高度及动画不变，网页排版参数。证据与验证见TITLE-ENTRY.md。

2026-09-20 ENTRY-TITLE-LOGO位置微调：entry-screen.css中WELCOME TO的left由19%→16%，大小/高度/动画不变，网页适配。详见TITLE-ENTRY.md最新记录。

### 2026-09-20 · ENTRY-TITLE-LOGO：WELCOME TO重绘

用welcome-to.svg代替普通small字体：参照原logo_all的几何蓝字/斜切白底片，紧贴标题左上；新字母为网页矢量重绘。left19%、width29%、translateY(-82%)，随heading原动画，没有新RAF。原Prefab96→Sprite2证据、258×44绘制参数、文件与偏离说明见TITLE-ENTRY.md最新条目。构建及入口回归通过，桌面/手机截图检查。

### 2026-09-20 · ENTRY-TITLE-EXIT / SEARCH-HOVER 调整

入口点击后移除“正在进入…”status节点，不改粒子/盖白/等待/揭白流程。搜索移除外层表单hover/focus-within底色，只保留搜索按钮150ms变色。entry-screen.js、refinements.css；网页交互适配，原游戏素材与参数不变。构建及verify-entry-search-feedback.cjs通过：退出无文字、输入框hover/focus背景不变、按钮变色。返回逻辑本次暂未改，等待明确“历史上一页”或“固定上级”。

### 2026-09-20 · ENTRY-TITLE-LOGO / TAXONOMY-HOVER / LIVE2D-VOICE

入口标题上方恢复小字WELCOME TO，沿用现有heading入场、SekaiRodin与原small样式（10–17px桌面clamp）；非原游戏文字。选文手机标签由span改a，Hexo search-index输出tagLinks真实路径，hover/focus青色背景#77eedd；搜索框hover/focus-within底色#dbf7f3，按钮#33ccbb，150ms网页过渡，减少动画关闭。单击标签→标签归档。

四人现有12条台词接入设备原语音，同记录assetbundleName/voice配对；ready揭示/点击播放，切页/换句/静音停止，gain .4。音频/代码/原path_id及网页差异见[LIVE2D-VOICE.md](../pjskapk/LIVE2D-VOICE.md)。构建成功，专项与入口回归结果见专题记录。

### 2026-09-20 · ROOT-ENTRY

根目录挂载ENTRY-TITLE，点击进入`/live/`；`/entry/`兼容保留。普通页面返回阅读主页改为`/live/`，保持常驻场景。layout.ejs按首页第一页或title_entry标记渲染；entry-screen.js更改目标；page-router.js排除根入口的软载入。原动画/素材/音效参数不变，仅网页路由调整。构建及verify-root-entry.cjs通过，已检查根入口截图；详见TITLE-ENTRY.md最新补充。

### 2026-09-20 · TAXONOMY-HOVER / PROFILE-AVATAR

标签索引、正文标签/分类链接新增150ms变色，分类卡按已有分类色25%混白；离开/失焦复原，减少动画模式无过渡。正文侧栏及标题分类改真实链接，单击进入Hexo分类列表。个人资料头像使用用户指定GitHub图片的本地副本。网页业务适配，非游戏悬停参数；详见[TAXONOMY-UI.md](../pjskapk/TAXONOMY-UI.md)。构建及verify-taxonomy.cjs通过，已查看分类悬停和手机头像截图。

### 2026-09-20 · AUDIO-BGM / AUDIO-UI

最新静音/入口声：进页即尝试播放（受浏览器自动播放策略），静音只gain=0，取消静音恢复.112，源和播放时间不重置。AUDIO-TITLE-ENTER由原内置包MenuCommon_Built_in.acb子流20 SE_TITLE_ENTER替代入口普通确认，预载、单次click触发，.12增益，原6.733秒尾声保留。源包hash/路径/网页差异见BLOG-AUDIO.md。

最新覆盖：声音按钮全站移右下（桌面26/20px，手机14/14px并兼顾安全区）；BGM及SE均乘上版音量.4，实际gain分别.112/.12/.064。原曲/图标/触发/循环不变，网页适配；来源及验证见BLOG-AUDIO.md。

验证：构建、声音专项、菜单与入口回归通过；桌面/手机截图检查。包含原循环点、连续导航不重启、选文/滚动SE限频、静音记忆、后台暂停恢复、菜单导航恢复按钮。未做实机听辨/完整游戏混音对齐。

全站左上BGM按钮（原vs音符+网页状态）统一开关BGM/音效；入口一緒に歌おう！、其他Our Town, Our Life。从设备缓存提取为本地Vorbis，按原HCA采样循环点播放；普通软导航同源续播，入口↔其他换曲。真实手势解锁、静音持久化、后台挂起，菜单inert/入口键盘适配。确认/返回/选文/正文滚动复用MenuCommon原波形；滚动64px/160ms、音量和业务映射为网页适配，不声称完整原游戏Cue混音还原。运行文件site-audio.js/css、layout.ejs，证据和边界见[BLOG-AUDIO.md](../pjskapk/BLOG-AUDIO.md)。

### 2026-09-20 · LIVE2D-CHARACTER / LIVE2D-TALK

最新布局/动作调度：台词框桌面宽72%→64%、left14%→18%，中心/字大小不变，窄屏原48%宽保留。删除可见后5秒强制Idle/normal，原台词动作自然结束，不主动换另一姿势；呼吸/眨眼保持，点击继续下一组。初始化隐藏Idle仍用于姿势准备。此为用户要求的网页适配，不是游戏定时规则还原；原动作资源不变。

最新验证：构建、四人首帧原Arm曲线对照、250ms线性淡入、台词点击/返回、减少动画/失败重试、入口遮罩等待及既有入口回归通过；一歌/初音截图已检查。实机本轮未取得有效角色入场录像，淡入依据为反汇编，详见审计文档。

**最新修正（覆盖下文旧预演/180ms结论）**：发现mulmotion.update只累加时间，旧45帧并未逐帧求解。现在warmPose直接步进internalModel.update并清delta，共90步后绘制才ready。LIVE2D-REVEAL改为游戏ShowCharacter方法体中的250ms linear；入口白遮罩结束/标签可见才揭示，避免提前播完。原函数RVA、证据文件、参数与实机录屏限制见[LIVE2D-REVEAL-AUDIT.md](../pjskapk/LIVE2D-REVEAL-AUDIT.md)。旧“任意参数非默认即首帧正确”的验证不足，新增原Arm恒定曲线逐项首帧断言。

LIVE2D-REVEAL：ready后画布及台词一起180ms ease-out从opacity0到1；隐藏预演不变，减少动画直接显示。`live2d-character.css`，纯网页入场适配，非已恢复游戏时长；不对整个stage淡入，避免加载提示参与动画。

本次首屏回归：构建、四角色ready时台词/动作配对、下一条切换（含相同表情）、返回/减少动画/失败重试及入口回归通过；一歌和初音ready截图已查看。没有进行游戏逐帧时间匹配。

首屏台词修正（覆盖下文仅预演Idle的初始化）：`live2d-character.js/select` 隐藏状态先预演基础姿势45×16.667ms，再启动talks.json第一条身体/表情并预演45帧，绘制后同时显示角色与配对台词；不再显示“点击角色”占位台词。CSS加载期间隐藏台词框，失败仍显示重试。后续点击从第二条继续，共用playTalk，清理并行动作通道预约以支持重复表情。两段预演共1.5秒模拟时间，并非等待1.5秒，也非游戏初始化算法。来源及验证见专题文档最新补充和E25。

同日后续：取消角色选择栏，进入阅读页随机一人；台词框移除姓名/三角并缩小；人物上移8%容器高，标题READING。模型在隐藏状态先应用原初始动作并预演0.75秒再显示，避免默认展臂姿势闪现。属于网页布局/初始化策略，不新增游戏字段结论。详见LIVE2D-CHARACTERS.md最新覆盖及E25；旧选择按钮回归不再适用。

最终验证：四人动作参数与台词配对、角色切换竞争、选文往返同模型/renderer复用、模拟后台暂停、手机与减少动画、MOC失败后重试通过；既有入口回归通过。未做游戏逐帧匹配或真实设备GPU帧率验收。

阅读页原镜音连静态图摇摆已替换为一歌/铃/连/初音四个可切换的原Cubism模型；一次一人，点击立绘或文字框按同条记录播放动作+表情并更新原日文台词。入口插画不变，入口遮罩期间不加载Live2D。原MOC/Texture2D/physics/Unity动作来自设备，台词配对来自社区master快照；不宣称网页眨眼/呼吸定时、5秒回待机、角色选择UI和历史季节台词筛选为原游戏算法。框架、数值、path_id、生命周期、实际验证及差异见 [LIVE2D-CHARACTERS.md](../pjskapk/LIVE2D-CHARACTERS.md) 与 E25。当前静态 len-standing CSS及旧台词数组残留但不挂载执行。

### 2026-09-20 · ENTRY-TITLE 新入口层

**最新循环修正**：ENTRY-TITLE-MOVIE的ended仅设置currentTime=226/30，等待seeked才play，避免ended状态下立即play将异步seek覆盖成从零重播。恢复标签页时若仍seeking也等待；循环不换src、不load、不重建人物/树，不重启标题动画。原帧值不变，这是HTML视频状态适配，见TITLE-MOVIE-AUDIT.md。

补充最终修复：事件门控单独不足，实测HTTP媒体seek落回0；改完整fetch一次MP4并用Blob URL确保本地可寻址，循环复用，退出abort/revoke。首播需缓冲约10.7MB，6秒超时回退保持；此加载策略为网页适配。自然循环连续时间采样取代原单点测试。

**最新排版覆盖**：用户要求撤销弧形副标题，现恢复普通em水平文字，移除SVG textPath；谱线素材不变，行星/星星仍2/3。主标题桌面clamp(24px,3.95vw,56px)、手机clamp(22px,5.95vw,39px)，letter-spacing由-.06em放宽到-.02em；副标题桌面clamp(27px,3.6vw,48px)、手机clamp(23px,6.9vw,34px)，字距.025em，保留700粗体与14/2px上下padding。纯网页文案适配，原视频/入场退出不变；详见TITLE-ENTRY.md最新条目。

**最新 ENTRY-TITLE-LOGO 排版**：行星/六星原图及内部坐标不变，ornaments外层以中心scale(.666667)。副标题改SVG textPath，415×65同谱线坐标，30单位Allura合成700、文字长度275，沿浅S曲线排字替代水平直排；谱线和谱号仍原图。仅网页排版适配，不声称该曲线来自游戏。入场JS仍作用外层em，视频和退出不变。见TITLE-ENTRY.md最新条目；构建/入口回归与桌面手机截图验证。

**最新已实现 ENTRY-TITLE-MOVIE（覆盖下面“尚未挂载”）**：layout.ejs的title-entry-movie播放原USM转码`game-assets/entry/title-background.mp4`。entry-screen.js开场2倍速，到原226/30秒切1倍，结束seek至226帧循环；1920×1190、30fps、527帧、约10.7MB。视频已含人物/树景/光粒，正常路径不再播放备用图WAAPI、white_moya/circle_eff，退出原碎片保留。后台暂停、恢复续播，离开释放src；6秒加载超时/播放失败用旧静态方案，减少动画不请求视频。副标题700字重，桌面clamp(25px,3.35vw,45px)、手机clamp(22px,6.4vw,32px)，上下padding14/2px令文字中心下移6px，五线谱本体不动。均为网页适配，非原字体数值。原数据与解码/验证见[TITLE-MOVIE-AUDIT.md](../pjskapk/TITLE-MOVIE-AUDIT.md)。

**最新资源纠正（ENTRY-TITLE-MOVIE，尚未挂载）**：设备实际 `title_screen/anniversary_5th_bg` 已取得，包含一段拆成24个TextAsset的原USM视频；TitleContent为live2ds=0、movies=1、loopPointFrame=226。解码预览确认入场后人物/树景/光粒仍在动。此前静态合成结论仅适用于网页使用的built_in备用包，不能描述原游戏完整入口。本轮仅调查，网页未修复；证据与限制见[TITLE-MOVIE-AUDIT.md](../pjskapk/TITLE-MOVIE-AUDIT.md)。

最新：六星改按原Star_mult子节点位置/尺度/PPU归一化，取消横排；行星同坐标组随字标缩放。白描边8px桌面/5px手机；副标题本地Allura手写体（OFL，替代字体非游戏原字体）。背景base用正确原scale索引3，tree用0；人物仍为原bg_after合成图alpha入场，不添加不存在于已解析Clip的肢体摇摆。详细坐标/映射/边界见TITLE-ENTRY.md最新条目及E24。

最新正式文案/装饰：标题SIESTA'S BLOG，去PERSONAL BLOG；TAP只留原Sprite灰底，移除外层CSS灰渐变。原logo_back行星Sprite、六颗星、完整彩色五线谱尾饰及独立高音谱号已挂载；不使用截图裁图。新尺寸与星星扩展时序属网页适配，原Mesh描画未实现。页面移除“本机演示计数”等字样，阅读量tooltip仍如实注明当前浏览器记录；文章正文技术内容不改。来源及验证见TITLE-ENTRY.md最新条目及E24。

同日标题更新（ENTRY-TITLE-LOGO）：原 logo Clip 的逐字 Y 轴翻转/alpha、整体 6→1 缩放、白闪曲线接入博客标题，仍随 introRate=2 播放。复用原三颗星与 colorobi 饰带；文字改紧凑深青色、白描边和彩色边缘。博客字形、排版与副标题为网页适配，非原游戏字体复刻；原最终合成 logo 与圆环 Mesh 未挂载。覆盖旧“标题仅淡入/原 logo 全未移植”的描述。文件、原节点/Clip、具体数值见 TITLE-ENTRY.md 最新标题条目及 E24。构建和桌面/手机入口回归通过，终态及白闪截图已查看；采样确认 1750ms 翻转、2000ms 白闪、2250ms 消退。

最新速度适配：用户要求开场更快，entry-screen.js introRate=2，原6.433333s压至3.216667s；树景/人物/白闪/标题/TAP及遮挡粒子同步2倍速。持续光点和点击后的退出碎片速度不变。head提前请求背景和粒子JSON；这是网页加载策略，不是原游戏数值变更。原曲线数据不修改。

本轮效果覆盖：ENTRY-TITLE-REVEAL现在挂载原white_moya两组40个遮挡粒子，原网格分布/2–5秒寿命/2×2图集/透明度和缩小曲线，让树景分块显现；不是40张独立树叶贴图。ENTRY-TITLE-AMBIENT改原circle_eff 3个/秒、3–4.5秒寿命，旧14个CSS光点不再挂载。ENTRY-TITLE-EXIT-PARTICLES新增原fx_title_start_effect三角/圆环/闪光，在开始后.25秒起按原burst发射；渐白改1500ms网页适配+350ms揭白。title-fx.js双Canvas分离普通alpha/发光合成，隐藏页停RAF、退出清理、减少动画不创建。投影、随机种子、UI粒子桥接与原shader仍为适配，非完整Unity还原；详见TITLE-ENTRY.md与E24。

最新路由覆盖：入口独立为`/entry/`（source/entry/index.md，layout live + title_entry:true），每次访问/刷新播放；`/`、`/live/`、`/map/`不挂载标题，不再使用sessionStorage接受标记。点击开始盖白→软导航`/`→350ms揭白，同一场景保留。显式进入或浏览器后退到`/entry/`采用完整文档加载，避免路由只替换main而漏挂入口。原素材/动画曲线不变，属于网页路由适配，详见NAVIGATION.md。

根目录首次播放ENTRY-TITLE-INTRO：原bg01/02/03三层，解码6.433s原Clip的缩放（.88/.8→1）、树景/人物alpha和白闪曲线，60Hz采样至WAAPI。博客标题替代游戏logo。ENTRY-TITLE-EXIT点击后650ms盖白、底层就绪后350ms揭白，时长为网页适配；随机场景复用不重建。visit.startedAt/sessionStorage控制同标签同访问不重复，深链不拦截；菜单导航、提前点击均清理动画。circle_eff装饰/呼吸、标题出现为网页近似；原white_moya雾粒子及游戏logo拼合尚未移植，不宣称完整逐帧还原。来源/path_id、参数、生命周期及实际浏览器/设备验证见[TITLE-ENTRY.md](../pjskapk/TITLE-ENTRY.md)和E24。此前“直接显示第二页”更新为“先入口层，接受后第二页”，不恢复旧大厅/地图。

### 2026-09-20 · FX-MENU 五项菜单

分类队标尺寸最新覆盖：52→64px，原网格列内居中，文字/卡片不移动。原队标素材不变，网页尺寸适配；构建/菜单分类回归及截图检查通过。

最新分类图标：categories.ejs删除数字圆标，改选文同映射的icon_tab_unit_{vs,ln,mj,vb,ws,25}_on.png；52×52px contain原图、不额外染色。分类名称/数量/路由不变，菜单宽度不变。来源和验证见SYSTEM-MENU.md最新补充。

最新宽度：桌面39vw/max750/min380px，padding18px–48px（2.5vw）；手机86vw。较上一版43.3vw再次收窄约10%，五项功能/200ms动画/素材不变。SC-OTHER分类页去三色循环，按选文分类及正文已有配色：CTF #33ccbb、Android #4455dd、漏洞挖掘 #88dd44、逆向工程 #ee1166、AI #ff9900、其他 #884499，作用collection-card编号底色。均网页适配；见SYSTEM-MENU.md。

同日缩小：system-menu.css桌面面板43.3vw/max832/min414px（较初版约小8%），内边距/间距/标题同步缩减；窄屏90vw、卡高108px。游戏素材/交互不变，为用户要求的网页适配，见SYSTEM-MENU.md；构建和菜单回归通过，截图查看。

保留友链/GitHub/分类/标签/个人资料，GitHub取配置同标签直达。实机查看原MenuDialog并导出Prefab及Sprite证据，按右侧半透明紫面板、白卡/深底标题/粉色图标/描边英文适配五项布局；main.js保留键盘焦点管理并令背景UI inert。system-menu.css开关200ms、五项重排/中文映射为网页适配，非原游戏算法。资源路径、原节点ID、参数与真实验证见[SYSTEM-MENU.md](../pjskapk/SYSTEM-MENU.md)及E23。本条覆盖旧普通侧栏描述。

### 2026-09-20 · ENTRY-READING / WORLD-VISIT（覆盖旧入口）

当前codex/game-menu首页直接显示原第二页，移除大厅/地球，/map/为阅读页兼容地址。地图选择和转场不挂载；旧文件存在不等于运行。六世界内页原场景/角色/粒子保留。visit-world.js首次随机，离开≥30分钟再次进入换另一个，15秒可见心跳，本次访问固定；正文→选文→首页，入口无返回。规则为博客适配，不是游戏功能；源码、参数、验证及来源边界见[RANDOM-VISIT-WORLD.md](../pjskapk/RANDOM-VISIT-WORLD.md)。下文大厅/地图条目是旧版本历史。

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
| 2026-09-20 | ENTRY-TITLE 开场速度 | 按用户要求统一2倍速，约3.2秒；遮挡与背景时钟同步，原曲线不变；资源预加载，验证见TITLE-ENTRY.md |
| 2026-09-20 | ENTRY-TITLE-REVEAL / AMBIENT / EXIT-PARTICLES | 原标题遮挡网格/图集与开始特效导出并接入，替换CSS光点；实机title-detail.mp4对照，构建、桌面/手机/提前点击/清理回归通过，截图已查看；仍有投影与shader适配边界 |
| 2026-09-20 | ENTRY-TITLE 独立路由 | 新增/entry/，首页不再门禁；开始软导航首页，进入入口完整加载重播；原素材曲线不变，浏览器验证见TITLE-ENTRY.md |
| 2026-09-20 | ENTRY-TITLE-INTRO / EXIT | 解码原streamed曲线并对应三张原图，补入场与渐白退出；实机两段录屏对照，build及Chrome桌面/手机、提前点击、菜单、同场景复用回归通过；截图目视检查；雾粒子/原logo拼合未完成，见E24 |
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
