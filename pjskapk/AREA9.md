# WONDERLAND SEKAI / area9

2026-09-08。原资源及字段 + 网页投影适配。不含角色、交谈、商店与另一区域 area20。

## 来源

- `area/area9` → `analysis-6.8.1/map-bundles/9a0bed9a95e6339efdd43ff8013c6b7d`，SHA256 `e1783986d6663d163be625673356a312f41e10c58b2df031eb5b87e6fd1c84e4`。
- 原完整节点/Transform/ParticleSystem/MonoBehaviour在 `analysis-6.8.1/area9-audit/objects.json`。Renderer/材质及脚本类名在 `renderer-material-scripts.json`；原场景几何未适配前的记录为 `source-scene.json`。
- `areaItems.json` 仅作包名/挂点定位索引，地址与相关行保存在 `master-area-items.json`。九件实图均从设备缓存 areaitem0901–0909 包导出，不是从该网站下载图片。每包 SHA/Renderer/Sprite/spawn Transform 在运行 `items.json` 和审计 areaitem090*.json。
- 目录名或 UnityPy 的 2022.3.62f2 fallback 不证明资源版本；未将类型签名冒充恢复方法体。

## HOME-WONDERLAND：11原Sprite + 9区域道具

运行资源：`themes/sekai-next/source/game-assets/map/area9/scene.json`、`items.json` 与同目录 PNG。

| 完整节点（area9/） | Renderer path_id | 原字段 |
| --- | --- | --- |
| Background/bg_parts/sky | 1746001821669465501 | size90×1388，scaleX38.6，pivot(0,1)，order0 |
| MultiScrolls/background2/bg_far | -593377209023790674 | position(307,-508)，size3070×476.689，order3 |
| Background/bg_parts/ground | 6068266110396609117 | position(0,-574)，size3378×1027.585，order11 |
| Background/bg_parts/ferris_wheel | -3712231333928541301 | position(1209,-864)，size578×698，pivot(.5,0)，order11 |
| Background/bg_parts/rail | -4944959996267606281 | position(0,-99)，size3379.404×830，order12 |
| Background/bg_parts/bg_bolloon/bg_bolloon | -8721573327487347781 | position(185,-108)，size2216.791×591，order14 |
| Background/bg_parts/jetcoaster | 9148365579429180452 | position(1802.9,-696.4)，size454×212，order15 |
| Background/bg_parts/merrygoround/merrygoround | 7320631189125552639 | position(2685.6,-711.1)，size525×388，order16 |
| View/flower_bed/sprite | -7907746815046001171 | position(1393.5,-1408.2)，size892×392，order1408 |

另含 aurora 与 background_house，完整原值在 scene.json。原 AreaDataController `-1254746306079039548`：scrollMax(3378,1600)，defaultPosition(1689,785)，BaseLineY1141，ScaleRev.0017。

浏览器中看似小人的两件**静态区域道具**不是误导出的角色占位：中左为 `areaitem0903`「歌うロボット」（会唱歌的机器人，master id15，spawn-point3）；右侧初音外形为 `areaitem0905`「ミク(？)のきぐるみ」（初音(?)人偶服，master id24，spawn-point5）。前者 Renderer `-5536081600539437904` / Sprite `-8140374550360847797`，后者 Renderer `-8813160245119900744` / Sprite `-8270763913802022106`，均来自独立areaitem包的原静态PNG。旁边人物形铜像为0901「ショースターの銅像」。名称定位在master-area-items.json，图像/挂点证据在items.json和对应审计JSON；没有角色Spine、走动或交谈控制器。`world9-browser.png` 已核对此对应关系。

**网页适配**：没有把零散背景误当成一张background.png。`sky-base.png` 只是原 sky 按原38.6横向伸展后裁成3378宽；下方1388–1600以原最后一行延伸，实际被原ground覆盖。其作用是建立3378×1600 cover坐标，不是生成新景物。其他Sprite均保留原图及挂点：back层位于云之上、主粒子之下，花坛/道具front位于粒子之上。统一背景矩形投影与拖动。此DOM分层与边界夹紧不是完整Unity相机或动态深度排序。

## HOME-WONDERLAND-TWEEN：原设施运动

`scene.json/motion` → 独立 `source/js/area9-motion.js`，通过 `sekai-scene-ready`、`sekai-scene-project` 接入共用背景，不修改共用transform。

