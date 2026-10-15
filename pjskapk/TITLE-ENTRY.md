# ENTRY-TITLE · 2026-09-20

最新左移覆盖：WELCOME末尾E大致对齐SIESTA首个S，kicker left由16%改为桌面4%/≤700px手机6%，宽29%与纵向位置不变。手机因主标题字号比例不同单独微调；仅网页排版，不引入动画监听或原游戏参数结论。

本轮构建与verify-entry-screen.cjs通过，桌面1280×720及手机390×844截图已查看，E/S大致对齐；未进行游戏设备复测。

最新位置微调：`.title-logo-kicker` left从19%改为16%，向左移动标题容器宽度的3%（容器680px时20.4px），宽29%、高度/translateY均不变。用户要求的网页排版偏移，不是游戏原坐标；SVG及动画不变。

本轮验证：构建与verify-root-entry.cjs通过，已检查root-entry-review.png确认左移；未重复手机截图或设备比对。

## 最新：WELCOME TO几何字与白底片

重新读取原Prefab `188c6d7b97278b04d85321e2ae62cb9d`：SpriteRenderer96 / 节点logo_all → 文件`a7728392fc4670f48a36f2c83876ca7b` / Sprite path_id2，rect525×210px。原图检查保存在`analysis-6.8.1/title-original-logo.png`，其中Project SEKAI为深蓝几何字+斜切白色底片，并非普通UI字体配白描边。

新增网页自绘矢量`game-assets/entry/welcome-to.svg`：viewBox258×44，蓝字#005b85、白底折线、字形skewX(-4deg)；替换文案包含原字标没有的字母，因此不是原游戏字体提取。底片和字形依据原图视觉结构适配，没有假称原色采样或游戏Transform数值。

`layout.ejs` small.title-logo-kicker以img挂载，保留WELCOME TO可访问名称；`entry-screen.css`绝对定位left19%、top0、width29%、translateY(-82%)，紧贴主标题左上，不再占用额外grid行。随整个heading显现/清理，无新循环动画或RAF；原标题/星星/电影不变。上述百分比为适配博客新标题宽度的网页值。

构建成功，桌面截图已检查；入口回归包含新SVG解码及可访问名称，结果见总索引。

最新退出调整：删除entry-screen.js生成的title-entry-loading（“正在进入…”）节点，点击后仅播现有视觉过渡，等待/超时及路由不变。构建与verify-entry-search-feedback.cjs验证无此节点并能进入/live/；网页自制文字移除，不改变原动画数据。

最新文案：标题组左上恢复small元素，文本WELCOME TO，沿用现有SekaiRodin、10–17px clamp及白描边与heading入场；用户定制英文，不冒充原游戏Logo文字。原影片/星星/标题位置与参数不变。

## 最新：ROOT-ENTRY 根目录入口（覆盖旧URL记录）

- `/`现在渲染标题入口；`/entry/`兼容保留，两者点击进入均去`/live/`。阅读主页刷新不出现入口；深链文章等保持直接访问。
- `layout/layout.ejs`新增isTitleEntry：首页且current为空/1，或page.title_entry为true。此条件同时控制预载、title-fx、entry-screen启用与入口DOM。默认返回上级改为`/live/`，正文/分类归档等特定上级不变。
- `source/js/entry-screen.js`退出动画目标改root+'live/'；盖白/揭白、素材和音效数值不变，保留底层场景。
- `source/js/page-router.js`把根路径、root+'index.html'及原entry路径排除软载入，确保显式访问/浏览器后退能重新初始化标题。普通页面往返仍软导航，不引入入口重播。
- 纯网页路由适配，无新增游戏字段推断。原电影226帧循环点、粒子和音频证据不变。
- 验证：npm.cmd run build、verify-root-entry.cjs与更新URL后的verify-entry-screen.cjs通过；覆盖根入口、点击/提前点击进入、场景同对象、选文返回、阅读主页刷新、浏览器后退、兼容entry、原视频运动/循环/清理、菜单、手机减少动画和电影失败回退。已查看root-entry-review.png。未新增设备游戏录制。

## 最新：恢复水平副标题，文字略放大/疏排

