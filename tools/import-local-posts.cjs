/* Manual mechanical Markdown migration (outside Hexo's auto-loaded scripts/).
 * Original files are read-only; no code in them executes. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),input=path.dirname(root);
const specs=[
 ['2025腾讯游戏安全技术竞赛PC端初赛','tencent-game-security-2025-pc','CTF题解',['CTF','逆向工程','游戏安全','Windows','驱动分析'],'腾讯游戏安全竞赛 PC 初赛题解，记录可执行文件与驱动的静态分析。'],
 ['强网杯s9初赛 PolyEncryption wp','qwb-s9-polyencryption','CTF题解',['CTF','强网杯','逆向工程','.NET','Python','密码分析'],'PolyEncryption 题解：从异步状态机反编译到内嵌 Python 程序与加密逻辑分析。'],
 ['强网杯s9初赛 Qcalc wp','qwb-s9-qcalc','CTF题解',['CTF','强网杯','Android','逆向工程','Deep Link','漏洞分析'],'Qcalc 题解，分析 Deep Link 输入处理、表达式计算及相关漏洞。'],
 ['一次某梆加固的反root和反frida绕过with GPT5.6sol','android-root-frida-bypass','Android安全',['Android','逆向工程','Frida','Root检测','反调试','加固'],'记录一次 Android 加固应用的 Root 检测与 Frida 检测分析、定位和绕过过程。'],
 ['allsafe-wp','allsafe-android-writeup','Android安全',['Android','靶场','Allsafe','Frida','漏洞分析'],'Allsafe 安卓靶场题解，涵盖日志、组件、WebView、存储、证书校验等安全问题。'],
 ['Arduino下载1.x版本stm32方法','arduino-stm32-1x','嵌入式开发',['Arduino','STM32','嵌入式','环境搭建'],'在 Arduino 中安装旧版 STM32 开发板支持包的操作记录。'],
 ['Binder.getCallingPid()和Binder.getCallingUid()漏洞分析','android-binder-calling-identity','Android安全',['Android','Binder','IPC','权限校验','漏洞分析'],'结合 Ghera 示例分析 Binder 调用身份与组件权限校验问题。'],
 ['ciscn2024 Reverse全题解 复盘','ciscn-2024-reverse','CTF题解',['CTF','CISCN','逆向工程','ARM','Android','Rust','Go'],'CISCN 2024 Reverse 题目复盘，涵盖 ARM、Android native、Rust、GDB 与 Go 逆向。'],
 ['Nepctf2025 部分reverse misc题解','nepctf-2025-reverse-misc','CTF题解',['CTF','NepCTF','逆向工程','Misc','反调试','RC4'],'NepCTF 2025 部分 Reverse 与 Misc 题解，记录反调试、SMC 和解题过程。'],
 ['Tenda-AC6路由器漏洞复现','tenda-ac6-vulnerability','IoT安全',['IoT','Tenda','路由器','固件分析','漏洞复现','ARM'],'Tenda AC6 路由器固件分析、模拟环境搭建与漏洞复现记录。']
];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const downloadMapFile=path.join(root,'docs/downloaded-post-images.json');
const downloads=fs.existsSync(downloadMapFile)?JSON.parse(fs.readFileSync(downloadMapFile,'utf8')):{};
const repairImages=process.argv.includes('--repair-images');
const writeSafe=(file,data)=>{
 const bytes=Buffer.isBuffer(data)?data:Buffer.from(data);
 if(fs.existsSync(file)){
  const previous=fs.readFileSync(file);
  if(previous.equals(bytes))return;
  // Explicit image-only migration: do not overwrite prose, metadata, or code edits.
  const normalize=s=>s.replace(/(<img\b[^>]*\bsrc=)["'][^"']*["']/gi,'$1""').replace(/!\[([^\]]*)\]\([^\r\n]*?\)/g,'![$1]()');
  if(repairImages && ((file.endsWith('.md') && normalize(previous.toString())===normalize(bytes.toString())) || file===path.join(root,'docs/local-post-import.json'))){fs.writeFileSync(file,bytes);return;}
  throw Error('Refusing to overwrite changed file: '+file);
 }
 fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);
};
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const report=[];
for(const [folder,slug,category,tags,excerpt] of specs){
 const dir=path.join(input,folder),file=path.join(dir,folder+'.md');
 const original=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'');
 const assets=walk(dir).filter(f=>/\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(f));
 const copied=new Map(),external=[],missing=[],downloaded=[];
 const link=(raw,alt='')=>{
  let decoded;try{decoded=decodeURIComponent(raw.replace(/^<|>$/g,''));}catch{decoded=raw;}
  const remote=/^https?:\/\//i.test(decoded);
  if(remote && downloads[decoded]){
   const item=downloads[decoded],file=path.join(root,'source',item.local.slice(1));
   if(!fs.existsSync(file)||hash(fs.readFileSync(file))!==item.sha256)throw Error('Missing/changed downloaded image: '+decoded);
   downloaded.push({url:decoded,...item});return item.local;
  }
  if(/^(data:|#)/i.test(decoded))return raw;
  let local=remote?null:path.resolve(dir,decoded.replace(/\\/g,'/'));
  if(remote || !fs.existsSync(local)){
   const name=remote?alt+'.png':path.basename(decoded.replace(/\\/g,'/'));
   const matches=assets.filter(f=>path.basename(f)===name);
   if(matches.length===1)local=matches[0];
  }
  if(!local || !fs.existsSync(local)){(remote?external:missing).push(raw);return raw;}
  if(!local.startsWith(dir+path.sep))throw Error('Reference escapes article directory: '+local);
  const data=fs.readFileSync(local),filename=hash(data).slice(0,16)+path.extname(local).toLowerCase();
  const dest=path.join(root,'source/media/posts',slug,filename);
  writeSafe(dest,data);copied.set(local,{source:path.relative(input,local),target:path.relative(root,dest),sha256:hash(data)});
  return '/media/posts/'+slug+'/'+filename;
 };
 let fence=null;
 const body=original.split(/\r?\n/).map(line=>{
  const marker=line.match(/^\s*(`{3,}|~{3,})/);
  if(marker){if(!fence)fence=marker[1];else if(marker[1][0]===fence[0]&&marker[1].length>=fence.length)fence=null;return line;}
  if(fence)return line;
  return line.replace(/!\[([^\]]*)\]\(([^\r\n]*?)\)/g,(_,alt,url)=>`![${alt}](${link(url,alt)})`)
   .replace(/<img\b[^>]*>/gi,tag=>{
    const alt=(tag.match(/\balt=["']([^"']*)["']/i)||[])[1]||'';
    return tag.replace(/(\bsrc=["'])([^"']+)(["'])/i,(_,start,url,end)=>start+link(url,alt)+end);
   });
 }).join('\n');
 if(missing.length)throw Error('Missing local images in '+folder+': '+missing.join(', '));
 const stat=fs.statSync(file),date=stat.mtime;
 const pad=n=>String(n).padStart(2,'0');
 const dateText=`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
 const title=(body.match(/^# ([^\r\n]+)/)||[])[1]||folder;
 const header=['---','title: '+JSON.stringify(title),'date: '+dateText,'updated: '+dateText,'categories:','  - '+JSON.stringify(category),'tags:',...tags.map(t=>'  - '+JSON.stringify(t)),'excerpt: '+JSON.stringify(excerpt),'source_date_basis: file-mtime','---',''];
 const target=path.join(root,'source/_posts',slug+'.md');
 writeSafe(target,header.join('\n')+body.replace(/^# [^\n]+\n+/,'')+'\n');
 report.push({title,source:path.relative(input,file),target:path.relative(root,target),source_sha256:hash(fs.readFileSync(file)),date:dateText,date_basis:'File modification time; original publication date unavailable',category,tags,assets:[...copied.values()],downloaded_images:downloaded,external_images:[...new Set(external)],excluded_versions:fs.readdirSync(dir).filter(n=>n.includes('副本')||n.endsWith('.pdf'))});
}
writeSafe(path.join(root,'docs/local-post-import.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({posts:report.length,assets:report.reduce((n,p)=>n+p.assets.length,0),external_images:report.reduce((n,p)=>n+p.external_images.length,0),report:'docs/local-post-import.json'},null,2));
