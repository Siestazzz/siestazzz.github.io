# 友链静态称号栏

## 原生分层复查结果

`honor-library/layers.html` 可浏览真正分开的图层。不是对成品图进行抠图。

- 羁绊组件 `UIPartsBondsHonorImage` 的 leftBgImage/rightBgImage/leftCharaIconImage/rightCharaIconImage/wordImage/frameImage/patternImage 是独立引用。
- APK prefab `29864637d77434f119b95e2e1b65f812` 中：right → degree_bgBase，left → degree_bgColor，pattern → degree_bgTexture_main，frame → frame_degree_m_4。原始引用及RGBA记录在 bonds-nodes.json。蓝红色为Prefab序列化示例值，不当作全部运行时配色。
- 平板 df25 类别缓存（bonds_honor/word）提取4110张独立字样；be85 类别缓存（bonds_honor/character）提取57张独立角色贴图。记录在 bonds-textures.json，原包位于 bonds-word-bundles / bonds-character-bundles，PNG位于 bonds-layers/word / character。
- 普通称号已检查的2893包只有 degree_main/sub、rank_main/sub、scroll 五类Texture2D。对于这些包，未找到额外独立人物层或字层；此结论不扩大到全游戏所有资源。
- 合并图可手动裁出未遮挡纹理或抠出轮廓，但被覆盖像素无法原样恢复。当前已有原生分层，无需先对普通称号做破坏性补画；本轮未修改任何原PNG或博客页面。

复用：`pjskapk/analysis-tools/Scripts/python.exe pjskapk/extract_bonds_layers.py`，然后运行 build_honor_gallery.py。

## 扩展素材库

### 已连接平板提取结果

- 设备 19bd96b8，缓存 `/sdcard/Android/data/com.sega.pjsekai/files/data/b2f3/`，共2893个称号包，约37MB。逻辑名称 `honor/...` 的MD5对应文件名；`b2f3` 对应 honor 类别MD5前缀。
- `honor-library/device-bundles/` 保留原包，`device-extracted/` 保存原贴图，`device-textures.json` 记录包SHA256、Texture path_id、尺寸和名称；218张贴图暂未映射逻辑资源名，保留原包哈希。
- 提取7046张：degree_main/sub各1455张、rank_main/sub各2038张、scroll60张。`device-errors.json` 为空。它们是这台平板已缓存的素材，不是全服全历史资源的保证。
- `device.html` 为平板提取版预览入口，`index.html` 为APK通用素材和社区镜像入口。二者不混合来源。
- 缓存头处理参考 sssekai 的公开 AssetBundle.py（去4字节magic，128字节头每8字节前5字节取反）。包缺失可读Unity版本，解析器回退本机APK的2022.3.62f2；不能因此声称缓存内容属于6.8.1。
- 社区镜像重试后1630/1630张通过图片校验，约45MB，覆盖815个本次主数据索引背景包。

`D:\WorkSpace\blogs\blogtheme\pjskapk\honor-library\index.html` 是本地可搜索预览目录。大批图片保存在分析目录，不会随着 Hexo 发布；主题只携带需要使用的通用素材。

- APK 素材扩展为20项，包含9种主/副边框（含主白框）、基础底图/底色/底纹、遮罩、等级及星形图标。具体文件与来源以主题素材目录的 provenance.json 为准。
- `honor-library/background-index.json` 根据社区日服 honors/honorGroups 主数据生成，优先解析 group.backgroundAssetbundleName；普通和排位称号共815个去重主体图资源包、1630张主副图候选。不是全部历史版本、全区服或全部羁绊素材的保证。
- `honor-library/downloads.json` 记录每张图片URL、成功/缺失、大小和SHA256。主数据为公开仓库当前快照，不能声称属于本机6.8.1版本。
- `honor-library/honor/<bundle>/degree_main.png`、`degree_sub.png` 为普通称号；排位在 `rank_live/honor/` 下。很多图包含文字/角色，不是无字背景。
- 本轮不把任意日文称号套给友链，也不擅自清除原图文字。

复用命令（项目根目录执行）：

```powershell
pjskapk/analysis-tools/Scripts/python.exe pjskapk/export_honors.py
pjskapk/analysis-tools/Scripts/python.exe pjskapk/collect_honor_backgrounds.py
pwsh -NoProfile -File pjskapk/download_honor_backgrounds.ps1
pjskapk/analysis-tools/Scripts/python.exe pjskapk/build_honor_gallery.py
```

来源：本机APK、https://github.com/Sekai-World/sekai-master-db-diff 、https://github.com/Sekai-World/sekai-viewer/blob/main/src/components/widgets/DegreeImage.tsx 、https://storage.sekai.best/sekai-jp-assets/ 。镜像能否下载与未来可用性独立于本地APK；不使用身份验证绕过。

素材目录：`themes/sekai-next/source/game-assets/honors/`。
使用 `pjskapk/analysis-tools/Scripts/python.exe pjskapk/export_honors.py` 从本机 APK 解包文件提取，未重绘、未缩放 PNG。`provenance.json` 记录文件哈希名、path_id、原图尺寸和 Sprite border。

主框 `frame_degree_m_1..4` 为 380×80，副框 `frame_degree_s_1..4` 为 180×80。对应底纹为 `degree_bgTexture_main/sub`。网页按原图比例缩放；未加入未获取的 degree_main/sub 主图、等级或动态效果。自定义文字是博客适配，不是原游戏称号或游戏成就。

在 `themes/sekai-next/_config.yml` 的单个 friends 条目中配置：

```yaml
honors:
  - { text: '记录与分享', frame: 3 }
  - { text: '笔记', frame: 2 }
  - { text: '博客', frame: 1 }
```

最多三个，第一项为主称号，其余为副称号；frame 为1到4，非法值回退1。省略 honors 或设置空数组则不显示，不给其他站点自动分配称号。当前仅 Siestazzz 条目配置示例文字。称号和网址仅展示，只有「前往」跳转。

检查：`npm.cmd run build`、`node tools/verify-friends.cjs`；本地浏览器已截图检查三槽位显示。
