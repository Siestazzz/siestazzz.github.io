# ENTRY-READING / WORLD-VISIT · 2026-09-20

本分支codex/game-menu以原第二页为首页；随机访问规则属于博客适配，无游戏方法/字段证据。原场景来源仍见总索引E07/E11–E18；移除入口不构成素材公开授权。

## 挂载与路由

index.ejs在is_home时直接渲染live.ejs；layout.ejs设page-type-live，没有旧大厅首帧/重定向。/live/、旧/map/兼容显示同一阅读入口，source/map/index.md改layout:live。正文→/search/→/，入口无返回/地球，菜单去掉重复阅读入口；右上栏margin-left:auto保留位置，菜单横线display:block。

六世界的背景/道具/人物动作/气泡/持续粒子及原第二页模糊完整保留。地图选择、世界转场不挂载，原文件留作历史参考；旧大厅轮播/GACHA不运行。旧world查询不选世界，page-router允许软导航，历史匹配仍验证保存的sekaiWorld状态。

## 生命周期

visit-world.js在head同步执行，场景加载前设html[data-home-world]。池5/7/8/9/10/27；localStorage的sekai-world-visit存{world,lastSeen}，兼容同步sekai-home-world。首次随机；离开≥1800000ms（30分钟）后再进从其余5个世界随机，保证不立即重复。可见时每15000ms更新时间，隐藏时记录离开。短刷新、短关重开、站内跳转不换；恢复可见/BFCache若过期则重载换场景，不在持续阅读时主动切换。多标签共享最近活动，恢复时检查世界差异；同时首次加载的竞争未作原子保证。系统时钟变化会影响判断，关闭时间有最多约15秒采样误差。

localStorage不可用时不抛错，但无法保证跨刷新固定。无后端/网络追踪。30分钟与15秒均是网页参数，不是游戏常量。

## 验证

Hexo构建通过；verify-random-entry.cjs：Chrome1280×720直接阅读，无旧大厅/地球/地图；刷新世界保持；选文返回根目录保留scene对象；旧/map/也是阅读页；模拟时间前进31分钟更换不同世界（5→8），无pageerror。random-entry-review.png截图已查看。未真实等待30分钟，未测多标签同时首次加载/系统时间回拨，未重新操作游戏。

旧verify-world-transition/world-parent/home-veil/fixed-parent-history中依赖旧大厅/地图的断言为旧分支测试，不代表当前分支验收；新脚本覆盖当前入口规则。
