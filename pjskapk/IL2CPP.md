# Project SEKAI 6.8.1：可复用 IL2CPP 分析

## 已完成的基础分析

仅处理用户提供的 APKS 本地副本，不修改设备、游戏、账号或原始包；不注入进程、不绕过登录、不上传文件。生成资料全部放在已忽略的 analysis-6.8.1 中，不发布到博客。

- ARM64 原生库：196,910,024 字节。
- 原始元数据：27,964,868 字节；离线还原后为标准 metadata v31。
- 已生成 dump.cs、script.json、stringliteral.json、il2cpp.h 和 158 个 Dummy DLL。
- SQLite 索引包含 36,783 个类型、195,901 条有实际 RVA 的方法记录。
- Dummy DLL 只包含类型和签名，不是恢复了 C# 方法实现。方法逻辑需要结合原生反汇编继续验证。

## 复用命令

在博客项目根目录运行：

```powershell
# 全流程：提取（缺失时）、检查、离线还原、导出、建立索引。
# 输入校验相同且完成标记存在时，复用导出结果。
.\pjskapk\analysis-tools\Scripts\python.exe pjskapk/run_il2cpp_analysis.py

# 按类名查询字段、签名、RVA 及 dump.cs 行号
.\pjskapk\analysis-tools\Scripts\python.exe pjskapk/index_il2cpp.py --query UIPartsBlurMusicJacket

# 反汇编；已知方法的直接调用会附带类型和签名
.\pjskapk\analysis-tools\Scripts\python.exe pjskapk/il2cpp_audit.py disasm --address 0x4C31850 --size 0x1fc

# 从已核实的序列化记录提取 UI 事实
.\pjskapk\analysis-tools\Scripts\python.exe pjskapk/extract_ui_facts.py
```