按用户要求删除layout.ejs中SVG textPath，恢复普通em水平文字，原五线谱与高音谱号不变。主标题/白闪副本字号桌面clamp(24px,3.95vw,56px)，手机clamp(22px,5.95vw,39px)；letter-spacing从-.06em改-.02em。副标题桌面clamp(27px,3.6vw,48px)，手机clamp(23px,6.9vw,34px)，字距.025em，700字重，上下padding14/2px（恢复此前6px下移）。行星六星整体2/3缩放保持。

只改layout.ejs和entry-screen.css文字排版，以下弧形文字记录为已移除历史。没有新素材、游戏参数或动画逻辑变化，字号与字距均为用户要求的网页适配。

验证：npm run build与verify-entry-screen.cjs通过；已检查1280×720桌面、390×844手机截图，无文字溢出。断言已改为无SVG/水平文案/副标题正字距，原视频循环、退出及回退回归保持。未另做实机游戏对比。

## 最新：装饰缩小与谱线弧形文字

用户要求行星/星星缩小及解决文字浮在弯曲谱线上的问题。layout.ejs将副标题改为SVG textPath（可访问名称仍为原文）；entry-screen.css在ornaments原48%宽/left43%/top-110%的布局上加scale(.666667)，transform-origin:50% 50%，保留六星/行星内部坐标和原素材。

SVG viewBox 0 0 415 65与em背景同坐标；路径`M25 35 C105 23 129 26 190 40 S299 54 385 24`，startOffset50%、text-anchor middle、textLength275、lengthAdjust spacing。Allura合成700，font-size30 SVG单位，白描边1.8单位，em padding归零。文字随谱线同尺度变化，不再用固定下移6px的直排；原em入场动画继续生效，新增无RAF。曲线是目视原谱线后做的网页适配，不是原游戏参数。来源仍为本文件原星星/谱线出处，无新素材提取。

构建与入口回归通过，桌面/手机截图已查看；新增字符基线高度变化与装饰2/3缩放断言。原动态视频、循环、退出未改。未做原游戏逐帧排版验收。

## 最新：原动态视频已替换正常入口背景

人物/树/光粒持续运动来自实际下载包anniversary_5th_bg，不是built_in三张图。现已使用原USM转码title-background.mp4，原226帧循环；旧图层/intro粒子仅加载失败回退，减少动画静态终态。完整来源、提取脚本、数值、生命周期、验证见[TITLE-MOVIE-AUDIT.md](TITLE-MOVIE-AUDIT.md)。本次副标题稍大稍粗并下移6px（谱线不动）；Allura合成700字重、桌面clamp(25px,3.35vw,45px)，手机clamp(22px,6.4vw,32px)。这是网页适配，以下旧“静态人物”描述仅适用于备用路径。

## 最新：原星星坐标、加厚描边与手写副标题

实际验证：构建和入口回归通过；新增采样500/2800ms人物alpha、100/2000ms树景scale确认变化，六星top不共线、Allura实际加载通过；桌面/手机截图已查看，原退出/菜单/提前点击/路由回归保持。未新增实机逐帧录像，不宣称原Mesh动画补齐。

原Prefab188c6d7b97278b04d85321e2ae62cb9d中Star_mult位置(.219,.195)，六星local XY为(.307,.561)、(.964,.879)、(1.362,.975)、(2.208,.888)、(2.622,.718)、(3.079,.610)；scale均.36，Sprite像素宽99/113/87/93/179/101、PPU100。网页取消flex排一行，按共同4.5×2.6坐标窗（X原点-1、Y顶1.6）归一化，宽=像素宽/100×.36/4.5。行星同坐标窗使用原logo_back(.819,.225)、scale1.5、212×140、PPU108。整组挂在wordmark内随其入场缩放，组宽48%、left43%、top-110%是网页排版；只保留原相对布局，不声称完整Unity投影一致。

主字白描边桌面5→8px、手机3→5px；原装饰额外四方向1px白色阴影扩边为网页适配。副标题从Georgia改本地Allura手写体（Google Fonts ofl/allura/Allura-Regular.ttf，OFL许可随fonts/Allura-OFL.txt保存），非原游戏字体识别结论；原Memories字样是Sprite。字体23–42px，手机20–30px，保留原谱号/饰带。

