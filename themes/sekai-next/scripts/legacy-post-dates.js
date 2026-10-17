'use strict';
// Keep links published before the original publication dates were restored.
hexo.extend.generator.register('legacy-post-dates', function (locals) {
  const slugs = ['ciscn-2024-reverse','tencent-game-security-2025-pc','tenda-ac6-vulnerability','allsafe-android-writeup','nepctf-2025-reverse-misc','arduino-stm32-1x'];
  const redirects = slugs.map(slug => {
    const post = locals.posts.findOne({slug});
    if (!post) return null;
    const url = (hexo.config.root || '/') + post.path;
    return {path:'2025/09/14/'+slug+'/index.html',data:'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>文章地址已更新</title><meta http-equiv="refresh" content="0;url='+url+'"><link rel="canonical" href="'+url+'"><a href="'+url+'">阅读文章</a></html>'};
  }).filter(Boolean);
  const ciscn = redirects.find(r=>r.path.includes('ciscn-2024-reverse'));
  if(ciscn) redirects.push({...ciscn,path:'2024/05/22/ciscn-2024-reverse/index.html'});
  return redirects;
});
