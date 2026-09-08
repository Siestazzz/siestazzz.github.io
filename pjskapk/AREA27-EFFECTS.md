# area27 云、漂浮碎片、世界树闪光

2026-09-08。本轮针对主页「？？？的 SEKAI」，不是 `/map/` 选择世界背景。

## 来源与复查

- 原始场景：设备 `area/area27`，缓存 `7f0a66117e3bcdf35ffdf3278b772534`。
- 原始树光效：设备 `area_sd/world_link_effect/wish_tree`，缓存 `35ec7f03c798736b29e1326dea528dd0`。
- `audit_area27.py` 保存场景、树和光效的完整对象数据到 `analysis-6.8.1/area27-audit/`；`export_area27_effects.py` 导出网页实际需要的节点、材质、原贴图和 Mesh。
- 网页数据和贴图：`themes/sekai-next/source/game-assets/map/area27/`；`effects.json` 内 `sources/textures` 记录包SHA256、Texture path_id、文件名，`groups` 用完整层级路径和字符串形式的64位path_id定位。
- 只选择 `area27/Background/` 下挂载的节点，不将同包中其他独立 prefab 的重复云组全部加到画面上。

```powershell
pjskapk/analysis-tools/Scripts/python.exe pjskapk/audit_area27.py
pjskapk/analysis-tools/Scripts/python.exe pjskapk/export_area27_effects.py
```

## 云：HOME-CLOUD / HOME-PAN

原层级 `area27/Background/fx_cloud`，15个子发射器，左右多组；两张贴图 `tex_cloud_01` / `tex_cloud_02`，UVModule 2×4，按各自startFrame取格。之前网页将整张图集当单幅背景并做95s平移，已移除。

例：`R_pt_cloud_1` / `-8841350809274218037`：位置(2562,-120)，Y缩放.5，startSize常量3.5，life常量30s，Burst1，maxNumParticles1，Velocity=(-.05,-.02)。`startLifetime.minScalar=200` 是闲置字段：**minMaxState=0 时只取 scalar=30，不能误当30–200随机寿命**。

网页 `home-effects.js` 以背景图实际矩形和3378×1600场景范围换算坐标，因而云随背景 `--pan` 一起移动；本地粒子速度与拖动位移叠加，而不是云固定在视口上。图集格子的宽高比和各节点Y缩放分别保留。

原 AreaDataController /4506348503888317416：scrollMax=(3378,1600)、defaultPosition=(1750,785)、sideViewParam.BaseLineY=1141。当前保留已有网页取景和±12%拖动范围；云粒子大小/速度到场景单位的600倍换算仍为网页校准，未完整恢复游戏相机/粒子缩放链。

## 大碎片与小碎片：HOME-MOTES

替换旧28个CSS三角形，接入6个有实际材质绑定的组：

| 节点（共同前缀 area27/Background/） | ParticleSystem ID | 关键数据 |
| --- | --- | --- |
| fx_tri_bottom/pt_tri | 1793550804831504547 | size随机20–35、life10–15s；原30顶点厚三角Mesh |
| fx_tri_bottom/L_pt_tri | 446916424865024792 | size随机10–20；左侧发射区域 |
| fx_tri_bottom/R_pt_tri | 2363550940852205162 | size随机10–20；右侧发射区域 |
| fx_tri_top/pt_tri_line | 1817729720541540400 | size随机2–6；独立材质tex_sekai_02 |
| fx_tri_bottom/pt_dust | 3855190785440059650 | 原图集中的发光尘粒 |
| fx_tri_top/pt_dust | 6319579860885047209 | 顶部尘粒，独立生命/尺寸参数 |

原 ShapeModule box尺寸、层级累加的AnchoredPosition、VelocityModule、生效RotationModule、ColorModule生命周期渐变与原材质纹理传到网页。上下父发射器中存在空Mesh/Material引用，导出器不擅自给空引用补一套素材。

限制：网页保留原主要粒子数据，但尚不是完整Unity粒子引擎；startSpeed、全部Shape/曲线插值/相机深度并未完整模拟。当前用随机预热、线性关键帧插值、二维屏幕位置+三维Mesh姿态渲染。不要宣称与设备逐帧一致。

## 树的闪光：HOME-TREE-FX

原树 `_effectOffsetY=480` 来自 `area_sd/wish_tree_ppr` 的 `AreaObjectWorldTreeView` 组件2012596474811835188，不在Spine动画贴图内部。

本轮实际反汇编：

- `GetWorldTreeEffectAssetBundleName` RVA `0x60BE068`：枚举ToString→ToLower→String.Format。格式串经ELF relocation定位到`0xB935348`，内容 `area_sd/world_link_effect/{0}`。
- `AreaObjectWorldTreeView.PlayTreeEffect(string,TreeState)` RVA `0x607F554`：调用 `AreaController.GetTreeEffectLoadedAsset`，实例化到树Transform下，读取this+0x2C的Y偏移并设置localPosition；idle与sway分开存储。sway分支有3s延迟回调/清理。
- 反汇编留存：`analysis-6.8.1/il2cpp-audit/0x60be068.asm`、`0x607f554.asm`。

当前接入原 `wish_tree_ppr_idle` 下六组：

| 组 | ParticleSystem ID | 说明 |
| --- | --- | --- |
| pt_seedling_glow_01 | -7355129175342827681 | 持续柔光，Additive；Renderer模式0 Billboard，闲置Mesh引用不得启用 |
| pt_seedling_sekai_01 | -2211087578966490232 | 低透明度原Mesh碎片 |
| pt_seedling_howa_01 | 417364936279255705 | 柔光点 |
| pt_seedling_kira_yellow_01 | 8400833228759930887 | 短生命闪点，发射率20/s |
| pt_seedling_howa_big_01 | 8940290499464644643 | 大柔光 |
| pt_seedling_kira_01 | 8985789442597142422 | 闪点，发射率15/s |

采用原图集、格子、颜色/alpha键、生命、尺寸和圆形发射区域；rotation3D=false时不使用闲置X/Y旋转。光效使用Spine实际投影矩阵参数定位，拖动时随树移动，不另设屏幕固定光点。

网页混合使用预乘alpha画布，Additive写入RGB但不增加遮挡alpha，避免黑色方片/整片压暗背景。当前米到骨骼单位、Mesh与Billboard尺寸映射仍有网页校准（分别100与1000）；未声称恢复Unity全部缩放链。当前只接idle，点击树的Spine摇动保持原行为；各组合sway粒子尚未接入。

## 验证和边界

- 设备现场截图：`analysis-6.8.1/area27-audit/device-before.png`，2880×1800。确认大碎片、多层云、树上独立闪光存在。
- `tools/verify-area27.cjs` 检查15云+6场景+6树组、64位ID、资源存在、MinMaxCurve常量模式、Billboard忽略闲置Mesh，以及页面挂载。
- 本轮执行 `npm.cmd run build`、`node tools/verify-area27.cjs`、`node tools/verify-home.cjs`、`node tools/verify-map.cjs` 均通过。浏览器1280×720截图确认大碎片和独立树光效显示；拖动150px后云data-pan=150px、背景/树位置同步改变，循环frame继续推进；读取控制台无error。未将该检查冒充逐帧实机复刻验收。
- 隐藏页暂停效果时间；减少动态效果时静帧，拖动/缩放仍重绘；WebGL丢失可重建。无WebGL仍画云，树/场景粒子不冒充完整降级。
- 本文记录的是原始证据与网页移植边界，不是“完全还原”结论。
