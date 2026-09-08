# 本地文章导入记录

## 图片与阅读页后续修正（2026-09-05）

已补齐 HTML `<img alt>` 的本地匹配，修复 NepCTF 漏匹配的 6 张图。按用户要求，将 CISCN 剩余 25 张原图床图片下载并校验为 PNG，映射保存在 `downloaded-post-images.json`。目前 163 张正文图片全部由本地 `/media/posts/` 提供，无远程图片引用；原始 Markdown 与其副本均未改动。

`node tools/download-post-images.cjs` 下载清单中尚未本地化的图片；`node tools/import-local-posts.cjs --repair-images` 只允许图片地址差异的更新，正文和元信息差异会拒绝覆盖。

全部 13 篇文章有章节目录，无小标题的文章提供“正文”入口。正文与侧栏独立滚动，整个阅读区裁切在固定顶部栏下方，移动端目录可折叠。`node tools/verify-reader.cjs` 检查目录锚点及本地服务的全部图片响应；它是非浏览器测试，不代表已进行浏览器视觉验收。

来源：`D:\WorkSpace\blogs` 下除 `blogtheme` 外的十个文章目录。2026-09-05 导入当前 Hexo 项目；未部署、未提交 GitHub，来源目录未修改。

## 导入策略

- 10 篇独立文章导入到 `source/_posts/`，保留原有 3 篇演示文章，总计 13 篇。
- 每篇以不含“副本”的 Markdown 为准。7 份副本不重复发文；其中 Allsafe 副本存在标题、引言及少量旁白差异，仍完整留在原目录，不做自动合并。Qcalc PDF 视为同文导出，不重复发文。
- 正文、代码块保留，只增加 Hexo 元信息、提取一级标题到文章标题并转换图片路径。
- 原文没有发布日期，暂以来源 Markdown 的文件修改时间作为 date/updated。这不是推断出的真实发表时间，文章元信息以 `source_date_basis: file-mtime` 标记，后续可校正。
- 图片按文章目录隔离，以内容哈希命名到 `source/media/posts/`。Windows 绝对路径和 Typora 相对路径已转换；远程图片若有唯一对应的本地图片则使用本地文件，否则保留原外链，不擅自抓取。
- 不导入依赖、游戏资源、题目可执行文件，也不执行正文中的代码。

## 分类和标签

| 文章 | 分类 | 标签 |
| --- | --- | --- |
| 2025 腾讯游戏安全技术竞赛 PC 端初赛 | CTF题解 | CTF、逆向工程、游戏安全、Windows、驱动分析 |
| 强网杯 S9 PolyEncryption | CTF题解 | CTF、强网杯、逆向工程、.NET、Python、密码分析 |
| 强网杯 S9 Qcalc | CTF题解 | CTF、强网杯、Android、逆向工程、Deep Link、漏洞分析 |
| 某梆反 Root 和反 Frida 绕过 | Android安全 | Android、逆向工程、Frida、Root检测、反调试、加固 |
| Allsafe WP | Android安全 | Android、靶场、Allsafe、Frida、漏洞分析 |
| Arduino 安装 STM32 1.x | 嵌入式开发 | Arduino、STM32、嵌入式、环境搭建 |
| Binder 调用身份漏洞分析 | Android安全 | Android、Binder、IPC、权限校验、漏洞分析 |
| CISCN 2024 Reverse 复盘 | CTF题解 | CTF、CISCN、逆向工程、ARM、Android、Rust、Go |
| NepCTF 2025 Reverse/Misc | CTF题解 | CTF、NepCTF、逆向工程、Misc、反调试、RC4 |
| Tenda AC6 漏洞复现 | IoT安全 | IoT、Tenda、路由器、固件分析、漏洞复现、ARM |

精确路径、源文件 SHA256、图片迁移映射及剩余外链见 `local-post-import.json`。

## 重复运行与校验

`node tools/import-local-posts.cjs` 执行机械导入。目标内容不一致时拒绝覆盖，避免覆盖之后的手工编辑；不会自动同步或删除文章。

`npm.cmd run build` 生成站点，随后运行 `node tools/verify-local-posts.cjs` 检查源文件未被修改、标签完整、代码块一致、本地图片存在及文章进入搜索索引。
