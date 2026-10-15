# FX-MENU · 五项博客菜单 · 2026-09-20

## 最新：分类数字换成队标

后续放大：用户要求稍大，队标52→64px（约23%），在原52px网格列中心显示，max-width:none；文字/卡片位置不变。原图与映射不变，仅网页尺寸适配。构建和菜单/分类回归通过，放大后分类截图已检查。

categories.ejs数字span替换为原`icon_tab_unit_{vs,ln,mj,vb,ws,25}_on.png`，按选文相同顺序映射六类。使用on彩色版本适配白卡；不再渲染编号圆底。refinements.css img52×52px、object-fit contain，无背景/圆角/染色，原素材含白菱形。分类数量、标题、链接和菜单不变。

素材证据：game-assets/provenance.json，六张均Sprite path_id1；vs源2dbf7d013f50eb347b0f774190034db9，ln源cf8774eb0bad747458d033e161d59a81，mj源823afea1cc47ca54a95200a953023c17，vb源b83dfb6880dabd24aa44beae86d4c4d1，ws源eb434128b2148cd42b80c1735e1a5d23，25源5362d756dd4d77b4cbcdc67da92fb40c。新尺寸与分类业务映射是网页适配，无新增游戏算法。

验证：构建和verify-system-menu通过，新增六图decode/文件顺序/无数字span断言，分类页截图已检查。无导航或动画变化。

## 最新：再次收窄及分类页统一色

system-menu.css桌面43.3→39vw、max832→750px、min414→380px，padding由clamp(20px,2.85vw,55px)改clamp(18px,2.5vw,48px)。手机90→86vw，原min-width0及20px内边距保留。五个目的地、图标素材和200ms开关不变，是用户要求的网页适配，不是重新提取的游戏数值。

categories.ejs原cyan/pink/yellow循环改为CTF #33ccbb、Android #4455dd、漏洞挖掘 #88dd44、逆向工程 #ee1166、AI #ff9900、其他 #884499，沿用选文六个unit图标的类别配色与post.ejs已有categoryPalette。通过--accent改变卡片编号圆底，卡片白底保留；分类顺序/文章数量/链接未变。这是博客映射，不是原游戏分类业务。

收窄后分类英文CATEGORIES改clamp(16px,1.55vw,28px)并保持单行，避免末尾S换行。构建及verify-system-menu通过（含六个颜色断言），桌面/手机菜单及分类截图检查；未改游戏素材或导航。

后续缩小：用户要求略小，桌面面板47.1→43.3vw、max904→832px、min450→414px，约缩小8%；内边距/卡片间距/标题相应减小，资料卡高10→9.2vw。手机94→90vw，卡高118→108px，标题22→20px。未改路由/图标/动画，全部为网页尺寸适配，覆盖下方初版数值。build与verify-system-menu通过，桌面截图已查看。

## 设备与原包证据

ADB设备19bd96b8，2880×1800；从游戏主画面右上菜单打开，截图analysis-6.8.1/menu-audit.png及menu-open.png。观察为右侧紫色半透明面板、白色卡片、深底标题首字粉色、底部描边英文、右下图标、右上关闭；左侧场景仍显示。旧device-menu-reference.mp4开头是LIVE页面，不当作菜单弹层证据。

原文件dead2c85644b14045bcd265cf80918c6：GameObject9 MenuDialog；完整节点MenuDialog/RightSubWindowComponent/Window/ContentRoot的RectTransform106，sizeDelta.x=904；Bg RectTransform122同宽904；Content RectTransform124。原btn_menu_profile Sprite1文件8623af728d8a6cb4e8de1871f8be6e9a，392×184、border全0；btn_menu_characterArchive及mylist同规格。资源纹理的标题/图标/描边文字已合成，所以不把原日文整张按钮直接用作中文博客功能。

export_menu_evidence.py导出原节点、可解析字段、未解析MonoBehaviour原bytes和7个Sprite来源至themes/sekai-next/source/game-assets/menu/provenance.json。raw bytes不代表已恢复组件算法；未确认菜单实际开关时长/缓动，不借用scenario菜单动画当作该菜单参数。

## 运行与映射

layout.ejs仅五个链接：友链→/friends/；GitHub→theme.home.github（当前https://github.com/siestazzz，同标签原生直达）；分类→/categories/；标签→/tags/；个人资料→/about/。无主页、归档、搜索等额外菜单按钮。站内继续软导航，背景不重建。

实际图标：友链icon_friend_dbl.png；分类menu/icon_menu_collection.png；标签menu/icon_menu_text.png（原文字图标映射博客标签，非原游戏标签按钮）；个人资料menu/icon_menu_profile.png；GitHub沿用home/github.svg，非游戏资源。前三个menu独立图标由原Sprite导出，路径/源文件/path_id见provenance.assets。CSS染粉为适配。导出的btn_menu_*与bg_base_menu仅对照存档，当前卡片不挂载这些整图。

system-menu.css：面板47.1vw/max904px/min450px、rgba(69,68,95,.8)，参考904/1920但不是原CanvasScaler完整还原；392/184卡片比例来自原Sprite；五项重排为2+2+跨列资料，中文及英文为HTML。边角16px、白底alpha.92、窄屏94vw/118px高、滑入/滑出200ms ease-out、hover150ms/上移2px、按下scale.98均为网页适配，非恢复游戏字段。无全屏额外暗色遮罩；透明scrim接收关闭点击。

main.js沿用开关/焦点圈定/Escape，打开时主内容及顶栏inert，关闭恢复；未激活菜单inert。菜单使用dialog/aria-modal。减少动画取消过渡。打开/关闭只改变UI状态，不启动新场景或后台循环。

## 验证

Hexo构建通过；verify-system-menu.cjs在Chrome1280×720检查五个链接/GitHub配置URL、主内容inert、Escape关闭、分类软导航后恢复交互，无pageerror；390×844截图核对卡片不溢出。实际查看blog-menu-review.png/blog-menu-mobile.png并对照设备截图。尚未逐帧还原原游戏动画；GitHub未向外部提交任何内容，测试核对实际href而非登录或远端写操作。
