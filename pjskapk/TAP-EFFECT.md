# 点击特效：6.8.1 原始数据到网页的映射

运行 `analysis-tools/Scripts/python.exe inspect_tap_effect.py`（在 pjskapk 目录）可重新导出 `analysis-6.8.1/ui-data/tap-effect.json` 和原贴图。

原预制体：`e5cd519baaf464685bf5e0a5bcc4d162`，`fx_Tap_single`。

- `PT_01` 的 ParticleSystem path ID 14：一次发射 1 个粒子，寿命 0.5 秒，4×4 序列图，颜色 alpha 恒为 1。Renderer 引用 `89238adfbd2d1b046be2d83b53172fac` 的 `mat_tap_texturesheet`。主贴图已经包含青色内环和白色外环；该 Renderer 不使用 `mat_tap_texturesheet_1`。网页删除之前额外叠加的白环和额外 0.8 透明度。
- `particle2` / `particle2_1`（ParticleSystem 13 / 12）：一次分别发射 8 / 7 片；寿命 0.1–0.7 / 0.2–0.7 秒；2×2 随机静态 UV 格。
- 两组 Renderer 均使用 `568a878723d034146899b0eebd8ca058` 的 `mat_sekai_01_1`，其 `_MainTex` 是 `ec92a5114c5efd0439a94b59a4714420` 的 `tex_sekai_01_1`：粉、黄、青绿、蓝紫四格渐变，带浅色三角边缘。网页直接采样导出的原图，不再用白色三角 mask 加纯色填充。
- 碎片 alpha 键分别为 `[0,0], [0.050004,1], [0.338231,1], [0.700008,1], [1,0]` 和 `[0,0], [0.047059,1], [0.338231,1], [0.700008,1], [1,0]`。网页统一到 5% 渐入、70% 后渐出。

当前主渲染：`tap-mesh.js` 使用导出的 `sekai_PT_05` 原网格（30 顶点、18 面），保留正反面、边缘、法线和 UV；三轴随机初始姿态和 Z 轴 0.2617994 rad/s 旋转来自粒子数据。着色混合原 `_MainTex` / `_LightTex`，公式来自导出的 `tap-shader-9-0.txt`。CSS 粒子仅作为资源未就绪或 WebGL 不可用时的降级路径。

## 尺寸校准（2026-09-06）

参考 `sekai-tap-3d.mp4` 的 1.633–1.702 秒，见 `sekai-tap-3d-frames.jpg`。每格是原录屏 400×350px 的等尺寸裁切：外圈直径约 210px，右侧较大碎片长边约 55px，其他可见碎片约 10–45px；这是单次录屏的人工近似读数，不是游戏常量。

网页保留 72px 圆环，因此较大碎片投影长边应约 19px。旧版 24–40px 是用户早先要求的放大适配，不能当作原版比例。现将两条渲染路径同步调至 10–22 CSS px（网格投影前），倾斜后可见尺寸还会缩小；尺寸分组、屏幕位移和正交投影仍属于网页适配，并未声称完整移植 Unity 粒子引擎。此轮只修改尺寸，不改变圆环、颜色、alpha 和三维姿态。
