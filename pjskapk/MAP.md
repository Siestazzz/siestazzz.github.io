# SEKAI 地图实现与来源（2026-09-07）

## 动效补全（同日后续，优先于下文早期版本说明）

- 按用户要求隐藏地图选择页右上角菜单按钮；主页菜单不改。
- `audit_map_motion.py` 输出实际 prefab 组件到 `analysis-6.8.1/map-motion/`；`export_map_motion.py` 导出原网格、法线、UV、两套主／发光纹理及三组粒子参数到 `game-assets/map/motion-runtime.json`。完整数据留在 `motion-particles.json`。
- 左右箭头不再使用字体符号，改为原 Sprite `btn_arrow_switching_wh`。组件 1067／1331 为 `TweenPosition`：单程 0.75 秒，PingPong，X 从 -10 到 10／10 到 -10；网页按设计缩放换算像素。
- 星球 `effectImage`（1278）为 `TweenAlpha`：单程 2 秒，PingPong，alpha 0 → 0.75；用对应的 `_eff` 原始覆盖图。主图不是整体变透明。
- `PlayListWorldCell.Update`（RVA 0x4D53694）实际汇编：读取 defaultAnimateValue + animateValue，除 180 乘 PI 后调用三角函数，乘 15 写 image.localPosition.y；随后 animateValue += 1。网页正弦上下浮动 15 个设计单位，按 60 Hz 折合 6 秒周期，不让高刷新率屏幕加快；各世界初相位为网页分散值。
- HERE 的原 TweenRotation 为 1 秒单程、0 到 -5 度；网页坐标方向反转，表现为轻微摆动。
- 背景是 `WorldMapPlayListBG/SekaiEffect/back/particle1` 与其 particle2/3，三组均使用原 `sekai_PT_05` 厚三角网格（30 顶点，包含边缘与背面），不是扁平 CSS 三角。
- particle1：寿命 30–35 秒，尺寸 .01–.05，发射率 2/s；particle2 尺寸 .005–.02，1/s；particle3 寿命 25–35 秒，尺寸 .01–.06，2/s。使用原 2×2 图集、随机三轴初始方向、生命周期 alpha 五键。
- RotationModule 的 separateAxes=false，故仅使用 Z 角速度 0.08726646 rad/s，不错误叠加未启用的 X/Y 180°/s。OrbitalZ 分别为 -.2、-.3、-.08，网页使用其公转方向／速度。
- 法线驱动 MainTex／LightTex 混合，沿用此前已审计的 `Sekai/SekaiEffect` WebGL 实现；每组按对应原 LightVector 计算。三组纹理来自各自绑定材质，不复用点击特效那套颜色。
- 网页发射空间、可见窗口换算仍为适配，未声称重建整个 Unity 摄像机／发射器。最初将所有存活粒子塞入视口导致过密，已保留屏幕外发射范围；粒子生命周期和尺寸比例来自原始数据。
- 点击箭头时按角度插值并每帧重新计算椭圆位置，避免只对 left/top 插值导致星球走直线。100ms 对应原 SelectByIndexAsync 默认时间；网页插值为线性。
- 减少动态偏好下停用循环动效；后台标签停止绘制，回到前台恢复。

## 实机检查

设备 `19bd96b8`，游戏 `com.sega.pjsekai`，截图 2880×1800。

- `sekai-map-check.png`：当前“？？？”世界，游戏完整 HUD。
- `sekai-map-select.png`：点左上角地球后的 SEKAI 地图。
- `map-rotated.png`：右箭头操作后，外围世界位置变化，中央“？？？”不变。
- `map-focus.png`：点击中央世界时彩色三角碎片过渡中的一帧。
- `map-inside.png`：进入后水平拖动，天空／草地／树与 HUD 分离。
- `map-tree-tap.png`：世界树点击后的画面，树上还存在独立发光粒子。

## 原始资源对应

主题素材目录：`D:\WorkSpace\blogs\blogtheme\themes\sekai-next\source\game-assets\map`。

| 内容 | 原始来源 | 网页使用 |
| --- | --- | --- |
| 地球 | APK `08497d3c64d68b44c97d88db5e85dfad`，Sprite `icon_worldMap_wh` | 原始形状，白色贴图着为深色 |
| 地图底图 | APK `f60908b480d42445783a2adde564915c`，`bg_sekai` | 原图背景 |
| 六个球体 | 设备 `worldmap/contents/normal`，缓存 `3e71/639e12c9470982e4dbc2bae9c77452c8` | `img_worldMap_areaS05/07/08/09/10/27.png` |
| “？？？”天空草地 | 设备 `area/area27` | `bg.png` |
| 云 | 同一 area27 包 | `tex_cloud_01.png` |
| 世界树 | 设备 `area_sd/wish_tree_ppr`，缓存 `092e/5cecc036cace036fcfccdc5233232cb3` | 原始 Spine `.skel`、`.atlas`、`.png` |

