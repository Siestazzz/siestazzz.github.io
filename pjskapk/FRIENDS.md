# 好友界面 → 友链页

## 核对记录

已在连接设备上查看好友列表、滚动、排序切换、添加好友、ID 搜索弹窗。列表参考 `friends-list-ready.png`、`friend-sort.png`、`friend-back.png`。本次观察的列表可见行均为离线；在线样式由 APK 的 **Online** 节点确认，不把离线截图换个文字充当在线。

可复用解析脚本：`inspect_friend_assets.py`。输出 `themes/sekai-next/source/game-assets/friends/provenance.json`，包含完整节点路径、RectTransform、原始组件数据和 Sprite 引用；另有 `extra-provenance.json` 记录通用素材。

| UI 部位 | 原始节点 / 素材 | 原始参数 |
|---|---|---|
| 在线条 | FriendListCell/Root/UIPartsFriendStatusImages/Online → bg_base_r12_wh | 240×48；CustomImage RGBA 在 raw offset 44–56，(0,0.80000007,0.73333335,1) → #00CCBB |
| 离线条（不使用） | 同路径 Offline | #8888AA |
| 列表条目 | FriendListCell/Root/Background → bg_base_r16_wh | 1536×144，白色 |
| 留言框 | FriendListCell/Root/Comment → bg_base_r16_wh | 432×112，#DFDFEA |
| 列表底板 | ScreenLayerFriend/.../FriendList/UIPartsGroupVerticalListView/Background → bg_base_r20_wh | #EBEBF2，alpha 0.298039 |
| 侧栏底图 | UIPartsLeftTabList/.../Base → tab_bg_dbl | 原图 |
| 选中及分隔素材 | tab_gn、tab_dot_select_wh、tab_line_dot_dbl | 通用原 Sprite；中文栏目名称由网页渲染 |
| 排序 | UIPartsSortFilterButton → btn_round_h56_wh | 原图 |
| 升降序 | UIPartsSortOrderButton → btn_circle_h56_wh + icon_triangle_wh | 原图 |
| 数量图标 | FriendCount/CountGroup/CustomImage → icon_friend_s | 原图 |
| 缺省头像 | icon_tofu_line_wh | 原游戏图标占位，并非对方真实头像 |

好友条目的 prefab 文件为 `f84c1c7438790a544bda1a125fc432d6`；好友页面为 `e826a636f6cfb4d87bec3fbd81243737`。

## 框体九宫格修正

原图不能整张拉伸或作为整张 mask 拉伸，否则圆角和两侧会变成椭圆。已读取 Sprite.m_Border，使用原 PNG 的 CSS border-image 九宫格切片：

| 原 Sprite | 尺寸 | m_Border（左、下、右、上） |
|---|---|---|
| bg_base_r12_wh | 34×34 | 16,16,16,16 |
| bg_base_r16_wh | 44×44 | 21,21,21,21 |
| bg_base_r20_wh | 50×50 | 24,24,24,24 |
| btn_round_h56_wh | 82×72 | 39,0,39,0 |
| btn_round_h80_gn | 106×96 | 51,0,51,0 |

留言、在线条和底板通过 SVG sRGB 颜色矩阵设置上述原始颜色及透明度，保留原素材轮廓。网页显示边宽按视口适配，非直接照搬游戏像素。已在本地浏览器截图检查列表及交换栏目，修正拉伸框体与空白菜单图标。

## 网站适配

### 最新交互调整

- 条目改为普通 div；名称、头像、网址均仅展示，只有「前往」为外链。移除标签徽章。
- 顶部三控件使用同一个缩放单位：原中心 x=-207.49652/89.50354/281.50354，宽220/296/72，对应边缘间隔39/8；不再使用统一 vw gap。
- 网页标签右侧留出底图端帽区域（32减去偏移8），避免选中图覆盖底板边缘。这是网页边界约束，不声称为运行时 RectMask2D 的完整重建。
- 已点击网址展示区确认不跳转，截图检查左侧选中边界；以下旧记录中的整行跳转和标签配置已被此调整替代。

### 2026-09-06 元数据纠正

可复查脚本 `inspect_friend_layout.py`，完整输出 `friend-layout-metadata.json`（包含 prefab、节点、RectTransform、组件原始字节、颜色、Sprite 引用）。撤销凭视觉添加的深色覆盖层、18px 标签间隔和 6px 实线白边。

- FriendCount 外层 220×62，白色 alpha 0.8；CountGroup 204×48，#444466、不透明。网页用两层原 Sprite，内缩横向 8、纵向 7 个原始单位，不再用 CSS border 猜厚度。
- BackPanel/Base 宽 360，右锚点偏移 +8，RGBA=(1,1,1,1)。tab_bg_dbl 本身包含透明度（中心像素 alpha 137/255），不能把组件 alpha=1 当作图片完全不透明。按左176、右32切片保留原图，不额外叠色。
- 文本标签 prefab `60480bb795857084d8f9489a797c7dac`：单元高132，内部 View 高128，Selected 高112，居中；选中实际引用 tab_dot_select_wh，染色 #77EEDD，不是 tab_gn 加一条点纹。
- Line 是右下锚定的 192×4，实际引用 line_dot_h4_wh，染色 #444466；此前使用 tab_line_dot_dbl 是错误绑定，现已改正。
- 网页保留响应式缩放单位（不属于游戏元数据），桌面节点内部尺寸按上述数据同比缩放；600px 以下横排栏目仍属网页适配。未声称完整复现运行时 SafeAreaAdjuster 或动画布局。
- 用户指定文案「前往」「个好友」，排序仅名称/加入，属于博客功能适配。
- 浏览器兼容：上述 tab_bg_dbl 与计数外框原切片左右之和等于图片宽，中心宽为零。直接用于 CSS border-image 会留下空心区域；网页采样边界各内移 1 个纹理像素，取交界的 2px 中心条填充，显示端帽宽仍用原 176/32 与 33。此项是浏览器采样兼容，不是 APK 参数，未修改 PNG；已截图确认无空心条。

- 不实现爱心、收藏、详情、申请后台。整行原生外链在新标签页打开，无中转。
- 在线标签仅为用户要求的游戏主题样式，不意味着网站或作者实时在线；页脚和 title 均说明。
- 中文内容用现有字体栈。标签徽章使用原按钮素材承载文字，不伪造游戏称号或站点成就。
- 保留既有七个参考站点，未确认互链关系；未编造头像、标签、介绍、加入日期。空介绍显示域名，空头像使用原图标。
- `theme.friends` 支持 name/url/avatar/description/tags/added；加入日期未配置时回退原配置顺序。
- `friend_exchange` 支持 name/url/avatar/description/contact；空基本信息继承 Hexo 配置，未配置 contact 不展示假提交按钮。复制失败时选中文本供手动复制。
- 布局尺寸按网页视口适配；小屏侧栏改横向、行内留言换行。列表上下渐隐由 CSS mask 实现，动画时长为网页反馈参数，未声称来自原动画曲线。
- 本地静态页面 `/friends/`，局部栏目切换不刷新文档。保留原有背景模糊与全局三维点击粒子。

验证：`npm.cmd run build`；`node tools/verify-friends.cjs`。
