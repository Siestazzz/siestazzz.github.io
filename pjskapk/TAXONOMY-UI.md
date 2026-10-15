# 标签、分类与个人头像

2026-10-13资料/搜索调整：about.ejs移除STATUS，计数class=online沿用原#139d91；主题role=Reverse/Mobile/Agent，source/about/index.md简介“这个人很懒”。refinements.css标签PLAYER PROFILE 15–19px、简介19–24px、统计两列。搜索沿用原放大镜素材，25px居中，外壳14px圆角/2px白边、浅底#f7f7fb，按钮10px圆角、hover #33ccbb；输入占位“搜索标题、标签或正文”。外框不随hover变色，筛选代码不变。均网页排版，不新增原游戏参数结论。

封面优化仅source/images/post-covers的10张壁纸。tools/compress-post-covers.py保持宽高，二分WebP质量1–100取不超过原字节50%的最高质量（method6）。compression.json记录前后大小、质量及尺寸；sources.json保留原D:/Pictures路径并更新站内cover。旧原图未删，正文图片未触及。按此前要求不截图，使用构建和无截图DOM检查。

最终压缩总计14,007,950→5,965,142字节，剩42.58%，10张每张均不超过原一半。构建和tools/verify-profile-search.cjs通过（文字、2项绿色计数、简介字号、10条WebP索引、搜索筛选/仅按钮变色），未截图；服务已重启读取新主题配置。

最新搜索反馈修正：取消.song-search外层hover/focus-within的#dbf7f3背景及过渡，只保留搜索按钮#33ccbb的150ms变色。标签不变。verify-entry-search-feedback.cjs通过，检查输入hover/focus及按钮hover时外层背景恒定、按钮颜色变化。

2026-09-20 补充：选文手机`.preview-tags`现在使用a，`scripts/search-index.js`输出tagLinks的真实Hexo path，`main.js`生成站点root前缀链接。底色hover/focus为#77eedd、字#45445f，2px边框/4px圆角；搜索表单hover/focus-within为#dbf7f3，搜索按钮hover/focus为#33ccbb，均150ms，减少动画禁用。网页适配非游戏参数。verify-live2d-voice.cjs中标签单击归档及搜索hover通过，已查看截图。

更新：2026-09-20。效果ID：TAXONOMY-HOVER、PROFILE-AVATAR。

## 实现与来源

- `themes/sekai-next/source/css/refinements.css`：`.tag-cloud a`、`.tag-stack a`、`.reader-category-link`在hover/focus-visible时背景#33ccbb、文字#20223b；`.collection-card`背景为原--accent占25%、#f8f8fc占75%，队标与布局不变。
- 背景/文字/边框过渡150ms ease，离开hover/focus复原；键盘outline为2px青色、偏移3px；减少动画模式无过渡。没有增加定时器或导航等待。
- `layout/tags.ejs`、`categories.ejs`、正文标签原有链接保留。`layout/post.ejs`侧栏及标题分类由文本改为链接，逐个读取Hexo category.path，单击进入归档。沿用现有软路由和原生链接语义，无二次确认。
- 上述反馈属于网页业务适配，无原游戏hover字段证据，不冒充原参数。分类图标仍为此前提取的icon_tab_unit_*_on.png，未改资源。
- 头像来自用户指定的 https://avatars.githubusercontent.com/u/268538088?s=400&u=e663fccfdb5aeb05174258a069a2f73a26b685f6&v=4 ，下载到`themes/sekai-next/source/images/profile-avatar.png`，400×400。主题`_config.yml`新增profile.avatar；`layout/about.ejs`通过url_for显示本地图，并移除旧遮挡装饰；未配置时保留S占位。非游戏资源，不添加外跳。

## 实际验证

- npm.cmd run build成功。
- node tools/verify-taxonomy.cjs通过：标签索引、分类索引、正文标签、侧栏分类、标题分类的悬停颜色变化及单击URL均正确，无pageerror。
- 头像decode成功、naturalWidth=400；桌面1280×800和手机390×844已截图；分类悬停和手机头像截图已人工查看。
- 本轮未做游戏设备比对；此次业务反馈不调整游戏场景/动画。
