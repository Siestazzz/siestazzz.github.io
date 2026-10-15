window.SekaiPages.register('friends', (scope) => {
  'use strict';
  const screen=document.querySelector('.friends-screen'); if(!screen) return;
  const tabs=[...screen.querySelectorAll('[data-friends-tab]')];
  const list=screen.querySelector('[data-friends-rows]'), items=[...list.querySelectorAll('.friends-row')];
  const sort=screen.querySelector('[data-friends-sort]'), order=screen.querySelector('[data-friends-order]');
  const labels=['名称顺序','加入顺序']; let mode=0, descending=false;
  function select(tab) {
    tabs.forEach(button=>{const active=button===tab;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
    const exchange=tab.dataset.friendsTab==='exchange';
    screen.querySelector('#friends-list-panel').hidden=exchange;
    screen.querySelector('#friends-exchange-panel').hidden=!exchange;
    screen.querySelector('[data-friends-toolbar]').hidden=exchange;
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>select(tab));
    tab.addEventListener('keydown',e=>{
      if(!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
      e.preventDefault(); const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(['ArrowUp','ArrowLeft'].includes(e.key)?-1:1)+tabs.length)%tabs.length;
      tabs[next].focus();select(tabs[next]);
    });
  });
  function reorder() {
    const sorted=[...items].sort((a,b)=>{
      let delta=Number(a.dataset.friendIndex)-Number(b.dataset.friendIndex);
      if(mode===0) delta=a.dataset.friendName.localeCompare(b.dataset.friendName,'zh-CN')||delta;
      if(mode===1) {
        const ad=Date.parse(a.dataset.friendAdded),bd=Date.parse(b.dataset.friendAdded);
        const ak=Number.isFinite(ad)?ad:Infinity,bk=Number.isFinite(bd)?bd:Infinity;
        delta=ak===bk?delta:ak<bk?-1:1;
      }
      return descending?-delta:delta;
    });
    sorted.forEach(item=>list.append(item));
    sort.textContent=labels[mode];sort.setAttribute('aria-label','切换排序，目前为'+labels[mode]);
    order.classList.toggle('is-desc',descending);order.setAttribute('aria-label',descending?'当前降序，点击切换升序':'当前升序，点击切换降序');
    screen.querySelector('.friends-scroll').scrollTop=0;
  }
  reorder();
  sort.addEventListener('click',()=>{mode=(mode+1)%labels.length;reorder();});
  order.addEventListener('click',()=>{descending=!descending;reorder();});
  screen.querySelector('[data-friends-copy]').addEventListener('click',async()=>{
    const field=screen.querySelector('#friends-own-card'), feedback=screen.querySelector('[data-friends-feedback]');
    try {await navigator.clipboard.writeText(field.value);feedback.textContent='';}
    catch {field.focus();field.select();feedback.textContent='未能自动复制，信息已选中，请手动复制。';}
  });
});
