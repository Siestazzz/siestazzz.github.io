'use strict';
const { createRequire } = require('node:module');
const { unescapeHTML } = createRequire(require.resolve('hexo'))('hexo-util');

hexo.extend.generator.register('sekai-search-index', function (locals) {
  const posts = locals.posts.sort('-date').map(function (post) {
    const text = unescapeHTML(String(post.content || '')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<td\b[^>]*class=["']gutter["'][^>]*>[\s\S]*?<\/td>/gi, ' ')
      .replace(/<img\b[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
    )
      .replace(/\s+/g, ' ')
      .trim();

    return {
      title: post.title,
      statsId: post.stats_id || post.slug,
      path: post.path,
      date: hexo.extend.helper.get('date').call({config:hexo.config,page:{}}, post.date.clone(), 'YYYY-MM-DD'),
      categories: post.categories.map(function (item) { return item.name; }),
      tags: post.tags.map(function (item) { return item.name; }),
      tagLinks: post.tags.map(function (item) { return {name:item.name,path:item.path}; }),
      excerpt: text ? Array.from(text).slice(0, 150).join('') + '…' : '',
      text: text
    };
  });

  return {
    path: 'search.json',
    data: JSON.stringify(posts)
  };
});
