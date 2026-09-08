# Project SEKAI 6.8.1：本地 UI 素材与动效分析

分析日期：2026-09-05。目的：为现有 Hexo 博客提供来自游戏安装包本身的参考，不依赖其他网站的模仿稿。本轮没有修改主题，没有提交或推送 GitHub，也没有运行游戏代码。

## 1. 来源与方法

实际找到的文件是 `D:\WorkSpace\blogs\blogtheme\pjskapk\プロセカ_6.8.1.apks`，并非 `プロセカ\_6.8.1.apks`。

- 文件大小：210,398,654 字节。
- SHA-256：`b663b7f195aa437f6e67b5c6a6797fc04404e499a756639b4fe073f20018e2ed`。
- APKS 内包含 base.apk、UnityDataAssetPack 和 arm64 配置分包。
- JADX 1.5.3 解码资源、核对 AndroidManifest：包名 `com.sega.pjsekai`，版本 `6.8.1`，versionCode `300127`。
- 使用隔离 Python 环境中的 UnityPy 1.25.3 解析 Unity 数据；主体序列化文件记录版本 `2022.3.62f2`，少量为 `2022.3.54f1`。
- 本次重点是 Unity 的 Sprite、Texture2D、AnimationClip，而不是把 JADX 生成的 Android 外壳代码误当作 UI 实现。

这能证明素材存在于此版本包内，但不能证明每个素材都在当前主界面使用。包内可能保留旧界面、活动界面和调试资源；未在设备上运行游戏，也尚未逐个对照新版本实机截图。联网下载资源也可能不在安装包中。因此以下区分“提取事实”和“博客设计建议”。

## 2. 产物入口

所有生成文件在 `analysis-6.8.1/` 下，仅供本地查看：

- [素材预览 1](analysis-6.8.1/contact-sheet-01.png)、[素材预览 2](analysis-6.8.1/contact-sheet-02.png)、[素材预览 3](analysis-6.8.1/contact-sheet-03.png)：共 87 个独立 Sprite，标注名称与像素尺寸。预览卡片的深紫底色是人为添加的查看背景，不是游戏截图。
- `images/Sprite/`：拆分、还原透明通道的按钮、图标和纹理 PNG。
- `images/Texture2D/`：36 张纹理，包括 Common、TopMenu、MenuTop、Background、Frame、Transition、Story、Live 等相关打包图集。
- [导出索引](analysis-6.8.1/export-index.json)：原始文件、path_id、名称、PNG 路径、尺寸、Sprite 切片边界等。
- [动画摘要](analysis-6.8.1/animation-summary.json)：29 个动画的运行时时长、采样率、绑定和数值变化。
- `animations/`：对应的完整 AnimationClip 类型树 JSON。
- `jadx/resources/AndroidManifest.xml`：解码后的版本证据。
- `objects.json`、`summary.json`、`scan-errors.json`：扫描清单与统计。

扫描 7,012 个文件，识别 616,478 个对象头，其中 Texture2D 868、Sprite 2,800、SpriteAtlas 49、AnimationClip 390、AnimatorController 222、Font 10。它们是对象数量，不等于独立视觉设计数量。最终选取 162 个对象，导出 123 张 PNG、29 份动画 JSON、10 条字体元信息，所选导出无失败。

限制：文件级扫描失败为 0，但有 185,995 个 MonoBehaviour 无法按现有类型信息完整反序列化。因此没有还原所有自定义组件、完整界面布局和交互逻辑，不能把“识别对象头”说成“完整反编译成功”。

## 3. 从原始图片确认的设计元素

| 提取事实 | 博客可采用的做法（建议，不是原始参数） |
| --- | --- |
| `btn_round_h80_gn` 的不透明主体色是 `#77eedd`；Sprite 为 106×96，左右切片边界均为 51 | 用作主操作按钮和选中态；CSS 绘制可伸缩胶囊，不把 PNG 原始宽度当网页按钮宽度 |
| `btn_round_h80_wh`、`btn_round_r16_wh` 等有白色圆角主体和深色偏移阴影 | 搜索、返回、分页统一按钮层次；保留轻微阴影，避免所有控件都做成发光玻璃 |
| `bg_common`、`bg_common_color`、`bg_common_3` 为灰紫色渐变背景；有微弱点阵 | 外围背景保留灰紫与浅青层次，正文阅读区用干净高对比底色 |
| `bg_common_ptn_dot_s` 是 8×8 纹理；还有渐隐点阵条 | 用 CSS 重画重复点阵与渐隐遮罩，无须加载大背景图片 |
| 多个 `btn_menu_*` 为文字、图标、描边英文一体的合成图片，有 192×152、192×184、392×184 等规格 | 首页做大小不等的功能入口卡片：文章、归档、标签、关于；标题和英文副标题使用真实 HTML 文本 |
| 菜单卡片常见深底浅字标题、粉色强调、背景描边英文、圆角框 | 用于首页入口与分类卡片，不用于每段文章内容，避免阅读噪声 |
| `icon_back_wh`、`icon_search_h34_wh`、`icon_menu_wh`、关闭图标具有一致的粗线条 | 用自绘 SVG 统一搜索、返回和菜单图标，保留可访问名称与键盘操作 |
| `tex_common_tri_01/02/03` 包含实心、空心和模糊三角形；`tex_tap_texturesheet_1` 包含圆环序列 | 点按反馈可重做为短暂圆环扩散与少量几何粒子，仅作用于交互按钮，不追踪所有鼠标移动 |
| `tex_transition_*` 包括粒子、圆环、几何图形及方向性遮罩 | 需要时做一次轻量页面遮罩，不直接将整个大图集作为背景反复播放 |