`provenance.json` 记录各贴图、骨骼资产的 bundle SHA-256、Unity path_id 和原名。没有用游戏截图当场景底图，没有把树的散件凭目测拼合。

树骨骼记录版本 `4.1.23`。浏览器使用 Spine WebGL `4.1.56`，运行时实际解析到动画：

- `wish_tree_common_idle_01`：默认循环。
- `wish_tree_common_sway_01`：点树播放，结束后回默认循环。

主数据交叉核对：[areas.json](https://raw.githubusercontent.com/Sekai-World/sekai-master-db-diff/main/areas.json) 的 area27 = `？？？のセカイ`，`additionalAreaType=center_of_ring`；[areaSpiritWorldTrees.json](https://raw.githubusercontent.com/Sekai-World/sekai-master-db-diff/main/areaSpiritWorldTrees.json) 的 area27 默认树为 `wish_tree_ppr`。公开提取主数据仅辅助定位；实际使用的美术资源从用户设备读取。未来的 finale 树不视作本次实机默认状态。

## 代码／布局数据

`analysis-6.8.1/il2cpp-dump/dump.cs`：

- `WorldMapArea` 有独立名称牌、HERE、按钮、角色气泡引用。
- `MasterAreaModel` 区分 `IsOnRing` 与 `IsCenterOfRing`。
- `PlayListWorldsController` 包含 `worldCellsInRing`、`_worldCellsCenterOfRing`、`Next/Prev`、拖动、选择、位置计算。
- APK `1a97dd8c82a0a42729f6cf3ba44aeb0b` 的组件 path_id `1146`，原始偏移 44 起连续三个 float：`345`、`1.8500000238`、`0.8500000238`。由 `audit_map_layout.py` 重新解析，输出 `map-layout-metadata.json`。

这些值是实际序列化字段，不是按截图估计；RVA 仅作为方法定位，不声称完整反编译了所有函数。

## 明确的网页适配与边界

- 六个世界保持原球体素材和五外一中的结构。五个禁入是用户要求，不是模仿游戏本身的账号解锁状态。未开放文字是网页提示。
- 环形半径系数使用原数据；网页的整体缩放、纵向位置、前后大小系数与 350ms CSS 插值是适配参数，不是原始摄像机算法完整移植。
- 仅保留基础世界选择；外围世界的子区域展开、现实世界、记忆碎片、角色、小人、任务和商品均不实现。
- 世界树骨骼循环／摇动是真实原始数据。云漂移、环境三角粒子和 650ms 页面过渡是参考实机实现的网页近似；未完整重建 Unity 粒子系统与树发光 Shader，不能称为逐帧一致。
- 根据用户补充：世界内部就是主页。已删除独立世界页面 UI，主页 `/` 直接复用既有 `index.ejs`，将街景背景替换为 `_partial/home-world.ejs`。地图只负责选背景，中央世界返回 `/`；旧地址 `/map/?area=27` 兼容跳转主页。
- 主页保留原有精选轮播、随机一篇、全部文章、友链、GitHub、顶部统计等布局。没有新增一套内部快捷栏。只有 area27 开放，因此当前默认背景即 area27；以后开放其他世界再增加对应资源映射。
- 地图与主页目前仍是 Hexo 文档导航，带过渡遮罩；不再声称两者同文档无刷新。Spine 资源首次加载异步，不能声称整个切换过程已完全等同游戏。
- 窗口变窄时另外调整竖向展开与文字可读性；场景横向拖动有边界。
- 运行时：[官方 Spine WebGL 示例](https://github.com/EsotericSoftware/spine-runtimes/blob/4.1/spine-ts/spine-webgl/example/index.html)。下载地址 `https://unpkg.com/@esotericsoftware/spine-webgl@4.1.56/dist/iife/spine-webgl.js`；附 `SPINE-LICENSE.txt`，没有删除许可文本。游戏素材与 Spine 运行时并非无条件可公开再分发；本次未发布，正式发布前需确认各自授权条件。

## 重复执行

```powershell
& pjskapk/analysis-tools/Scripts/python.exe pjskapk/export_map_web.py
& pjskapk/analysis-tools/Scripts/python.exe pjskapk/audit_map_layout.py
npm.cmd run build
node tools/verify-map.cjs
```

设备 bundle 读取工具：`extract_map_assets.py`。缓存目录前缀是逻辑父目录 MD5 前四位，文件名是完整逻辑键 MD5；例如 `area`→`4b82`，不能把所有缓存都在 4b82 当作通用规则。
