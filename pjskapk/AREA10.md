# 誰もいない SEKAI / EMPTY SEKAI（area10）

2026-09-08。独立场景包，原资源 + 网页投影适配；无人物。由 root 统一接入主页，不创建另一套主页 UI。

## 证据与复现

- 原逻辑包 `area/area10`，缓存 `analysis-6.8.1/map-bundles/32dd412a0dd00548b821556b585e4ed6`，SHA256 `ca2388307160e9ceef5274b7b120564300605d5814d4ac34bd41bf3389d6dc84`。
- `analysis-6.8.1/area10-audit/objects.json` 保留原 GameObject、Transform、SpriteRenderer、ParticleSystem、MonoBehaviour、AnimationClip 的完整 typetree，外层 path_id 为字符串。目录版本号与 UnityPy fallback 不能证明实际游戏缓存版本。
- `area10-audit/renderers.json` 与 Shader `6228555572980372533.json/.glsl.txt`、`-1595268760865149387.json/.glsl.txt` 保存原材质着色器证据，来源键/包 SHA256 在 Shader JSON 内。
- `area10-audit/areaitem1001.json`–`1008.json` 原道具节点、组件和 Sprite 引用；`master-area-items.json` 的社区主数据仅定位逻辑包/挂点，不代替设备资源证据。
- `export_area10.py` 独立包装已有场景/粒子/道具导出器，仅在内存适配 area 参数，不修改共用脚本。新拉取依赖只写 `area10-audit/`，共用缓存只读；不发送设备输入、不截图、不录屏。

```powershell
& pjskapk/analysis-tools/Scripts/python.exe pjskapk/export_area10.py
node tools/verify-area10.cjs
```

运行资产在 `themes/sekai-next/source/game-assets/map/area10/`：`scene.json`、`items.json`、`effects.json` 及全部原 PNG。没有 AI 重画素材或截屏当背景。

## HOME-EMPTY：背景与两层前景

| 完整原节点 | Renderer path_id | Sprite path_id | 原位置 / 尺寸 / order |
| --- | --- | --- | --- |
| area10/Background/background | 4339685190670556740 | -8993683364943105056 | (0,0)，3378.1444×1600，0 |
| area10/View/try1_view/sprite (1) | 9034726566253210095 | 2347622400733906189 | (771.99994,-1517)，1429×564，1877 |
| area10/View/try2_view/sprite (2) | -8705880428555136276 | 8721099696574903168 | (2653.30005,-1421.69995)，742×343，1781 |

文件分别 `bg.png`、`try1.png`、`try2.png`，保留透明 alpha、Sprite pivot 和原大小，前景的 pivot=(.5,0)。两张 try 图为独立近景，不是给背景图增加 CSS 阴影。底图 pivot=(0,1)，明确 `groundFile=bg.png`，不重复挂载。

AreaDataController `3946379252017081923`：scrollMin=(0,0)、scrollMax=(3378,1600)、defaultPosition=(1689,785)、BaseLineY=1141、ScaleRev=.0017。scene.json 保留这些字段；网页不谎称完整采用 Unity 相机/视差算法。

接口：`scene.coordinateSize` 基于原 Sprite 大小；共用 `home-world.js` 根据实际 ground 矩形投影，x 向右、y 翻向下、保留 pivot。`webLayer=front` 将两层前景放在粒子上方，是简化合成；原 order 不改写。全部 SpriteRenderer m_Color 为白色/alpha1，sourceColor/opacity 有据可查。

## HOME-EMPTY-ITEMS：8 件静态道具

本世界主数据有 **8 件**，不套用教室的 9 件数量。全部使用 `area10` 的原 `spawn-point1`–`8`，不是按截图摆放。Item 本身 root/sprite 零位移、单位缩放；完整 ancestry 保存在 items.json。order4025 统一放前层是当前网页静态合成，不等于恢复角色的深度排序。

| 原包尾号 | 内容 | 挂点 Transform path_id | 原 x,y |
| --- | --- | --- | --- |
| 1001 | 音乐盒 | 2398863192730594336 | 2764.6001,-839.8000 |
| 1002 | 水族箱 | 1121995812817337790 | 1863,-876 |
| 1003 | 绘名的画 | -5150565504376348734 | 2919,-830 |
| 1004 | 可爱的衣服 | 9067430736905780293 | 2005,-928 |
| 1005 | 重新系起的丝带 | -8633903846227227933 | 2443.1001,-902 |
| 1006 | Nightcord 房间 | -2554455043352304542 | 3100.1001,-946.1000 |
| 1007 | 碎镜 | -265803093816533939 | 2369.1001,-841.9000 |
| 1008 | 音箱 | 5346709704856644256 | 2611.3999,-846.1000 |

