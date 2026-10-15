// Reproducible local vendor copy. Installs are isolated from Hexo's pnpm tree.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'themes/sekai-next/source/vendor/live2d');
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const files=[['pixi.js/dist/pixi.min.js','pixi-7.4.3.min.js'],['pixi.js/LICENSE','PIXI-LICENSE.txt'],['@sekai-world/pixi-live2d-display-mulmotion/dist/cubism4.min.js','mulmotion-0.5.1.min.js'],['@sekai-world/pixi-live2d-display-mulmotion/LICENSE','MULMOTION-LICENSE.txt']];
 const records=[];
 for(const [src,dest] of files){const data=await fs.readFile(path.join(__dirname,'live2d-deps/node_modules',src));await fs.writeFile(path.join(out,dest),data);records.push({file:dest,source:src,sha256:crypto.createHash('sha256').update(data).digest('hex')});}
 const url='https://cubism.live2d.com/sdk-web/core/05/live2dcubismcore.min.js';
 const response=await fetch(url);if(!response.ok)throw Error('Core '+response.status);
 const core=Buffer.from(await response.arrayBuffer());
 if(!core.toString().includes('Live2DCubismCore'))throw Error('Invalid Core');
 await fs.writeFile(path.join(out,'cubismcore-05.min.js'),core);
 records.push({file:'cubismcore-05.min.js',source:url,sha256:crypto.createHash('sha256').update(core).digest('hex'),license:'Live2D Proprietary Software License Agreement; not MIT'});
 await fs.writeFile(path.join(out,'provenance.json'),JSON.stringify(records,null,2));
 console.log('Prepared Live2D vendors',records.map(r=>r.file));
})().catch(e=>{console.error(e);process.exitCode=1});
