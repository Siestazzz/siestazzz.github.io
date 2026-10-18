const root=document.body.dataset.root||'/';
export function dialog(title,paragraphs,action,label='关闭'){
  const d=document.createElement('dialog');d.className='ctf-dialog';
  const close=document.createElement('button');close.className='ctf-notice-close';close.type='button';close.setAttribute('aria-label','关闭');
  const cross=document.createElement('img');cross.src=root+'game-assets/ctf/btn_close_dbl.png';cross.alt='';close.append(cross);close.addEventListener('click',()=>d.close());d.append(close);
  const header=document.createElement('header');header.className='ctf-notice-header';
  const back=document.createElement('button');back.className='ctf-notice-back game-back';back.type='button';back.setAttribute('aria-label','返回');
  const arrow=document.createElement('img');arrow.src=root+'game-assets/icon_back_wh.png';arrow.alt='';back.append(arrow);back.addEventListener('click',()=>d.close());header.append(back);
  const h=document.createElement('h1');h.textContent=title;header.append(h);
  const tag=document.createElement('span');tag.className='ctf-notice-tag';tag.textContent='お知らせ';header.append(tag);d.append(header);d.setAttribute('aria-label',title);
  const content=document.createElement('div');content.className='ctf-notice-content article-content';
  for(const text of paragraphs){const p=document.createElement('p');p.textContent=text;content.append(p);}d.append(content);
  const b=document.createElement('button');b.className='ctf-action';b.type='button';b.textContent=label;if(action)content.append(b);
  b.addEventListener('click',async()=>{if(!action){d.close();return;}b.disabled=true;try{await action();d.close();}catch{b.disabled=false;b.textContent='音频加载失败，点击重试';}});
  d.addEventListener('close',()=>d.remove(),{once:true});document.body.append(d);d.showModal();return d;
 }