环境依赖安装在 pjskapk/analysis-tools 内：UnityPy、pyelftools、capstone、msgpack；IL2CPP 工具使用官方 [Il2CppDumper 6.7.46](https://github.com/Perfare/Il2CppDumper/releases/tag/v6.7.46) 的 net6 版本。旧的 6.7.40 不支持该包的 metadata v31。工具 config.json 的 RequireAnyKey=false 便于脚本运行。不要改元数据版本号来强行适配旧工具。

## 元数据还原依据

库 SHA256：aa183c674cf9fc0c2c4125fc24861ab92f6884df52462c6f9fcd58a68f7317ee。

- global-metadata.dat 字符串虚拟地址：0x1EC9CF1。
- 调用点：0x49505F8，目标加载函数：0x435FF38。
- 异或循环：0x436006C～0x4360088；索引指令 AND 0x7f。
- 128 字节表来自库虚拟地址 0x1ED0093。
- 还原公式：output[i] = input[i] XOR table[i & 127]。
- 校验标准 magic 0xFAB11BAF、版本 31；原始文件不改写。
- CodeRegistration：0xAEC3198；MetadataRegistration：0xB350750。

decode_il2cpp_metadata.py 会先检查原生库 SHA256；新版本必须重新定位，不能盲用上述地址。输出 SHA256 和输入 SHA256 在 il2cpp-audit/decode-provenance.json。

## 与博客相关的已验证事实

| 对象 | 已验证数据 | 依据 |
| --- | --- | --- |
| 背景控制器 | BlurSamplingDistance=1.5；CaptureResolutionScale=0.5 | 46db4f81f977f1b42abad83cef375dcd / 10；字段顺序由 UIBlurController 定义验证 |
| 手机封面模糊 | Shader 为 Sekai/UI/UIGaussianBlur，默认 SamplingDistance=2.8 | dda81731e906904488b8ae15ce6e83ca / 1303 指向 a7c3a9f13160e49a7b62548fbaa258ae |
| 封面模糊流程 | 以封面尺寸创建 RenderTexture，创建 Shader 材质，Blit 一次，赋给缩略图 | UIPartsBlurMusicJacket.Blur，RVA 0x4C31850 |
| 模糊缩略图颜色 | alpha=76/255，约 0.298039 | 手机预制体 / 1216 的 CustomRawImage |
| 底部点阵 | 小纹理 8×8；底部纹理 40×278，纵向 UV 只铺一次 | CommonBackgroundDot.SetDotImage，RVA 0x4FDE498；不是通过越来越大的 CSS blur 模拟 |
| 选中行频谱 | 6 柱，每柱 8×72，中心 x=-35,-21,-7,7,21,35 | MusicSelectSingleListCell 的原 RectTransform |
| 阅读按钮 | btn_round_line_h80_wh；左右九宫格边界各 52；原组件色 #77EEDD | 手机预制体 PositiveButton/ButtonImage / 1110 |
| 随机按钮 | btn_random_lgr | 手机预制体 ShuffleButton/Base / 1229 |
| 分类 Tab | icon_tab_unit_*_on/off | MusicSelectUnitTab / TabImage；与 icon_unit_* 不是同一套 |

重要更正：UIPartsBlurMusicJacket 序列化数据中的整数 60 是 Shader 外部文件引用编号，**不是模糊强度 60**。运行时字段偏移和 Unity 序列化字节偏移也不是同一套偏移，必须结合类型定义逐项解码。

## 本轮新增：已解出的 Shader、手机资源与网页接入

- `extract_shader_programs.py` 索引 337 个 Shader，解压 LZ4 平台程序并保存可读 GLES 代码到忽略目录 `il2cpp-audit/shaders/`。不把 UnityPy 的占位 Shader 导出当作源码。
- `UIGaussianBlur` 为单次十字采样：横、竖各 7 次，各占 0.5；权重 `[.036,.113,.216,.269,.216,.113,.036]`，偏移 `[-3..3] × 2.8` 纹素。已在 `jacket-blur.js` 用 WebGL 移植；不是先横后竖的可分离卷积。
- `Hidden/CP/PostEffect/UIEffect`（092154f9c823d420f88f7701eae0b6b5）的背景核为两个方向依次渲染，每方向对称偏移 `[.65,2.43,4.37] × SamplingDistance`，权重 `[.204,.198,.098]`。`ExecuteBlur` 0xA984EC0 确认依次执行 pass 0、1。分母来自 RenderingData+0xF0（CameraData+0xD8 的 cameraTargetDescriptor），而不是降采样纹理尺寸。网页以半分辨率截图绘制原场景层，再执行此内核。
- `SekaiUIBlurParameter()` 0xA98DD8C 的常量在 VA 0x1ED4538：CaptureResolutionScale=.5，BlurSamplingDistance=3；与编辑控制器序列化的 1.5 是两个不同来源。**网页暂以 LIVE=1.5、选文=3 接入；这项页面映射尚未从运行时证实，不是已确认的原版每页数值。**
- `CellPhoneLoader.Awake()` 0x4B03928 动态加载 `ui/smartphone`。设备缓存 `data/7d5c/b41e5dac39c8f8e2386cf267bdc5ec7c` 已找到，`export_phone_assets.py` 可复用提取。原手机 Sprite 为 1034×1942，底图本身不透明，带原始渐变、边框、高光和刘海；已替代网页手绘手机框。
- 手机 prefab 的 RectMask2D /1008：padding 全 0，softness=(0,389)；父 RectTransform /816 高 574，外层 /650 为 700×700。模糊封面 alpha 为 76/255。网页采用这些比例实现上下柔边（半柔边宽 194.5/574），CSS 与 Unity 边界像素抗锯齿仍存在差异；没有臆造一个单向渐变停止点。
- 原底部点阵已接入两页：水平重复、纵向单次显示。整体 UI 尺度按网页视口适配，不能把纹理像素当成浏览器固定像素。
- 修复首页拖拽后，下次按钮点击可能被旧 dragged 标记误拦截的问题。

## 尚未完成，不能冒充精确还原的部分

2026-09-05 列表／封面尺度修正：

- `MusicSelectSingleListCell` 的 UnderLine /169 是白色 alpha=.2；`ChangeHighlightDisplay` 0x5017F44 激活 HighlightPanel。网页移除非选中背景、圆角、阴影和悬停白卡；只有选中项显示底板。选中白底 .5 是按用户要求的透明化校准，未宣称是原版最终合成 alpha（HighlightPanel 的序列化粉色会被运行时覆盖，不能直接使用）。
- `UIPartsBlurMusicJacket.<LoadJacketAsync>d__11.MoveNext` 0x4C31B64 调用 `GetMusicJacketThumbnailName()`（0x60B6E3C），继而调用字符串版本的加载函数。实际资源包 `thumbnail/music_jacket`，缓存 MD5 路径 `data/951d/0de26e611a87fb166777a5e5a9a0960c`；读取多个 Texture2D（jacket_s_758、178、700 等）均为 256×256。之前对 2048×1170 博客图直接执行采样是输入尺度错误。现将背景用图中心裁切为 256×256，再执行同一 2.8 纹素十字内核；前景清晰封面不变。
- 模糊结果保留绘制缓冲，并在 WebGL 出错时不标记为成功。测试核对上传尺寸、texel uniform、清空状态；该测试模拟 API，不是 GPU 视觉验证。
- 首页/LIVE/选文变暗与模糊分离：新增独立 scene-dim，深度为 0、1、2。网页一层 opacity=.22，两层合成为 .3916；**这些遮罩值是网页校准，不是已经提取到的原版运行时值**。此前两页同一遮罩导致层次缺失已修正。

2026-09-05 回归修正：CommonBackgroundDot 所在 prefab `af5f1b95e91154c278a5156c9f5ecd32` 的 CustomRawImage /254 色彩 alpha=128/255，/331（ButtomDot）alpha=30/255。此前只移植纹理而把两层统一设成 opacity=1，造成底部白块。现将大小点阵分层并分别恢复上述 alpha。实机核对截图为 `device-dot-check.png` 与 `device-live-dot-check.png`；组件数据不单独证明所有页面的运行时覆盖值。

手机内容空白的回归原因：4100 Hexo 进程返回的旧 HTML 缺少 `.phone-jacket-wash`，新脚本给空节点设置 src 时抛错，导致选择逻辑中断。已对装饰节点加可选保护、加入旧 HTML 回归测试并重启项目本地服务；HTTP 确認新版 HTML 与脚本同时提供。点击三角尺寸由 9–16px 增至 24–40px，同时增加实际动画缩放和扩散距离（这部分为用户要求的网页效果调整，并非游戏原值）。

- 第二页与第三页最终的有效模糊差异：上面 1.5/0.5 是控制器序列化默认值，不等于两页各自运行时参数。
- 两页的运行时参数映射、设备动态分辨率及捕获链仍须实机验证；两个内核本身已解出并接入，不再使用 CSS blur(1px)。
- 真实音频采样驱动的频谱曲线、拖拽惯性与游戏相机边界。

当前网页已接入图标、六柱几何、背景拖拽、放大立绘、原手机底图、封面模糊柔边、底部点阵和背景双 pass 内核。频谱运动仍为临时视觉动画。它在原版 Update 0x4C50358 中读取 BGMPlayer.GetSpectrumLevels/GetIngameSpectrumLevels，博客没有相同音轨输入，不能宣称逐帧一致。旧 GAME-MOCK.md 中相关近似记录以本说明为准。
