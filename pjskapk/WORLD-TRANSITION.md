# MAP-ENTER / MAP-LAYOUT · 2026-09-08

## 2026-09-09 单击入口更新

验证：Hexo构建通过；Chrome1280×720实际单击教室，出现62实例的转场画布（0.904s可见58），白场opacity0.327147，最终进入world5且遮罩移除，无pageerror。未重新操作游戏设备，本次只调整用户指定交互。

用户明确要求一次点击进入。sekai-map.js删除focused确认门槛与点击后的rotateTo，直接busy=true、更新无障碍状态、保存世界、调用sekaiWorldTransfer。箭头/拖动旋转不变，拖动5px抑制click，旋转/busy期间防重复。模板提示同步，仍视觉隐藏。此为用户指定网页适配，不以原游戏数据背书；以下两次点击描述仅为旧版本。verify-world-transition.cjs更新为一次点击验证，原粒子/白场/加载清理均保留。

## 设备观察

ADB 设备19bd96b8，2880×1800，原游戏6.8.1。`analysis-6.8.1/world-transition-enter.mp4` 是选择教室后点击学校卡片进入的录屏；`world-transition-enter-frames.jpg` 为带真实时间戳的帧表。约0.638s拉近，0.805s播放标记出现，0.918–1.104s中心闪光与径向碎片，随后白场覆盖。1.620–2.537s有录屏缺帧，不用它证明精确持续时长。点击当前中央世界的world-transition-new.mp4只是快速返回，不能作为完整过场证据。

## 原始证据

原包 `analysis-6.8.1/unpacked/assets/bin/Data/c790a5c99b4fd4f80a2e34152b8f6fe7` → `AreaTransitioner/sekai/fx_live_transition_v2_03_b/root/pt_outside/`。

`export_transition_particles.py`导出所有7组ParticleSystem、Transform、Renderer、Material、纹理引用与源SHA256至 `themes/sekai-next/source/game-assets/map/transition/particles-raw.json`。非有限浮点以字符串保存，避免JSON损坏；不是把未知值替换为0。

| path_id / 节点 | 原始关键字段 |
| --- | --- |
| 21 / tri_03 | lifetime mode3 min2/max1；size1–2；speed min15/max5；cone60° radius0.55；burst10、cycleCount0；rate5/s、length1.5s |
| 24 / tri_02 | lifetime min3/max2；size2–5；speed min35/max5；cone60° radius0.55；delay0.2s；burst20×2、间隔0.15s |
| 20 / flare_flash | lifetime1.5s、size22、单次1 |
| 22 / flare_circle | lifetime1.2s、size18、单次1 |
| 25 / flare_white_out | lifetime3s、size110、delay0.5s、单次1 |
| 26 / flare_first | lifetime0.5s、size40.8、单次1 |

21/24引用原2×2渐变三角图集tex_sekai_v2_02.png，随机起始格；闪光引用tex_transition_01.png、tex_transition_03.png。原始min/max倒置保留，不人为“纠正”。23/root为父级系统，导出留档但网页不发射它的Default-ParticleSystem纹理。子Renderer disabled而UIParticle参与UI渲染，不能据此认定游戏中不显示；Renderer mode0是billboard，不是mesh。

`SekaiTransitionController.FadeOut` RVA0x60a2178实际反汇编 `analysis-6.8.1/il2cpp-audit/0x60a2178.asm`：0x60a232c调用ColorFader.Play；0x60a23a4调用SekaiAreaTransitionPlayMark.Setup；0x60a23c4调用StandByCore；加载this+0x20的sekaiEffect后0x60a23dc调用ParticleSystem.Play（0xabd5918）。这是方法体证据，不只是dump.cs签名。播放贴图另见原f41fb1615e34a444faafcc8ccbf15a05中CustomRawImage32及transition/provenance.json。

## 网页实现和明确偏离

- `source/js/transition-particles.js`：从原数据读取出生、寿命、大小、速度、SizeModule/ColorModule曲线与UV切片；canvas2D绘制原图，代替旧CSS教室贴图碎片。显示时钟通过sessionStorage跨文档延续；62个发射实例，5s停止RAF，离页/过场移除时取消。减少动画不运行粒子。
- 原尺寸单位投影为min(视口宽,高)/20 CSS px；锥形速度径向投影，发射角分层随机遍布360°。**未完整恢复Unity VelocityModule、相机空间及材质shader**；Hermite采样不支持完整weighted曲线，角速度取当前值乘年龄而非严格积分；flare用lighter、tri用source-over为网页混合近似。cycleCount0按一轮处理。不能称为原UIParticle完整复刻。
- `world-transfer.js`：950ms放大至2.5倍；1500ms白场（前25%保持透明），随后跨文档换世界；等待背景、效果和角色就绪，最多8s；1000ms显现。这些时长/倍数、90px播放标记与呼吸均为网页适配，不是本次恢复出的原常量。只换粒子实现，不改变主页持续效果。
- `sekai-map.css`：选择容器top:-3svh/bottom:3svh，即整体上移视口高3%；底部操作说明仅视觉隐藏，保留无障碍状态。首次选中并旋前、再次进入的交互不变。布局位移为用户要求，不冒充游戏坐标。

## 验证

Hexo build通过，JSON解析有效；Chrome1280×720实际选择教室、二次进入，62粒子实例、0.713s可见57、白场opacity0.172858，正常进入world5且遮罩清理、无pageerror。`tools/verify-world-transition.cjs`可复跑；截图map-up-review.png/transition-web-review.png已经目视检查并与设备帧表对照。未进行逐帧像素匹配、移动端视觉验收或本轮BFCache专测；不得宣称完全等同原游戏。
