# 常驻场景与局部页面导航 · 2026-09-08

效果 ID：NAV-SHELL、FX-BACK。属于Hexo网页架构适配，不是已恢复的Unity场景栈。

## 原因与范围

### 2026-09-09 NAV-VEIL 后续闪烁

用户修复重载后仍报告首页闪一下。CSS检查：首页filter从4px直接none，scene-dim及两层伪元素display:none；2/3页之间则保留滤镜与遮罩。因此调整为持续滤镜blur(0px)及遮罩opacity0，通过180ms ease-out连续变化，减少动画时无过渡。没有新增截图覆盖层、RAF或场景实例。原4/8px和暗度终态不变；首页最终完全清晰。两内页间也共用同一短过渡。此为网页适配，不是恢复游戏方法体。

build及verify-world-parent再次通过；verify-home-veil.cjs逐帧采样测得blur4→3.49→…→0，暗度.22→.192→…→0，display始终block；首页终态截图home-veil-clear.png实际查看。证明数值连续，不等于完成用户Chrome屏幕闪烁/GPU合成逐帧诊断；若用户仍见闪烁需进一步录制该环境，不能把本次修正当作全部历史性能问题已解决。

### 2026-09-09 同世界首页返回修复

eligible原来无条件排除world参数。地图进入首页为/?world=5；同文档traverseTo恢复它后，popstate→navigate→eligible=false→location.assign导致重新初始化。search→live没有此参数所以正常。现仅放行pathname为站点根且world等于documentElement.dataset.homeWorld的地址；真正换世界与/map/仍独立导航，父级匹配逻辑不变。脚本版本same-world-parent-2。

第三页read-start在有限高度flex预览中被默认flex-shrink压扁，现禁止收缩、保留原215×80px及按钮素材；超出内容沿用滚动。Chrome1280×720、1920×700、699×842实测height80；tools/verify-world-parent.cjs实际/?world=5→live→search→返回live→首页，零顶层文档请求，原document/scene/人物canvas保持、无pageerror。截图search-button-fixed.png查看；本轮无新游戏参数，未操作设备，不宣称消除首次加载成本。

固定上级href此前触发整页加载。Chrome本机实测/live→search→live资源约27/31/27MB，人物就绪约2728/2099/1605ms，HTTP首字节4–11ms；主要成本为重新装配场景、解码Spine、纹理上传与主线程长任务，而非路由字符串。浏览器后退并非必定命中BFCache，本次旧流程检测persisted=false。

`page-router.js`常驻，保留`.world-backdrop`及其中背景/粒子/Spine人物/树和全局点击特效；不重新执行home-world、home-effects、home-characters。替换topbar、menu-panel、menu-scrim、site-main，更新title/description/body页面class，模糊自然切换原4/8px，无首页模糊。固定上级href不变。body成为home-world事件宿主，但只接受game-home内的拖动和树点击；从内页首次软进入首页也能操作。

地图选择页和带world参数的世界切换仍使用原整页转场：它们有不同场景与资源生命周期，本轮没有改为软导航。不声称首次打开页面或实际换世界消除了资源初始化。

## 状态与生命周期

2026-09-08更新：`.game-back,.back-link`固定父级先查`navigation.entries()`中index小于当前且同源同pathname的最近条目。保留搜索条目的query；目标显式带query则须匹配。不同world的条目不恢复（显式参数及Navigation state）；DOM ready/page ready写入世界标记。命中后取消未完成软请求并traverseTo，失败或不支持/不命中用原软导航。不会因为此前到过好友页就退去好友页，也不会为追求固定目标而强制重载已存在的父级文档。

此前perf测试工具的默认启动参数含`--disable-back-forward-cache`（本地playwright-core/lib/coreBundle.js）；因此之前persisted=false不能解释用户普通Chrome的历史返回体验。`verify-fixed-parent-history.cjs`显式排除此默认测试参数后，实测跨文档首页→live→固定返回恢复原首页window标记且persisted=true。只有浏览器允许并保留历史文档时才命中，不承诺任何情况下都缓存；同文档切换仍是局部UI重建和场景复用。

版本入口`page-router.js?v=fixed-parent-history-1`；需刷新一次以加载新逻辑，不改现有粒子/模糊参数。普通Chrome旧页面完全卡顿的历史因果仍不宣称全部证实，但已补上“固定父级不妨碍历史恢复”的执行路径。

- 同源同站普通链接调用sekaiNavigate；外链、下载、新标签页、组合键、同页锚点维持原生。浏览器popstate软切换，固定返回始终沿父级，不调用history.back。
- 拉取HTML和需要的CSS完成前保留旧内容，仅顶部2px青线提示。成功后才替换UI，内容从opacity.75→1，120ms，减少动画时跳过。取消旧请求并用serial阻止迟到响应覆盖新页；失败回退原生导航。
- HTML按pathname内存缓存最多12页，搜索JSON共用一次Promise；查询参数仍从当前URL读取。刷新清空缓存，开发时内容改动需要刷新。
- 模块main/reader/live/home/friends/jacket使用SekaiPages.register与AbortController作用域。离页取消全局事件、定时器和reader RAF，断开ResizeObserver/MutationObserver，释放封面模糊WebGL上下文；其他DOM事件随旧节点退出。初始模板与全局重复引用只注册一次。
- 站内切换保持背景画布对象和动画时间；每页的轮播从初始状态开始，文章正常增加本机阅读次数。搜索无显式参数时恢复sekai-select-return的关键词/大类/文章，用户直接带参数时优先URL。
- 页面切换回顶部并聚焦main；章节锚点定位保留。浏览器前进/后退目前不恢复正文此前的滚动位置，而是回顶部。
- 样式按目标页面启用，旧页面专用CSS禁用；模板内样式移入head避免替换main时丢失。不手改public，不引入构建框架。

## 验证

新增`node tools/verify-fixed-parent-history.cjs`：历史key确实退回原search/live/home而非push新条目，中途friend被跳过，人物canvas同一对象；直接访问文章无父级时软回选文；开启正常BFCache行为后跨文档返回保留原window标记。既有verify-page-router三轮往返回归通过。此改动无新增视觉样式。

2026-09-08 HOME-PAN输入修正：仅body.page-type-index及子元素禁用文字选择，图片/链接禁用原生拖出；持久body的dragstart监听按主页class判断，背景pointerdown排除a/button/input后取消默认行为。背景仍在5px位移后平移，按钮正常点击，内页不禁文字选择。此修正为浏览器默认行为冲突处理，不修改原游戏素材/动画参数。

本次构建及Chrome1280×720实际鼠标验证：首页标题上拖动无选区且pan改变，图片dragstart被取消，阅读入口点击及软返回后重复拖动通过，正文user-select未被禁用。截图home-pan-selection-review.png已查看；未重新操作游戏设备。

`npm.cmd run build`、`node tools/verify-page-router.cjs`。Chrome1280×720从live→search→正文→返回，搜索关键词恢复、代码展开可用；3轮live/search/friends/home共12次切换，背景节点/人物canvas对象相同，已加载世界资源无重复请求，pageerror为空；浏览器前进后退不重建文档。本机两轮导航Promise耗时约55–231ms（不是首次完整场景加载或所有设备帧率保证）。

真实鼠标首页→live→首页再拖动背景成功；地图入口与返回首页按原独立导航通过。截图`pjskapk/router-live-review.png`在转场结束后查看。未重新操作游戏设备，未修改原游戏效果参数。
