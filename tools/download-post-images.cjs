/* Download only image URLs explicitly listed in the import manifest. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),mapFile=path.join(root,'docs/downloaded-post-images.json');
const posts=JSON.parse(fs.readFileSync(path.join(root,'docs/local-post-import.json'),'utf8'));
const saved=fs.existsSync(mapFile)?JSON.parse(fs.readFileSync(mapFile,'utf8')):{};
const jobs=posts.flatMap(p=>p.external_images.map(url=>({url,slug:path.basename(p.target,'.md')})));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function download({url,slug}){
 if(saved[url]){const file=path.join(root,'source',saved[url].local.slice(1));if(fs.existsSync(file)&&hash(fs.readFileSync(file))===saved[url].sha256)return;}
 if(!/^https:\/\/img202[34]\.cnblogs\.com\//.test(url))throw Error('Unexpected image host: '+url);
 let error;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const res=await fetch(url,{signal:AbortSignal.timeout(25000)});
   if(!res.ok)throw Error('HTTP '+res.status);
   const data=Buffer.from(await res.arrayBuffer());
   if(data.length>30*1024*1024)throw Error('Image too large');
   if(!data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Expected PNG, got '+res.headers.get('content-type'));
   const digest=hash(data),local='/media/posts/'+slug+'/'+digest.slice(0,16)+'.png';
   const file=path.join(root,'source',local.slice(1));fs.mkdirSync(path.dirname(file),{recursive:true});
   if(fs.existsSync(file)&&hash(fs.readFileSync(file))!==digest)throw Error('Filename collision');
   fs.writeFileSync(file,data);saved[url]={local,sha256:digest,bytes:data.length};
   console.log('Downloaded',Object.keys(saved).length,local);return;
  }catch(e){error=e;}
 }
 throw new Error(url+': '+error.message);
}
(async()=>{
 let i=0;const failures=[];
 await Promise.all(Array.from({length:4},async()=>{while(i<jobs.length){const job=jobs[i++];try{await download(job);}catch(e){failures.push(e.message);}}}));
 fs.writeFileSync(mapFile,JSON.stringify(saved,null,2)+'\n');
 if(failures.length)throw Error(failures.join('\n'));
 console.log('Complete:',jobs.length,'requested images.');
})().catch(e=>{console.error(e);process.exitCode=1;});
