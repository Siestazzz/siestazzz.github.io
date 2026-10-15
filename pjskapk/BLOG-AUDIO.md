# AUDIO-BGM / AUDIO-UI · 2026-09-20

## 最新：静音不停止与入口专用声

site-audio.js现在初始化即setup/sync/resume尝试播放，浏览器策略阻止时由首次手势解锁。静音仅将BGM GainNode设0，取消静音恢复.112，不stop BufferSource、不suspend Context、不清current；静音时进度继续，跨普通页面不重新开头。静音期间换入口/普通页仍切换相应曲目但保持0增益。其他SE静音规则保留，页面后台仍suspend（后台与静音不同）。按钮标签由暂停/播放改为静音/取消静音；右下布局不变。

入口专用AUDIO-TITLE-ENTER：设备pm path找到独立split_UnityDataAssetPack.apk，保存packages/installed_UnityDataAssetPack.apk；ZIP内assets/MenuCommon_Built_in.acb（SHA256 468ec7f7774aa2a8144599a65f296a736000d769db6e8c65d9a96eb0ffda7ca1），vgmstream子流20名SE_TITLE_ENTER，44100Hz双声道296941样本约6.733秒。SoundDefine.SE_TITLE_START="SE_TITLE_ENTER"为名称交叉定位，并非方法体证据。convert_blog_audio.py提取转码，audio/manifest.json保存源archive/subsong/采样/校验。网页入口预载该音，`.title-entry-enter`真实click只触发这一个专用声，不叠普通确认；gain仍.12。原音频未裁短，点击同步触发时序为网页适配，非已验证原游戏延时。

本轮验证：构建/声音专项回归，新增静音gain=0、时钟持续增长、取消静音gain=.112且trackStartedAt相同、入口点击lastEffectName=SE_TITLE_ENTER断言。现有曲目/循环点/普通导航/菜单/后台回归保持。浏览器可能在初始化resume时阻止出声，不保证无手势首次访问能自动外放；未做实机听辨。

## 最新：右下角与40%音量

按钮改全站右下角，桌面right26/bottom20px、手机right14/bottom14px，取safe-area与间距的较大值。删除with-back特殊位置与32px尺寸，手机统一44px；入口说明文字右边距100px/手机72px，避开按钮。音量是上版的40%：BGM .28→.112，普通SE .30→.12，滚动 .16→.064。源音频不重新编码，原循环点不变。这是用户指定的网页位置/增益适配，覆盖下方旧坐标与增益。

本次构建及声音专项回归通过，手机右下按钮截图已检查；未做外放响度听辨，40%指线性增益比例。

## 来源链

曲名对应社区master原记录：
https://raw.githubusercontent.com/Sekai-World/sekai-master-db-diff/main/musicSoundTracks.json

- id101：一緒に歌おう！ → mysekai/sound/bgm/music0001，文件music0001。
- id103：Our Town, Our Life → mysekai/sound/bgm/music0002，文件music0002。

通过已连接设备下载缓存包，而非录制视频音轨或抓取流媒体。原包/路径见`analysis-6.8.1/audio-audit/sources.json`：

| Bundle key | 缓存文件 | TextAsset path_id |
|---|---|---|
| mysekai/sound/bgm/music0001 | 1529e3fe699f82f3e89922e103d2448e | 8636505283073067138 |
| mysekai/sound/bgm/music0002 | 631767db80008e2efff69a5e86e63928 | 8894478573392326813 |
| sound/menu/menu_common | 1aa002407ef0eaf58b400e7ab53a2171 | 6456530718845575496 |

`export_blog_audio.py`解包TextAsset成music0001.acb、music0002.acb、MenuCommon.acb；`convert_blog_audio.py`用vgmstream r2117（https://github.com/vgmstream/vgmstream/releases/tag/r2117）解码HCA，`-i`仅原流一次，不输出解码器默认的两遍循环/尾部淡出；FFmpeg转Vorbis q5。音频放`themes/sekai-next/source/game-assets/audio/`，manifest.json记录采样数、cue/子流、原循环字段、SHA256。两首为游戏用循环版本，不是承诺完整专辑版长度。