- `area9/Background/bg_parts/bg_bolloon/bg_bolloon`，TweenPosition `-7857966887954826161`：fromY=-8、toY=8、duration4s、loopType2；Sprite轻微上下浮动，周期8s。
- `area9/Background/bg_parts/merrygoround/merrygoround`，TweenPosition `4364250680418753231`：fromY=0、toY=15、duration3s、loopType2；木马轻微浮动，周期6s。
- 两者 curve 原首尾time0/1、value0/1、in/outSlope均0，网页用Hermite `3t²−2t³`。原单位乘当前scaleY并反转Y，用CSS translate承载，resize/拖动后不会脱离原位置。隐藏暂停、恢复续播，减少动态保留首态。
- **不是摩天轮整座旋转/过山车行驶**：原包没有Animator、Animation组件、Spine TextAsset；唯一AnimationClip `7258787190071960120` 的Take001只含常量旋转、时长1/24s，无位置/Float曲线。jetcoaster仅Sprite，无足够证据给它虚构路线。摩天轮的实际动态是下面两组光点。

## HOME-WONDERLAND-FX：28组粒子

10张原Texture2D，26场景光效/碎片组 + 2云组。原Mesh/UV/颜色与透明度/寿命/Shape/尺寸曲线/发射率与burst保存在effects.json。完整54个ParticleSystem中只有28个属于area9实例层级并带有效Renderer；其余为未实例化模板，不重复挂载。

| 完整节点/字段 | path_id | 映射 |
| --- | --- | --- |
| area9/Background/ParticleCloudfront | -8927230056910982661 | 120s，0.08/s，size1，4×1 clowd2原图集，velocityX[-.075,-.015] |
| area9/Background/ParticleCloudback | 5981969250811358081 | 120s，0.08/s，size.5，3×1 cloud1，velocityX[-.1,-.02] |
| area9/Background/bg_parts/ferris_wheel/fx_wheel | -1385175165893330960 | life2s，3/s+burst6，原crystal图、Shape半径.19、scale1.3 |
| 同上/pt_wheel_02 | 3637221815938122572 | life2s，1/s+burst1，原扇角31.5°、Shape旋转-35.11° |
| area9/Background/bg_parts/merrygoround/fx_attraction_tri_03 | 6454739463870268112 | 15/s+burst5、size.005–.007、Shape17圆环与原三轴旋转 |
| area9/Background/bg_parts/aurora/fx_aurora | -8679073575093280870 | 归一化4顶点光束Mesh，life2–5，size1–3，加法混合 |

其余为气球/星点/左右厚三角。三角源size6.6–19.5与Shape scale725已是区域单位，`webUnitScale=1`；云、气球、摩天轮、极光、木马小碎片与全景星点仍为局部单位，webUnitScale600是沿用课堂/舞台的**网页标定，非游戏常量**。父scale仍保留。云跟同一背景投影移动且不固定为每组一朵；不直接整张图集绘制。

材质依据：Shader6228555572980372533原Additive；厚三角-1595268760865149387原SekaiEffect/Cull Back；气球bg层-7086751676374408482是AlphaBlend而非加法。新shader原记录保存particle-shaders.json（含shader/particles包SHA）。云Shader10721来自Unity内建引用，未独立恢复其程序；Canvas source-over为网页适配。

## 已知边界

- 原PanoramaAreaMultiScroller background2.scrollValueX=-.068、其他effect=-.09/-1已审计；没有恢复原相机到多层位移的完整方法体，当前都跟同一首页拖动，未声称精确视差。
- 粒子曲线仍沿用共用线性近似；原随机序列、完整三维相机/发射形状/透明物体深度交错不是逐帧一致。设备、最终浏览器由主agent独占检查，避免同时点击平板或修改共用脚本。

## 复现/验证

`pjskapk/analysis-tools/Scripts/python.exe pjskapk/export_area9.py`：只写area9资产/审计，读取共用提取脚本并在本进程中适配参数，不编辑它们。随后 `node tools/verify-area9.cjs` 验证源hash/资产完整/11+9/28组/2个Tween/无角色；`node --check themes/sekai-next/source/js/area9-motion.js`。

子agent已执行以上静态验证；不运行Hexo、不占用浏览器、不操控设备。最终接入后的构建和实际视觉验收由主agent记录，不把源检查称为视觉通过。

主agent提供 `analysis-6.8.1/world9-reference.png` 后已实际查看并对照原木马图：金色木马就是 `merrygoround.png` 基础Sprite，不是另一个区域道具覆盖；0907为彩色乐器台。截图确认摩天轮/云中音符/极光/悬浮木马及地面道具的类别。单张图不能证明完整动画周期或像素级相机一致，后续动态验收仍由主agent执行。
