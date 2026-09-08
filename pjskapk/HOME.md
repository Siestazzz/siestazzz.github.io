# 首页新增功能与原版依据

> 当前场景/动画总索引见 [SCENES-AND-MOTION.md](../docs/SCENES-AND-MOTION.md)。本文保留首页按钮和轮播的提取依据；后续主页背景已替换为 area 27「？？？的世界」，旧街景相关描述不再代表当前主页。

`inspect_home_banner.py` → `home-banner-metadata.json`。原首页 prefab：1b7a0ea3397cc4b50afa58eaa2030516。

- HomeBannerList/BannerList 的 PageChanger：raw offset56 scrollSec=0.2，72 changeMode=13（AutoInterval|Swipe|Flick），76 autoIntervalSec=3。PageCarousel spacing=30，Dot/Selected尺寸20×20；网页缩放为14px点、7px间隙（中心距21=30×0.7）。线性曲线是网页适配，未声称已还原MoveNext的插值曲线。
- 原指示点 carousel_h16_dbl / carousel_h16_pk；底座 bg_base_round_h40_wh。HomeBannerCell为484×204的动态RawImage，无独立Sprite边框引用；博客横幅按此比例，用文章图、标题与网页边框适配，不宣称标题遮罩是原游戏资源。
- Gacha/Image实际绑定btn_home_gacha（208×104，含原日文标识）。CSS仅显示x=0..96的原图标区域（alpha>100的图标止于x91，文字起于x104），不重画，不显示原图文字。新标签仅“随机一篇 / GACHA”，使用提取的Rodin EB；fontTools cmap确认四个中文字均有字形，限定首页按钮使用，不改变正文的统一中文字体。
- `inspect_home_geometry.py`核对底栏Base高度104、Gacha按钮272×104、Image208×104；HomeBannerCell484×204。设备首页截图中横幅约占宽22%，底栏高约占宽5.4%，网页按此适配，窄屏最小64px高，保留两个功能所以不照搬五按钮总宽；横幅指示点在底栏下方。随机从全部文章选择，避免连续两次抽到相同文章；不增加虚构游戏抽卡过场。
- 首页Friends仅英文。GitHub标志例外，使用GitHub官方Primer Octicons的mark-github-24.svg：https://github.com/primer/octicons/blob/main/icons/mark-github-24.svg 。目标链接位于theme.home.github，按现有博客域名暂设siestazzz账号。
- front matter `featured: true` 手动精选，最多5篇；未设置则最新3篇。优先封面，其次正文首图，再回退现有游戏背景。自动3秒、滑动0.2秒；鼠标悬停、焦点进入、隐藏标签页时暂停，可点击圆点或左右滑动，无暂停按钮。减少动态效果偏好禁用自动播放。
- 指示点底座原图50×40，m_Border左右各24：CSS按24px切片、0.7倍显示为16.8px端帽与28px高度，只拉伸中间2px，避免整体拉伸导致尖角。
- 保留清晰拖动街景及已有点击效果。布局缩放、键盘可达性、25px网页手势门槛均为网页适配。
- 全站顶部及正文返回入口调用浏览器history.back()，不再固定返回live/search。无可返回历史时回首页；优先使用Navigation API判断，其余浏览器使用history.length。

验证：npm.cmd run build；node tools/verify-home.cjs；本地浏览器查看轮播及点击GACHA。

## 首页英文标签像素依据

### 按钮交互依据

复用脚本 `inspect_home_button_states.py`。首页CustomButton pathID415（Live）、440（Gacha）的Unity transition均为0，不能把闲置ColorBlock里的245/255高亮色误当实际效果。

- Gacha绑定412 GraphicButtonTapEffect，目标365 Image，调色板2 base_wh → 44 tap_gn_1。globalgamemanagers.assets中tap_gn_1值为RGBA(161,244,235,255)，白色原Sprite按alpha遮罩染色，英文保留60%透明度。
- Live绑定384 SwapGraphicButtonTapEffect，默认377 Image / 高亮342 Effect，素材分别为btn_home_live、btn_home_live_on。网页图标使用原素材左右文字分界处裁切并交叉淡化；重排后的HTML文字用高亮素材主要颜色#D0FFF4作近似，不声称还原位图的多色像素。
- IL2CPP ButtonViewInteractionBase声明FADE_IN_TIME=0.1、FADE_OUT_TIME=0.4；两效果OnPressed/OnReleased反汇编调用对应虚拟时长getter后进入FadeIn/FadeOut。网页采用这些时长，linear曲线为网页适配，未核实游戏最终缓动曲线。
- 原实现为按下/释放反馈，网页额外映射到hover及focus-visible；去掉原先自行添加的提亮和向上移动。窄屏触摸只用active，减少动态偏好即时切换。

- btn_home_gacha（54ee7ea838838fc4686bfcca73e5f914）：英文区域x>=104、y=63..78的主要RGBA为(255,255,255,153)，即白色60%透明度，非纯白或固定灰色。
- btn_home_live（f26d6ba21f2b7a64f9a7ba2f34582f9d）：208×104，主标题y=24..56、英文y=64..77，间隔约6px；英文主要RGBA约(119,255,227,153)。ASTC解码边缘及颜色存在小幅量化波动。
- 网页LIVE两行禁用继承的宽松行高，间距按6/104×底栏高度适配；两处英文用60%透明度且不加文字阴影。HTML字形与位图字形边界不同，行距属于据原图尺寸做的网页适配。