入口动画核实：原背景Prefab7560…SpriteRenderer28–31均Sprites/Default，bg_after为合成人物插画；当前已解析Clip中bg_before scale索引0、bg scale索引3、bg_after alpha索引14、白闪19，没有独立人物肢体/背景持续形变曲线。本轮修正base误用tree索引0为自身3，并保留原分层显现/遮挡粒子/白闪/持续光点；没有伪造人物摇摆或宣称整套动画全部恢复。减少动画模式仍直接显示终态；相关未实现Mesh效果见前文边界。

## 最新：正式标题与装饰补齐

验证：build、verify-entry-screen.cjs通过（新标题、无PERSONAL BLOG、六星、行星/谱号资源有效、TAP外层无背景、无本机演示字样，及原入场/退出/提前点击/菜单/手机/路由回归）。桌面1280×720、手机390×844截图已查看。重启本地4100 Hexo以读取新站名；未部署或提交。装饰尺寸是网页适配，未做原Mesh动画逐帧复刻。

标题全站配置改SIESTA'S BLOG，去PERSONAL BLOG。原TAP Sprite已有小灰底，`.title-entry-start`背景改none，保留原图和呼吸。logo_back Renderer106→6be32414f5e695f47bc3321c8b20b8be/Sprite2的行星音符直接挂载在字后（width32%、left48%、top-90%，网页排版）；原六星均使用，新增Renderer122/107/95与Sprite3/5/4。沿用逐字/白闪，星星每50ms原时间错开扩展到六颗、仍除introRate2；扩展时序不声称为新恢复Clip。

五线谱之前只用colorobi简单线条。本次换2db94450cae9c364498878acb6b5244d/Sprite3(parts_2，含尾部装饰)完整Sprite，添加Sprite9(parts_7)高音谱号，背景contain而非拉伸裁切；em比例415/65。导出器和logo-provenance.json记录来源，未使用原Memories文字。其他subtitle与Mesh纹理仅导出对照，未挂载，不等于移植了Mesh描画过程。

全站UI删除“本机”“本机演示计数”“阅读量为本机演示计数”；保留tooltip准确说明浏览器内阅读记录，不宣称全站统计。localStorage旧键保留以免丢失访问记录；文章里的技术测试/示例不是界面占位文案，不改。非官方同人标识和未开放功能提示保留，避免误导。

## 最新标题：ENTRY-TITLE-LOGO

原图对照 entry-reference.png：紧凑深青字、白色描边和彩色边缘、上方小字、三颗星和下方饰带。原游戏字样为 Sprite，不是可直接输入博客名的字体。本次保持博客名，以 SekaiRodin + CSS 彩色边缘重排；英文副标题 Georgia 是网页选择，不宣称原游戏字体。桌面标题宽 min(62vw,680px)、bottom20%，手机90vw/bottom24%；主字22–52px，手机20–36px。用原 colorobi 背景饰带和三颗星，white_obi_gosenfu 仅导出未挂载。

证据：Prefab188c6d7b97278b04d85321e2ae62cb9d/GO38 anniversary_5th_logo；Clip fe9600cac223bf6479c00229834f9efc/AnimationClip1。执行 `pjskapk/analysis-tools/Scripts/python.exe pjskapk/decode_title_clip.py 188c6d7b97278b04d85321e2ae62cb9d fe9600cac223bf6479c00229834f9efc title-logo-timeline.json` 得到 entry/title-logo-timeline.json；`export_title_logo.py` 输出 logo-provenance.json、原星星/饰带 PNG，完整 Renderer/Sprite 链见 E24。

