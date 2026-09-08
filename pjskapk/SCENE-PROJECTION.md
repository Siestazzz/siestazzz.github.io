# 场景等比例与跨页背景（2026-09-08）

效果ID：HOME-PROJECTION、LIVE-SCALE、SCENE-WORLD-SYNC。

## 来源与原因

原场景Sprite的size、scale、pivot、position、Renderer path_id与包SHA分别在`game-assets/map/areaN/scene.json`和`items.json`；详见CLASSROOM/STAGE/AREA8/AREA9/AREA10.md。人物原`spineCharacterScaleRatio=(0.6,0.6)`来自AreaObjectCharacter..cctor RVA0x607D564，已审计记录见CHARACTERS.md。原人物X/Y应同倍率，不应被浏览器窗口比例再次拉伸。

旧`.unknown-ground`固定height110%，同时min-width125%。宽屏时后者撑宽图片盒子，`sx=盒宽/坐标宽`与`sy=盒高/坐标高`不再相等；物品和人物继承后变扁。现在`home-world.js/reframe`使用单一`s=max(视口宽×1.25/坐标宽,视口高×1.1/坐标高)`，图片宽高均乘s、纵向居中；原横向pan夹紧保留。因此所有原挂点与图层共用同一投影，sx≈sy。覆盖系数1.25/1.1和响应式夹紧为网页适配，不冒充Unity相机方法体。原角色朝向、动作、气泡alpha230/255和自动循环不变。

第二页`live-menu.js`原本对800×720内容分别算X/Y，直接导致字体/图标压扁。现在单一`s=min(手机宽×0.8/800,手机高×0.4/720)`；内容水平居中、top12%不变。手机外框仍独立宽高变化，内容等比缩放并留空白。卡片来源依旧是用户选定的SekaiCTF参考站，不是本机游戏素材；见`game-assets/sekai-ctf/SOURCE.md`。上述800/720/0.8/0.4是现有网页布局参数。

## 跨页同步

第二页后续文案/尺寸修正：用户要求适当放大，统一倍率在原min公式上乘1.08，手机外框不变；标题“开始阅读”，背景英文用当前SekaiRodin字体描边渲染READING/SOLO LIVE。1.08和英文文案属于博客适配；原CTF ghost SVG仍在资源目录但不再挂载，原图标继续使用，未宣称这些词来自游戏资源。

该次修正已构建并用真实浏览器检查1280×720、1920×700、699×842统一缩放矩阵、两处背景英文及开始阅读链接；截图`characters-audit/live-cards-labels.png`已查看，音游仍不可进入。

`layout.ejs`除地图选择页外统一读取`sekai-home-world`，挂载`_partial/home-world`及同一场景/粒子/角色脚本。阅读、选文、正文、友链、标签、分类、档案、关于页不再使用旧area1街景。非主页不接受背景拖动，不替换各页业务内容。使用Hexo `is_home()`区分首页与同样使用index布局的档案页，避免档案页误用无模糊首页样式。

主页不模糊；非主页当前合成场景使用CSS blur(4px)，选文/正文blur(8px)，原点阵和暗度层保留。**4/8px是网页合成适配，不是原UIEffect两遍卷积，也未证明与其逐像素等价。**旧street.ejs、street-pan.js、street-blur.js仍在源码中，当前页面不再挂载street-scene，其原area1捕获/卷积通路不运行。原模糊方法分析作为历史证据保留。角色时钟在新文档重新启动，未同步到跨页同一帧。

## 验证

2026-09-08 LIVE-CARDS横向留白修正：保留`s=1.08×min(W×0.8/800,H×0.4/720)`及文字/卡片高度，内容设计宽改为`(W/s+800)/2 px`，实际宽即`(W+800s)/2`，左右间距严格为上一版的一半；不是再次整体放大。手机背景LIVE保持字体大小，right从桌面2cqw改为9%，移回屏幕内。来源仍为CTF参考布局/原手机贴图，新增公式和9%为用户要求的网页适配，无对应游戏原字段。

本次构建通过；Chrome在1280×720、1920×700、699×842实测每侧留白分别86.30→43.15、266.50→133.25、28.56→14.28 CSS px，设计面标题仍56px、统一倍率不变。查看`pjskapk/live-width-1280.png`和`live-width-699.png`截图，背景LIVE收回手机内；未重新操作游戏设备。

`npm.cmd run build`；`node tools/verify-scene-scaling.cjs`。六世界分别在1280×720、1920×700、800×900、699×842检查sx/sy、每个物品及人物缩放比例、背景覆盖；七类页面读取同一world且无旧street-scene；第二页四视口矩阵X/Y相等。截图`characters-audit/live-world-sync.png`、`wide-world-scale.png`。本轮不重新录制设备；修复网页投影问题，原资源不变。