## 原始数据与适配

BGM均44100Hz双声道。music0001样本4000128（约90.706秒），loop1394592→3999840；music0002样本2878336（约65.268秒），loop55360→2878041。Web Audio BufferSource.loopStart/End以样本数/44100设置，无需依赖HTTP Range定位。原HCA字段可信；曲目由用户指定给博客页面，不宣称当前游戏标题实际播放初版BGM。

MenuCommon本轮选用：确认SE_DECIDE1_MUSIC（子流130），返回SE_CANCEL_old2（128），选文/滚动SE_MUSIC_SCROLL（30）。menu-cues.json为188个子流扫描，名称可能是wave使用名。dump.cs SoundDefine中SE_MUSIC_SCROLL/SE_CANCEL/SE_DECIDE1的常量只用于功能定位，不代表恢复了当前完整Cue/Sequence混音逻辑。尤其返回波形名带old2，明确是当前缓存包保留的原波形，不冒充已验证新版SE_CANCEL最终混音。额外导出SE_UI_SCROLL（176）仅供对照，未挂载。

按钮复用原icon_tab_unit_vs_on.png，来源game-assets/provenance.json：2dbf7d013f50eb347b0f774190034db9/Sprite path_id1。BGM字样、状态斜杠、圆按钮组合为网页适配，不是提取出的完整原BGM按钮。

## 当前网页生命周期

layout.ejs全站包含固定`#site-audio-controls`，位于router替换的topbar/main外；site-audio.js只初始化一次，同一个AudioContext与BGM源跨普通页面保留。`sekai-page-ready`检测入口层：入口music0001、其他music0002，仅曲目变化才换源。独立返回入口仍是整页加载，不能承诺跨文档无缝。

初始不创建AudioContext、不越过浏览器自动播放限制；第一次指针/Enter/空格交互或点击BGM后尝试解锁。按钮统一暂停音乐和音效，localStorage键sekai-audio-enabled记住开关；静音后普通点击不会自动开启。按钮显示真实已播放状态，失败可再点击重试。后台suspend，恢复续播；pagehide挂起，BFCache pageshow恢复。

BGM gain .28，普通SE .30、滚动 .16；全局SE最小间隔65ms，滚动位移≥64px且间隔≥160ms，最多3个SE源并发。加载完成超过触发450ms则丢弃，不排队补播。点击只处理真实交互按钮/链接/遮罩，确认、返回/关闭、选文分别用对应原波形；文章列表滚动与正文滚动用短SE_MUSIC_SCROLL。滚动阈值/音量/映射均网页自定，不是原游戏参数。

桌面按钮58px，top20、left26；有返回时left102。手机无返回44px/left14/top14，有返回32px/left68/top20，避免遮挡搜索框。菜单打开隐藏且inert，菜单关/站内导航恢复；入口Tab循环包含BGM按钮。无新URL或链接目标。

## 授权与验证边界

原游戏音频和图标仍属其权利人；资源本地可用不等于允许公开再分发。本次不部署、不提交。

验证完成：npm run build、verify-site-audio.cjs、verify-system-menu.cjs、verify-entry-screen.cjs通过。验证首次不自发播放、手势解锁、两曲映射/原循环点、普通软导航trackStartedAt不变、选文点击音效与滚动限频、静音刷新记忆、后台挂起恢复、菜单inert与菜单导航后恢复、移动端返回键不重叠。入口/选文/手机截图已查看。两个选定master记录快照保存在audio-audit/musicSoundTracks-selected.json。

未做真实设备外放听辨或游戏完整Cue序列/音量混音对齐；测试确认音频可解码并启动，不将此冒充听辨验收。跨文档重新加载需再次受浏览器播放权限限制；未承诺不同标签页同步静音。