原 Logo/Logo_mult scale index90 在3.216667s为6、3.616667s为3.709326、3.8s为1.01728、4.05s为1；01_C Euler index60 的 Y 在3.216667–3.616667s从90°到0，alpha index118从0到1，后续字母逐个错开。Logo_add alpha index133 在3.683333s为0、4.05s为1.083107、4.216667s为0。网页用原三次系数，80个关键帧采样3.133333–4.45s，所有时长/延迟除2，14个原字母时序均匀映射博客字数；白闪alpha夹至1。原4.98s后切换最终组合贴图的消失不沿用，博客字保留。星星3.8/3.85/3.9s开始，150ms缩放0→1（原终态.36归一化，时间亦除2）；饰带与副标题4.1s后450ms由x=-12px/alpha0到终态，为网页适配。延迟阶段保持隐藏，退出取消所有动画，减少动画直接终态。未移植原 circle_mdl/02 环形 Mesh 和完整合成材质。

验证：build、verify-entry-screen.cjs 桌面1280×720/手机390×844、菜单/提前点击/场景复用/退出清理回归通过；终态与白闪截图实际查看。手动暂停 WAAPI 至1750ms，首字仍有Y旋转且flash=0；2000ms首字归正且flash=1；2250msflash=0。此为网页中间状态检查，不冒充逐帧游戏对齐或性能测量。未更改路由。

## 最新速度：开场2倍速

验证：build通过；verify-entry-screen.cjs改在开播400ms采样（旧1100ms采样在加速后可能已错过遮挡），桌面/手机、入场像素、退出清理和路由回归通过；本轮blog-entry-intro.png已目视检查。

用户要求动画快点：entry-screen.js introRate=2，原6.4333334秒Clip时长除2为3.216667秒，标题与TAP的时长/延迟也除2；title-fx.js仅mask/wash时间乘2，保证树景分块揭开与背景曲线同步。环境光点及点击退出速度不变；保留提前点击。原始JSON参数不改，此为网页适配。layout.ejs预加载3张背景与title-fx.json，timeline在head提前请求，不把资源预加载声称为已测得网络提速。

## 最新粒子补充（覆盖以下“未挂载white_moya/14个CSS光点/650ms退出”记录）

效果ID：ENTRY-TITLE-REVEAL、ENTRY-TITLE-AMBIENT、ENTRY-TITLE-EXIT-PARTICLES。

原背景Prefab的ParticleSystem18/20是两组各20个白色遮挡块；ShapeModule指向26164c16c48ac0f4094f89bb1c8d581d/Mesh2，20顶点24三角面；图集为c668210bb67ac5a45a35953ffc6e7bd3/Texture2D1 tex_5th_anv_ver，2×2。它们寿命2–5s，初始alpha.6–1，寿命alpha关键点0:1、.502:.930588、1:0，尺寸1–3与1–1.36，SizeModule由1缩至.892308；原片头在.016667s开、3.883333s关。PS21单张white 4s寿命补全白场，alpha在.26寿命时降至.307。这使树叶区域各自显现，不是简单整图同时淡入，也不是找到可独立摆动的树叶图片。PS16原circle_eff每秒3粒、寿命3–4.5s，替代旧14个自制循环。

开始特效原Prefab21812d99e497bd249b7b677175a9bb3c中fx_live_transition_v2_03_b/pt_outside的PS24/31三角及27/28/32/33光效已导出并挂载。原clip_title_start_effect_emit（e1e202e24129e8846ac2a18ad3185935/1）在.25s激活此节点。tri_02按20粒×2轮、间隔.15s且delay.2s；tri_03按原burst；原纹理tex_sekai_v2_02、tex_transition_01、tex_transition_03，不用CSS三角形代替。原字段保存在title-start-particles.json，激活Clip见title-start-activation.json。

实现：export_title_particles.py提取原数据/纹理/网格；build_title_fx.py缩减为title-fx.json；title-fx.js做mesh按三角面积采样、Hermite尺寸曲线、alpha梯度、旋转、图集切片。两个Canvas分别普通alpha和发光screen合成，DPR上限1.5，共用一个RAF。仅入口创建；后台停时钟与RAF，销毁取消RAF/监听并删canvas；减少动态效果不创建。entry-screen.js等待粒子资源后与背景Clip同起播，提前点击可直接退出；渐白1500ms linear（网页适配）后原350ms揭白。路由仍/entry/→/，未改变世界随机规则。

