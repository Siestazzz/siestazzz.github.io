# 三世界并行协作约定

2026-09-08，本会话内的互斥分工；不是后台服务或自动锁。

| 负责人 | 独占可写范围 | 不可操作 |
| --- | --- | --- |
| street_sekai | area8素材、area8-audit、export_area8*、AREA8.md、verify-area8、area8-motion.js | 平板/浏览器输入，共用文件 |
| wonderland_sekai | area9素材、area9-audit、export_area9*、AREA9.md、verify-area9、area9-motion.js | 平板/浏览器输入，共用文件 |
| empty_sekai | area10素材、area10-audit、export_area10*、AREA10.md、verify-area10、area10-motion.js | 平板/浏览器输入，共用文件 |
| 主agent | 共用渲染器、地图模板、CSS、总文档、构建与验收 | 不并发改子agent独占文件 |

所有ADB点击/拖动/截图/录屏以及可见浏览器交互只由主agent串行执行。子agent发送“世界、位置、需观察的动作”请求；主agent采集带世界名称的截图/录像再发路径。本世界原缓存只读pull允许，禁止改变设备画面；其他agent读取已完成文件不改变其内容。原包依赖缓存若缺失，先报告主agent避免两人同时写相同缓存文件。

子agent先交付原数据scene/effects/items.json和原证据，主agent维护共用接口及集成。新功能以消息请求接口变化，不直接改共用JS。仅主agent运行Hexo构建，防止public产物并发覆盖。最终由主agent统一做六世界导航、原有场景回归、宽窄拖动、加载和浏览器视觉检查，再更新总文档。

不提交、不推送、不部署。此约定靠任务权限分配执行，并不声称存在系统级设备互斥锁。
