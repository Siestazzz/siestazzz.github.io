# 五周年标题实际动态资源审计

## 最新：循环等待定位完成

进一步实测覆盖：仅等待seeked仍失败；自然结束事件中设置7.533后currentTime立即成为0，后续timeupdate从0增长，说明先前单点seek断言不足。最终改fetch完整MP4→Blob ObjectURL再交给video，避开服务端不可定位的HTTP媒体路径；每次入口只取一次，循环不重载。退出AbortController取消请求并revokeObjectURL。仍保留6秒超时回退；代价是视频需完整缓冲约10.7MB后开始，此为兼容策略，不是游戏数据。原视频/226帧起点不变。

用户报告循环重播人物/树入场。旧ended回调设置currentTime后立即play，未等待异步定位；现在ended只定位226/30秒，seeked且页面可见/未销毁时再play，visibility恢复如果seeking也等待。循环不调用load、不改src、不重建DOM，不重播标题WAAPI。原视频及循环起点不变，是网页HTMLMediaElement事件顺序修复，不新增游戏数据结论。

回归新增：强制接近结尾后继续播放11.5秒覆盖一次完整自然循环，记录全部timeupdate，断言时间始终≥226/30−.04，防止旧测试只看单个正确时间点而漏掉后续回零。另保存blog-entry-after-loop.png。

最终验证：构建与扩展入口回归通过，完整自然循环采样未进入入场区，循环后截图已目视检查。退出/提前点击/后台暂停恢复/视频失败回退均通过。HTTP Range头请求本地MP4返回200而非206（且未声明Accept-Ranges），与原媒体寻址失败相符；Blob路径消除了本地服务依赖。未测试真实弱网首播耗时。

## 最新：已接入网页

`export_title_movie.py`遍历完整49286912字节CRI容器，按大端chunk size/offset/padding取`@SFV` type0的视频负载，排除metadata/EOS，共527包。原m1v转为1920×1190、30fps、527帧、17.566667秒H264；CRF21、yuv420p、faststart，226帧强制关键帧便于循环seek。完整输出解码至null无错误。生成`themes/sekai-next/source/game-assets/entry/title-background.mp4`（10710066字节）与title-movie.json（来源、hash、帧率、循环点）。这取代旧预览的容器直读路径，不再使用有告警的preview.mp4发布。

entry-screen.js正常播放原视频，开场2倍（延续用户之前速度要求），到原7.533333秒切1倍，ended后seek原226帧再播放；网页秒寻址相对于游戏整帧API有解码调度差异。循环点/末两帧的loop-contact.png已查看，构图衔接，无开场闪白。仅单视频，不增加双解码器或叠加自制背景粒子。

背景正常路径关闭旧静态层动画与intro粒子，但title-fx.js仍加载以保留点击退出碎片。独立博客字标/星星/五线谱动画继续；副标题合成700字重（原Allura仅400文件）、桌面25–45px、手机22–32px，上下padding14/2px使字中心下移6px，谱线不动。这些是网页文案适配，不是原游戏字段。

生命周期：仅入口且非减少动画才设置video src；loadeddata最多等待6秒，失败回备用图/原旧粒子；后台暂停，恢复续播；退出/菜单离开pause、撤销video frame callback、清src/load释放。正常视频不用额外持续Canvas粒子RAF，退出时才启动。

验证：npm run build、node语法检查、verify-entry-screen.cjs通过。断言正常视频有变化像素、到循环区1倍播放、结束返回7.53附近、无重复背景粒子、退出释放src、提前点击/菜单/返回、减少动画无视频请求、视频请求失败回退；桌面/手机截图已查看。未做真实低端手机性能、弱网长时间缓冲及游戏像素级逐帧匹配。下面为此前调查日志，不代表仍未接入。

2026-09-20：纠正TITLE-ENTRY.md将备用静态包范围扩大到完整标题的判断。

## 原资源

- 从设备com.sega.pjsekai提取`title_screen/anniversary_5th_bg`，缓存保存于`analysis-6.8.1/map-bundles/6f05dd63c6fd43100c13f51c5391c0a7`。
- GameObject anniversary_5th_bg path_id8677014345968549003。
- TitleContent path_id5656993926448481586：live2ds=0、movies=1、loopPointFrame=226，BuildData引用2767517214885464949，targetTex引用4638568546456168691，viewTexture引用8795960763545791479。
- MovieBundleBuildData path_id2767517214885464949：index0–23，对应5th_anv_title-001.usm.bytes至024.usm.bytes。这是同一视频的24个分块，前23段各2097152字节，最后1052416字节。
- 可复用脚本`audit_title_movie.py`保留TextAsset字节、组件raw/字段、包SHA256至`analysis-6.8.1/title-movie-audit/inventory.json`，拼接`5th_anv_title.usm`。

## 方法体证据

- GetLimitedTitleName RVA0x60BD31C调用String.Format，dump字符串有title_screen/{0}；资源key另由实际AssetBundle.m_Name确认。
- FinishIntroduction RVA0x4AF27EC从movies列表调用OnFinishMovie；反汇编`il2cpp-audit/0x4af27ec.asm`。
- OnFinishMovie状态机MoveNext RVA0x4AF3EBC在0x4AF41CC读取element+0x28，在0x4AF41D4调用UIMovieRenderTexture.Seek(int)，随后PrepareForRendering；见`il2cpp-audit/0x4af3ebc.asm`。
- 视频解码识别30fps，226帧约7.533秒；网页以后采用秒寻址需要验证帧边界。

## 核验和限制

设备当前标题录制为`analysis-6.8.1/title-idle-audit.mp4`，含私人UI，仅本地证据。

原USM经FFmpeg生成`title-movie-audit/preview.mp4`（1280×794，约17.6秒）；已查看contact.png，包含树分块显现、人物显现，以及头发/衣摆/树景/光粒的持续变化。原分辨率3872×2400。视频本身没有游戏标题文字。

FFmpeg结束时报告Invalid data found when processing input，预览可播放，但尾部完整性、精确帧数与无缝循环还需验收。不能把FFmpeg最初按码率估算的3.77秒当原片长度。

本包live2ds=0，说明这组入口动态有原视频来源，不是入口人物必须另载Live2D；不代表游戏其他场景没有Live2D。

## 网页对应状态

ENTRY-TITLE-MOVIE尚未挂载。entry-screen.js目前仍是built_in三张图与粒子；本轮仅调查，没有改运行页面，因此未构建/浏览器回归。

后续应由原视频承担人物/树的入场及持续动画，保留独立博客标题和点击退出。循环参考226帧，先验证尾部与接缝；避免视频已有粒子和网页粒子重复叠加，不再通过摇整张静态图代替原动画。
