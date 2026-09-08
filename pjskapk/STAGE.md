# Stage SEKAI / area7

2026-09-08；当前实现对应设备缓存中的原资源，不含角色、对话、商店交互或花田子区域。主舞台并非一张 area7 背景：必须同时实例化区域道具，尤其是 `areaitem0707`。只加载基础包会缺少绿色灯架、四叶草和主屏幕图案。

## 可复查的来源

所有路径以仓库根目录为基准。

- `area/area7`：`pjskapk/analysis-6.8.1/map-bundles/bdb9d271af2a6fe7573b58e49ea64c54`，SHA256 `4d889dd6781e78c19afb1221204219a11f4d065ca82c269dec3167985e27320d`。
- `areaitem/areaitem0707`：缓存 `d5c636027fbe779d12f2c1f0c7be0373`，SHA256 `e9172dfd24e35733c17450b2243139e2bbd71878ade1adbf4cbc130239c7c817`。
- `shader/particles`：缓存 `9d4b915e1050eebe5e8a63cb2a819ad7`，SHA256 `00b6ed6cf40132fa4625cf2676866967e27fc163643072d18decceaa4686ce03`。
- 原对象完整字段：`pjskapk/analysis-6.8.1/stage-audit/objects.json`、`renderers.json`、各 `areaitem070*.json`、Shader ID 命名的 JSON/GLES 文件。
- 网页原数据：`themes/sekai-next/source/game-assets/map/area7/{scene,effects,items}.json`；每组含完整节点、path_id，items 另含各包 SHA256 与 spawn Transform ID。
- 区域道具 key 与挂点的定位线索来自 [Sekai-World 日服主数据 areaItems.json](https://github.com/Sekai-World/sekai-master-db-diff/blob/main/areaItems.json)，筛选 areaId=7，保存于 `stage-audit/master-area-items.json`。这是社区导出的定位线索；实际图片和挂点坐标由设备缓存交叉确认，不将远程 main 当作 APK 版本证据。
- IL2CPP `Sekai.MasterAreaItem` 提供 `areaId / spawnPoint / assetbundleName` 字段；stringliteral 有 `areaitem/{0}`。只使用字段与字符串证据，不声称恢复加载方法体。

## HOME-STAGE 图层

| 完整节点 | Renderer path_id | 原始几何/排序 | 网页映射 |
| --- | --- | --- | --- |
| area7/Background/background | 2147568351751022300 | 3378.1444×1600；pivot(0,1)，order10 | unknown-ground |
| area7/Background/light1 | -928967113964503584 | position(1689,-1600)，3378.1444×1600，pivot(.5,0)，order11 | scene-back-layers 原 stage_light.png |
| area7/Background/light2 | 5001529475888340205 | position(2886,-737)，641×300，pivot(.5,0)，order11 | scene-back-layers 原 stage_light2.png |
| area7/View/foreground_view/sprite | -505878144265272300 | position(1715,-1600)，3319×656.3452，pivot(.5,0)，order1600 | classroom-furniture，沿用历史容器名称 |
| areaitem0707/root/sprite | -8798323065312523174 | Sprite -783164797407340184，1601×913，pivot(.5,0)，序列化order4025 | 绿色主舞台补层；按设备画面放在背景灯光后、粒子前 |

四叶草挂点 `area7` 中 `spawn-point7` Transform `-8906712583894700021`，position=(2041,-912)，祖先为零位移、单位缩放；不是按截图估位置。Item根及sprite局部坐标为0。其 BodySprite 组件 `-4156617022945083055` 的 pixcelSize=(1601,913)、baseColor/multiplicationColor=(1,1,1,1)。**不做 CSS 染绿**：灯架、绿光与四叶草本身在原贴图中。

另挂载0701–0706、0708–0709原道具：桌面物品、荧光棒、团扇、毛巾、花篮和音箱。各挂点/尺寸/pivot在items.json；不挂载可移动角色。AreaDataController `-7730419551527970636`：scrollMax=(3378,1600)、defaultPosition=(1750,785)、BaseLineY=1141、ScaleRev=.00125。

**投影适配**：实际背景DOM宽/3378.1444为sx，高/1600为sy；left=背景left+position.x×sx−width×pivot.x；top=背景top−position.y×sy−height×(1−pivot.y)。共用 `home-world.js` paint 与 panLimit，边界取12%视口与实际图片余量的较小值，留1 CSS px。resize/load重新夹紧。未恢复Unity运行时相机和动态排序算法；四叶草进入back层、其他道具进入front层是显式网页分层，不把原order4025改写成11。

## HOME-STAGE-FX

20个生效ParticleSystem，5张原Texture2D：tex_common_01、tex_sekai_01、tex_sekai_aura_01、tex_sekai_02、tex_sekai_light_01。完整清单见effects.json的groups（id为字符串避免64位精度丢失）。

| 节点（前缀 area7/Background/） | path_id | 原模块 → 实现 |
| --- | --- | --- |
| fx_light_moniter_center | -7878048157366490355 | X尺寸2/Y尺寸1，size3D；局部屏幕光晕 |
| fx_light_moniter_R | -6729710320204755600 | life3s，rate1/s，原UV和颜色曲线 |
| fx_light_moniter_L / pt_light_moniter_L | 8485459919200210803 / 6327186186551105064 | 两个左侧屏幕发射器，不合并成一团 |
| fx_spot/fx_spot_01 | 7119853185533469995 | life30s，burst0s×5，X2/Y4；RotationModule角速度曲线 |
| fx_spot/fx_spot_02 | 7436878384713094626 | duration10s、life5s，burst0s×3和5s×3，X2/Y4 |
| fx_spot/fx_spot_03 | -4298466174459053642 | burst0/5s各3，X1/Y2 |
| fx_tri_front/circle | -4310150726951342577 | life2s，rate3/s，原sizeOverLifetime，不使用灯光局部单位 |
| fx_tri_front/fx_tri | 170659835818590524 | 原30顶点厚三角Mesh、UV、法线、双纹理光向量 |

其余三角和线条同样从effects.json加载。这里记录节点只是索引，不表示只实现表中几组。

Shader `6140383380374060507` 为 `Sekai/Particles/Additive+AlphaBlend`：原 blend One / OneMinusSrcAlpha；片元输出 RGB=texture.rgb×vertex.rgb×texture.a×vertex.a，输出alpha在CustomData0.x>0.5时为0，否则为texture.a×vertex.a。八组使用它的粒子均CustomDataModule.mode0=1、vector0_0常量1，所以网页使用加法，而不是普通alpha造成黑底。原GLES中的 `0.5 >= vs_TEXCOORD1` 可复查。普通加法shader6228555572980372533、厚三角shader-1595268760865149387按原Cull Back处理。

`home-effects.js` 中三维尺寸在旋转前作用到顶点；spot_01的角速度按寿命曲线32步积分，不把起始速度固定应用整个寿命。按原duration、burst.time/count/cycleCount/probability创建重复时间轴，寿命长于周期时保留多周期重叠；不把5秒处的burst放到0秒。

**适配/缺口**：归一化四顶点灯光网格采用600区域单位的局部投影标定，非原游戏常量；普通三角/圆斑已使用区域单位，不乘600。曲线当前按关键帧线性插值，未完整实现Unity加权Hermite；旋转积分数值近似，运行时随机序列/完整3D相机/后处理未逐帧一致。灯光叠图中固有的光束不额外虚构动画；动态来自原粒子模块。Take 001仅有常量旋转片段，没有证据说明它控制舞台灯光。

## 生命周期、验证和复现

选择地图7 → 共用世界切换动画 → `/?world=7`；选择写入sekai-home-world，HOME UI保持不变。无模糊。隐藏页停止计时，恢复续播；减少动态保持静帧；WebGL丢失/恢复沿用共用实现；加载失败保留基础图并报告控制台错误。

提取（仓库根目录）：

```powershell
& pjskapk/analysis-tools/Scripts/python.exe pjskapk/export_classroom.py --area 7
& pjskapk/analysis-tools/Scripts/python.exe pjskapk/export_area27_effects.py --area 7
& pjskapk/analysis-tools/Scripts/python.exe pjskapk/audit_classroom_fx.py --area 7
& pjskapk/analysis-tools/Scripts/python.exe pjskapk/export_stage_items.py
npm.cmd run build
node tools/verify-stage.cjs
```

2026-09-08：设备2880×1800截图 `analysis-6.8.1/stage-inside.png`；初版仅area7时缺绿色主舞台，经用户指出后补查areaitem0707及其他8个道具。最终浏览器1280×720/DPR1截图 `stage-browser.png` 已人工查看，绿色主舞台/前景物品/灯光均已显示。`tools/verify-stage-browser.cjs` 使用独立无头Chrome实际点击地图转场，确认20组帧计时、13张场景/道具图层、1280×720/1920×1080/699×842双端拖动不露底、选择持久化和HERE、无pageerror。浏览器100%缩放；非100%缩放未逐档截图，分数视口边界由verify-home-pan单测覆盖。未将连续30秒灯光与设备录像逐帧对齐。

构建、verify-stage/map/classroom/area27/home/home-pan与上述浏览器检查均执行；不提交、不推送、不部署。