**仍有适配差异**：mesh坐标归一化到cover画面，发射形状为网页投影（退出unit=max(width,height)/35、中心50%/62%），随机序列不等于Unity；screen不是完整GLES加法及Tint实现，ClampVelocity/3D相机未复原。原退出renderer enabled=false且父pt_outside scale0，完整UI粒子桥接/运行时修改仍待核实，不能称已恢复全套游戏渲染。原logo拼合及背景PS17/19空材质绑定仍未移植。旧CSS光点代码残留但没有DOM挂载。

验证：新设备录像title-detail.mp4，入口/点击后8.4s起每.05s采样已查看；build和Chrome1280×720、390×844的verify-entry-screen通过，检查粒子Canvas真实像素、退出后清理、同场景复用、菜单/提前点击/返回重播。blog-entry-intro.png、blog-entry-exit.png目视检查，修复发光黑底方块。没有声称精确逐帧匹配或测得游戏退出Tween时长。

## 最新：独立入口页（覆盖下文旧访问门禁）

地址`/entry/`，源source/entry/index.md使用layout:live与title_entry:true。只有这一页挂载入口；根目录、/live/、/map/直接显示阅读页。每次打开/刷新入口均重播，不再读写sekai-entry-accepted，visitId只留随机访问模块自身兼容。开始盖白后创建独立白遮罩、软导航首页、350ms揭白移除，原场景对象复用；菜单导航不变。浏览器后退或链接进入/entry/使用完整文档加载，让入口初始化正常重跑，不在软导航中遗留旧动画。路由为网页适配，无新游戏数据结论；原素材/曲线/未移植范围保持。验证：本轮构建与更新后的verify-entry-screen.cjs，检查独立地址刷新重播、首页无标题、进入后URL、同场景、浏览器后退、手机菜单及提前点击。

## 原始证据

独立页交付验证结果：build通过；Chrome1280×720与390×844回归通过，独立页刷新/后退重播、开始后URL为/且scene对象相同、首页无入口、菜单直接导航均通过；已目视本轮blog-entry-review.png。提前点击测试首次350ms固定采样未捕获透明度，复跑通过，说明该时间点断言受重场景加载调度影响，不能用作精确动画时长验证。

设备19bd96b8当前标题页截图analysis-6.8.1/entry-reference.png（2880×1800）实际查看：全屏树与角色插画，下部logo/TAP TO START，右上菜单。截图包含账号信息，只作本地对照，不作为网页图片发布。

原APK Data/957845c1491bc3e4eb3cc5b3f636410b，Texture2D path_id1 `tex_anniversary_5th_bg_bg_03`，2048×1244，正是这幅人物与树的合成原图。Data/79d6e129c2f0fe24e9b3af3b6ba39cd9 Sprite2 `txt_tapToStart`为原英文及底条。Data/dd00fc007cd15bf4aa44cf43e9c2d23f Texture2D1为circle_eff。export_entry_assets.py导出源文件名/path_id/纹理SHA及原节点JSON至game-assets/entry。

原背景Prefab7560a2da64ae7764ebc7aff8487a7787（anniversary_5th_bg_built_in）、TapToStart prefab1c96b36db137e4d1ba80ab8bcf1f4cfb、AnimationClip cfe864a549e85814fba9d168b785fec6全部保存原typetree/不可解析raw。clip_anniversary_5th长6.4333334s、采样60。bg01/02/03现在均挂载；tex_title_btn_01仅导出未挂载。没有用截图裁图、没有把账号ID/厂商授权标识复制到页面。

## 2026-09-20 动画补充（覆盖初版静态/350ms直接淡出）

`decode_title_clip.py`从原Clip path_id1的m_MuscleClip.m_Clip.data.m_StreamedClip解码time/count/index/4个float系数，经Transform层级CRC32匹配genericBindings，生成`game-assets/entry/title-timeline.json`。系数按相邻关键帧间`((a*dt+b)*dt+c)*dt+d`求值，网页以60Hz采样交给Web Animations，不增加常驻JS RAF。

