# 常驻场景与局部页面导航 · 2026-09-08

效果 ID：NAV-SHELL、FX-BACK。属于Hexo网页架构适配，不是已恢复的Unity场景栈。

## 原因与范围

固定上级href此前触发整页加载。Chrome本机实测/live→search→live资源约27/31/27MB，人物就绪约2728/2099/1605ms，HTTP首字节4–11ms；主要成本为重新装配场景、解码Spine、纹理上传与主线程长任务，而非路由字符串。浏览器后退并非必定命中BFCache，本次旧流程检测persisted=false。

`page-router.js`常驻，保留`.world-backdrop`及其中背景/粒子/Spine人物/树和全局点击特效；不重新执行home-world、home-effects、home-characters。替换topbar、menu-panel、menu-scrim、site-main，更新title/description/body页面class，模糊自然切换原4/8px，无首页模糊。固定上级href不变。body成为home-world事件宿主，但只接受game-home内的拖动和树点击；从内页首次软进入首页也能操作。

地图选择页和带world参数的世界切换仍使用原整页转场：它们有不同场景与资源生命周期，本轮没有改为软导航。不声称首次打开页面或实际换世界消除了资源初始化。

## 状态与生命周期

- 同源同站普通链接调用sekaiNavigate；外链、下载、新标签页、组合键、同页锚点维持原生。浏览器popstate软切换，固定返回始终沿父级，不调用history.back。
- 拉取HTML和需要的CSS完成前保留旧内容，仅顶部2px青线提示。成功后才替换UI，内容从opacity.75→1，120ms，减少动画时跳过。取消旧请求并用serial阻止迟到响应覆盖新页；失败回退原生导航。
- HTML按pathname内存缓存最多12页，搜索JSON共用一次Promise；查询参数仍从当前URL读取。刷新清空缓存，开发时内容改动需要刷新。
- 模块main/reader/live/home/friends/jacket使用SekaiPages.register与AbortController作用域。离页取消全局事件、定时器和reader RAF，断开ResizeObserver/MutationObserver，释放封面模糊WebGL上下文；其他DOM事件随旧节点退出。初始模板与全局重复引用只注册一次。
- 站内切换保持背景画布对象和动画时间；每页的轮播从初始状态开始，文章正常增加本机阅读次数。搜索无显式参数时恢复sekai-select-return的关键词/大类/文章，用户直接带参数时优先URL。
- 页面切换回顶部并聚焦main；章节锚点定位保留。浏览器前进/后退目前不恢复正文此前的滚动位置，而是回顶部。
- 样式按目标页面启用，旧页面专用CSS禁用；模板内样式移入head避免替换main时丢失。不手改public，不引入构建框架。

## 验证

2026-09-08 HOME-PAN输入修正：仅body.page-type-index及子元素禁用文字选择，图片/链接禁用原生拖出；持久body的dragstart监听按主页class判断，背景pointerdown排除a/button/input后取消默认行为。背景仍在5px位移后平移，按钮正常点击，内页不禁文字选择。此修正为浏览器默认行为冲突处理，不修改原游戏素材/动画参数。

本次构建及Chrome1280×720实际鼠标验证：首页标题上拖动无选区且pan改变，图片dragstart被取消，阅读入口点击及软返回后重复拖动通过，正文user-select未被禁用。截图home-pan-selection-review.png已查看；未重新操作游戏设备。

`npm.cmd run build`、`node tools/verify-page-router.cjs`。Chrome1280×720从live→search→正文→返回，搜索关键词恢复、代码展开可用；3轮live/search/friends/home共12次切换，背景节点/人物canvas对象相同，已加载世界资源无重复请求，pageerror为空；浏览器前进后退不重建文档。本机两轮导航Promise耗时约55–231ms（不是首次完整场景加载或所有设备帧率保证）。

真实鼠标首页→live→首页再拖动背景成功；地图入口与返回首页按原独立导航通过。截图`pjskapk/router-live-review.png`在转场结束后查看。未重新操作游戏设备，未修改原游戏效果参数。
