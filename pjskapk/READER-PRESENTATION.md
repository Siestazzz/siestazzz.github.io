# 正文排版适配 · 2026-09-08

效果 ID：POST-QUOTE、POST-CODE、POST-NAV。均为博客网页适配，无原游戏代码编辑器或引用块的数据依据；不改变既有场景模糊。

POST-CATEGORY-ACCENT：开头8px装饰线和标题下1px分隔线共用所属大类颜色。取当前分类选中图标`icon_tab_unit_{vs,ln,mj,vb,ws,25}_on.png`的alpha>240且RGB色差>25像素众数，分别#33ccbb/#4455dd/#88dd44/#ee1166/#ff9900/#884499；按现有main.js类别/图标顺序映射CTF/Android/漏洞挖掘/逆向工程/AI/其他。post.ejs按此优先级选已有categories（不从tags抢分类），设置--accent，缺省其他。图标颜色为原素材采样，映射及正文分割线用途为网页适配。非选中off图标为中性色，故不用它取色。

- `themes/sekai-next/source/css/refinements.css`：blockquote使用不透明#edf4f8底色、#36384e文字、4px #45bdb5左边，避免与模糊场景混在一起。正文导航small12px、标题18px。
- Hexo highlight.js继续负责生成代码和语言class；`reader.js`读取class生成语言标签，未声明语言标为纯文本，不猜语言。
- 行号单元格width1px由内容自然撑开，代码列占剩余宽度。行号pre左右11px留白（初版8px经用户反馈略加宽），单/双/三位数随最长行号增宽。
- 长代码默认最多16行加32px上下padding，受55svh视口高度上限约束；短代码不显示展开按钮。按钮切换is-expanded和aria-expanded，完全展开解除纵向高度限制，收起恢复并清零内部scrollTop；横向只在溢出时滚动。ResizeObserver更新按钮是否需要显示。无JS时原Hexo代码全文可用。
- 修正2篇源文共3处裸URL紧接中文标点导致自动链接吞句：android-root-frida-bypass中的Frida issue和看雪链接、qwb-s9-polyencryption中的JDWP手册，改显式Markdown链接，不改后续叙述。

验证：构建；`tools/verify-reader-code.cjs`真实Chrome检查语言、长代码展开/收起、短代码无按钮、行号按位数增宽、Frida链接边界。另扫描全部13篇生成正文链接，无包含中文句读的异常href。截图`pjskapk/reader-code-review.png`。本次未操作游戏，以上数值均为阅读体验适配。

行号留白增至11px后复测：一位数约31.86px、两位数约41.20px。分类颜色构建及Chrome截图`pjskapk/reader-category-review.png`已检查，Android分割线计算色rgb(68,85,221)，与ln选中图标主色一致。