每件包 SHA256、Renderer/Sprite 字符串 ID、size/pivot/sourceColor 在 items.json；背景拖动时由同一 projection 更新，道具没有单独固定屏幕坐标。可爱的衣服是静态道具，不是挂载了人物。

## HOME-EMPTY-FX：原 15 组粒子

6 张原图集：`tex_sekai_light_01`、`tex_ui_common_03`、`tex_sekai_aura_01`、`tex_sekai_01`、`tex_common_01`、`tex_sekai_02`。完整节点及原 ParticleSystem path_id 见 effects.json，不能把相同叶节点名的不同发射器合并。

| 原粒子名 / path_id | 原参数 | 网页对应 |
| --- | --- | --- |
| fx_light_sun_front / -9098758780718772087 | (2823,101)，size3D X2–5 / Y4–5，Z角-50°至-45°，life2s，rate随机0–1/s，alpha0→.3137255→0 | 原灯束图集、归一化四顶点、size3D先缩放后旋转 |
| fx_light_sun_back / -8035258274524445893 | 同位置/范围，独立组 | 不省略第二个发射器 |
| fx_light_ground / -1087198655076608994 | (1994,-874)，size3D X4→1 / Y.5→1，life2s | 原地面柔光，不额外画白色遮罩 |
| fx_tri_top / -4309095948399572154 | size区间5.4→4.2，life20s，rate2/s，三轴自转±1.0471976rad/s | 原厚三角30顶点及18面/法线/UV |
| fx_tri_bottom / 7831239697673927826 | size6–30，life10s，rate2/s，三轴自转±.4363323rad/s | 与上部区分大小/运动 |
| pt_dust_02 / -5917541449026186577 | size60→6，life15s，rate2/s，形状2700×270 | 原 tex_ui_common_03 与透明度曲线 |
| pt_dust_01 / 6389211860097760160 | size100→25，life10s，rate2/s，形状2900×518 | 不替换成 CSS 漂浮圆点 |

“4→1”等表示随机区间原 min/max 字段顺序，不表示寿命内线性由4缩为1；寿命尺寸另由原 sizeLife 决定。

所有日光/柔光使用 `Sekai/Particles/Additive`（6228555572980372533），不是舞台的 Additive+AlphaBlend Shader。原 blend SrcAlpha/One；网页预乘后 ONE/ONE 等价合成。厚三角 Shader `Sekai/SekaiEffect`（-1595268760865149387）按原 Cull Back 剔背，保留双贴图/LightVector；避免变黑或前后面重复透明。

日光 startColor.mode=4 表示在 gradient 中随机采色，不能用闲置 maxColor 的鲜粉色值代替。原 gradient 淡暖灰到粉白；alpha由独立 ColorModule 生命周期控制。rateCurve随机0–1网页采用均值.5/s的预热槽位属适配，不是原随机序列。

**局部单位适配**：只有三个 `fx_light_*` 的归一化 ±.5 四顶点在 JSON 显式标 `webUnits=600`，参照已实现灯光的局部投影校准；不是源包中的600常量。其他12组已是区域单位，webUnits=1，不做全球放大。size3D、shape/velocity均应一致换算；不能只乘尺寸导致光源飘移。

`Take 001` AnimationClip `7749196516868125194` 仅0.0416667s常量旋转，position/rotation/float曲线数组为空，无 Animator/Animation 控制器；没有将它虚构成结构缓慢摇摆。实际持续动态由上述粒子模块提供。

## 生命周期、限制与验证

由共用主页渲染器装配；随背景拖动与 resize 投影、隐藏暂停、减少动画静帧、WebGL恢复和世界转场应沿用公共实现。网页粒子曲线为关键帧线性插值、发射为周期预热，未逐帧还原 Unity 随机序列、完整3D相机、Shape全部类型及后处理。默认镜头目前为网页响应式 cover，而不是直接使用 AreaDataController.defaultPosition。

2026-09-08 独立包验证：实际运行导出与 `verify-area10.cjs` 通过（3场景、8道具、15粒子、6图集、文件存在/哈希/Shader/单位/无人物检查）；已人工查看导出的原背景 PNG。此子任务严格不控制设备/浏览器、不启动构建或服务；设备截图、网页视觉及转场拖动验收由 root 串行完成，未在此声称已做。尚未逐帧比较连续日光与游戏录像。
