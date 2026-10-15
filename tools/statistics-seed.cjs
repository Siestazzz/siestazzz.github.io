// Run after npm run build. Never reset existing counts when syncing new posts.
const fs = require('node:fs');
const posts = JSON.parse(fs.readFileSync('public/search.json','utf8'));
const ids = posts.map(p => p.statsId);
if(ids.length > 500 || new Set(ids).size !== ids.length || ids.some(id => !/^[a-z0-9][a-z0-9-]{0,119}$/.test(id))) throw Error('Invalid/duplicate stats_id, or more than 500 posts');
fs.writeFileSync('workers/statistics/articles.sql', '-- Generated from public/search.json; preserves counts.\n' + ids.map(id => `INSERT OR IGNORE INTO articles(id) VALUES('${id}');`).join('\n')+'\n');
console.log(`Prepared whitelist: ${ids.length} articles`);
fs.writeFileSync('workers/statistics/setup.sql', fs.readFileSync('workers/statistics/schema.sql','utf8')+'\n'+fs.readFileSync('workers/statistics/articles.sql','utf8'));