- 原Prefab GameObject1 bg / SpriteRenderer30 / 外部文件9=9d3e… Sprite2 → bg01；GameObject4 bg_before / Renderer29 / 文件8=a917… Sprite2 → bg02；GameObject7 bg_after / Renderer28 / 文件7=9578… Sprite2 → bg03。
- bg/bg_before缩放曲线索引0/3：0s=.88，3.483333s=.8，之后保持。网页除以终态.8即1.1→1倍，使用cover投影，不假称Unity相机原样。
- bg_before alpha索引12：0s=0，2s=1；bg_after索引14：3.75s=0，5s=1。按原多项式曲线播放。
- bg_white索引19：3.5833s=0，3.8s=.7，3.9667s=.7217，4.35s=.1147，5.6s=0；网页白色全屏层使用同曲线。
- 原white_moya/white、white_moya_sml在.0167–3.8833s启用，**它们的粒子材质/形状尚未移植**。现有circle_eff仍是网页装饰，非原ParticleSystem；游戏logo画圈拼合也未移植，博客标题以4.8s延迟+650ms显现替代，TAP在5.7s+450ms显现。勿称完整逐帧还原。
- 实机`title-intro-clean.mp4`（取消Google Play登录提示后录制）确认淡树→彩树→白闪→人物、logo/TAP后出现。录像含私人UI，仅本地证据，不发布。`title-start.mp4`确认点击后TAP消失、整屏渐白、联网等待后加载主场景；帧率有缺帧，不能由录像精确反推时长。
- ENTRY-TITLE-EXIT：点击立即锁定、650ms ease-in-out盖白；场景准备好或8s超时后350ms揭白，复用同一底层场景。650/350ms是网页适配，不是已恢复原游戏Tween值；不模拟联网等待/TIPS。提前点击可直接走退出，无需等6秒。入口关闭取消所有WAAPI；异步资源返回检查disposed/entering，不让退出后重新开播。减少动态效果直接终态和零时长退出。

## 网页实现

- layout.ejs在阅读入口（根目录、/live/、兼容/map/）生成title-entry，entry-screen.js在head同步决定显示，避免先露出阅读页；深链正文/标签等不拦截。
- 主图原bg03 cover，桌面中心，窄屏55%中心裁切；非原游戏相机算法。博客名替代游戏logo，副标题/非官方说明为自制文案。保留原TAP英文图与已有菜单图标。
- 装饰14个原circle_eff，screen混合消去黑底，6–10秒上浮，20→-55px、大小.6→1.1、最大alpha.8；TAP 2秒透明度1→.4→1。**全部为网页近似动画，不是原粒子字段**；人物在原背景图中是静态合成，未单独做Live2D。
- 点击任意正文画面区域的全屏button进入（右上菜单除外），键盘Tab/Enter可用。等待背景/人物/粒子ready，80ms轮询最多8s，期间“正在进入”；按上节盖白/揭白后移除入口DOM，复用底下已经启动的随机世界。不增加历史条目/整页请求。未完全覆盖树及所有道具首帧的独立就绪状态，8s后放行。
- visit-world.js新增startedAt作为访问ID，sessionStorage的sekai-entry-accepted记录已进入ID，同标签短刷新/站内返回不重复；新标签或超过30分钟的新访问可再次出现。系统时钟与存储不可用限制沿用RANDOM-VISIT-WORLD.md。
- 打开入口菜单后原菜单焦点圈定；关闭回入口按钮，主内容仍inert。菜单站内链接成功导航时page-router调用sekaiDismissEntry，不把入口残留到目标页。减少动画关闭光点/呼吸/淡出。关闭入口后CSS动画随节点删除停止。

## 验证

动画补充版build与verify-entry-screen.cjs通过；Chrome1280×720、390×844减少动画模式，验证片头未提前露人物、提前点击盖白、终态进入、菜单/Escape、同场景对象复用、刷新/返回不重播。blog-entry-intro.png及blog-entry-exit.png已目视检查；实机两段录屏contact sheet已查看。未验证所有弱网失败情形。路由未变，沿用NAVIGATION.md。

此前直接点击阅读入口的测试需要先接受title-entry；本轮以新脚本验证入口和原阅读流程衔接。