Sprite 的尺寸包含素材边缘、阴影或透明留白；必须结合切片和目标布局理解，不能按图片像素逐一照搬到网页。

字体对象中识别到 FOT-RodinNTLGPro-DB / EB、Orbitron 多种字重，以及其他字体。只记录名称，没有导出、安装或嵌入字体文件；不能仅凭存在就断言所有字体都用于正式 UI。后续网站使用有合适网页授权的替代字体，保留粗标题与数字字体的角色分工。

## 4. 实际动画数据

下列时长来自 `m_MuscleClip.m_StopTime - m_StartTime`，不是观看视频的估算。采样率均为 60；这不意味着网页需要固定 60 帧。

| 动画名称 | 片段长度 |
| --- | ---: |
| `clip_scenario_menu_open` / `close` | 166.667 ms |
| `clip_mysekai_talk_menu_open` / `close` | 166.667 ms |
| `clip_MusicScoreDetailInfoView_slide_in` | 250 ms |
| `clip_MusicScoreDetailInfoView_slide_out` | 216.667 ms |
| `cl_cheerful_room_select_phone_open` | 300 ms |
| `clip_home_menu_bar` | 333.333 ms |
| `anim_transition_v2_02` | 416.667 ms |
| `anim_transition_v2_01` | 4,000 ms |

动画编辑器曲线数组为空，但运行时的 streamed/dense 数据、绑定与值差仍在，并非“没有动画”。绑定中有哈希标识，尚未全部还原到具体控件属性；不能宣称已提取精确 CSS easing、位移方向或游戏实际播放速度。Animator 状态速度、混合、触发时机仍可能改变实机体验。文件名中的 v2 也不能单独证明它就是此次更新引入的主转场。

移植建议：菜单/筛选 170ms 左右，侧栏 250–300ms，少量大型切换 330–420ms，以 `transform` / `opacity` 实现。默认不使用 4 秒以上的转场阻塞浏览。开启 `prefers-reduced-motion` 时取消粒子、滑动和遮罩。以上是网页适配方案，不冒充对原始曲线的逐帧复刻。

## 5. 后续博客落地顺序

1. **基础组件**：提取主题色 token，重做白色/青色胶囊、深色阴影、搜索和关闭按钮。保持现有 URL 和页面跳转关系。
2. **首页入口**：参考游戏菜单卡片的大小层次和标题排版，映射为文章列表、归档、分类、标签、关于。不要复制充值、角色编队等与博客无关的入口。
3. **菜单与搜索**：抽屉或弹层用 170–300ms 的短动效；处理 Esc、焦点返回、移动端操作。优先使用网页语义元素。
4. **阅读页面**：仅保留标题、目录、上一篇/下一篇的游戏式装饰，正文保证行距、文字对比和连续阅读。
5. **可选反馈**：最后加入按钮点按圆环和局部几何粒子；页面跳转仍保留原生链接与浏览器后退能力，不为效果强制改成 SPA。

推荐先完成 1–3，再用新版实机截图核对布局与出现位置。本轮的价值是提供真实素材语言、可查证颜色和动画时间基线，而不是直接把游戏 UI 当作网页模板。

## 6. 复现

在项目根目录 PowerShell 执行（已创建的隔离环境，不需要 pnpm）：

```powershell
.\pjskapk\analysis-tools\Scripts\python.exe pjskapk/analyze_assets.py prepare
.\pjskapk\analysis-tools\Scripts\python.exe pjskapk/analyze_assets.py scan
.\pjskapk\analysis-tools\Scripts\python.exe pjskapk/analyze_assets.py export
.\pjskapk\analysis-tools\Scripts\python.exe pjskapk/analyze_assets.py details
```

扫描会花较长时间并产生较多本地文件。`details` 应在 `export` 后运行。脚本为 [analyze_assets.py](analyze_assets.py)，依赖 UnityPy 1.25.3 与 Pillow 12.3.0。

`pjskapk/.gitignore` 已忽略游戏压缩包、隔离环境及整个生成目录，避免意外提交游戏资源。分析脚本和此文档可以单独保留；直接发布游戏图片或字体前需要另行确认使用许可，优先以 CSS/SVG 重做通用形状与效果。
