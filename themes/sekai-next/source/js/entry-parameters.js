(()=>{
 'use strict';
 const root=document.body.dataset.root||'/';
 window.SekaiPages.register('entry-parameters',scope=>{
  if(!document.querySelector('.title-entry'))return;
  const params=new URLSearchParams(location.search);
  if(!params.has('iv')&&!params.has('key'))return;
  let activeDialog;scope.cleanup(()=>activeDialog?.close());
  (async()=>{
   const {dialog}=await import(root+'js/notice-dialog.js');
   if(scope.signal.aborted)return;
   try{
    if(params.getAll('key').length!==1||params.getAll('iv').length!==1)throw Error('Provide both key and iv exactly once.');
    const key=params.get('key'),iv=params.get('iv');
    if(!/^[\x20-\x7e]{16}$/.test(key)||!/^[\x20-\x7e]{16}$/.test(iv))throw Error('key and iv must each contain 16 ASCII characters.');
    const get=async file=>{const r=await fetch(root+'game-assets/ctf/'+file,{signal:scope.signal});if(!r.ok)throw Error('Resource unavailable.');return r;};
    const meta=await (await get('stage.json')).json(),enc=new TextEncoder(),a=enc.encode(key),b=enc.encode(iv);
    if(!a.every((v,i)=>(v^b[i])===meta.check[i]))throw Error('Verification failed.');
    const seed=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(key+'\0'+iv)));
    const bytes=new Uint8Array(await (await get('stage.bin')).arrayBuffer());
    for(let i=0;i<bytes.length;i++)bytes[i]^=seed[i%seed.length];
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
    if(digest!==meta.digest)throw Error('Verification failed.');
    if(scope.signal.aborted)return;
    await window.sekaiAudio.useChallengeAudio(bytes.buffer);
    if(scope.signal.aborted)return;
    activeDialog=dialog('Ready?',['Listen to the BGM, then go to the friends page and check what’s there.'],()=>window.sekaiAudio.useChallengeAudio(bytes.buffer),'Listen');
   }catch(e){if(!scope.signal.aborted)activeDialog=dialog('Entry',[e.message]);}
  })();
 });
})();
