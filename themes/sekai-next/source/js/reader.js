/* The document scrolls naturally below an auto-hiding navigation bar. Native anchors still
 * work without JS; enhance them with focus and an active chapter indicator. */
window.SekaiPages.register('reader', (scope) => {
  const card=document.querySelector('.reader-card'),nav=document.querySelector('.chapter-index nav');
  if(!card)return;
  card.querySelectorAll('figure.highlight, .article-content > pre').forEach(block=>{
    block.tabIndex=0;block.setAttribute('role','region');block.setAttribute('aria-label','代码，可横向和纵向滚动');
    if(block.matches('figure.highlight')&&!block.querySelector('.code-language')){
      const language=[...block.classList].find(name=>name!=='highlight')||'plaintext';
      const labels={javascript:'JavaScript',js:'JavaScript',typescript:'TypeScript',python:'Python',powershell:'PowerShell',bash:'Bash',shell:'Shell',cpp:'C++',c:'C',java:'Java',json:'JSON',xml:'XML',html:'HTML',css:'CSS',plaintext:'纯文本'};
      const caption=document.createElement('figcaption');caption.className='code-language';
      caption.textContent=labels[language]||language;
      block.prepend(caption);
      const table=block.querySelector('table');
      if(table){
        const scroll=document.createElement('div');scroll.className='code-scroll';
        table.before(scroll);scroll.append(table);
        const pre=table.querySelector('pre');
        const lineHeight=parseFloat(getComputedStyle(pre).lineHeight)||22;
        scroll.style.setProperty('--code-line-height',lineHeight+'px');
        const toggle=document.createElement('button');toggle.type='button';toggle.className='code-expand';
        toggle.textContent='展开全部';toggle.setAttribute('aria-expanded','false');caption.append(toggle);
        const check=()=>{toggle.hidden=!block.classList.contains('is-expanded')&&scroll.scrollHeight<=scroll.clientHeight+1;};
        toggle.addEventListener('click',()=>{
          const expanded=block.classList.toggle('is-expanded');
          toggle.textContent=expanded?'收起':'展开全部';toggle.setAttribute('aria-expanded',String(expanded));
          if(!expanded){scroll.scrollTop=0;block.scrollIntoView({block:'nearest'});}
          check();
        });
        const observer=new ResizeObserver(check);observer.observe(scroll);scope.cleanup(()=>observer.disconnect());check();
      }
    }
  });
  if(!nav)return;
  const entries=[...nav.querySelectorAll('a[href^="#"]')].map(link=>{
    let id;try{id=decodeURIComponent(link.getAttribute('href').slice(1));}catch{return null;}
    const target=document.getElementById(id);return target?{link,target}:null;
  }).filter(Boolean);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mark=entry=>entries.forEach(item=>{
    const active=item===entry;item.link.classList.toggle('is-current',active);
    if(active)item.link.setAttribute('aria-current','location');else item.link.removeAttribute('aria-current');
  });
  nav.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    const entry=entries.find(item=>item.link===event.target.closest('a'));
    if(!entry)return;
    event.preventDefault();
    entry.target.tabIndex=-1;entry.target.focus({preventScroll:true});
    entry.target.scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'});
    history.pushState(null,'',entry.link.getAttribute('href'));mark(entry);
  });
  const header=document.querySelector('.topbar');
  let previous=Math.max(0,window.scrollY),direction=0,distance=0;
  const showHeader=()=>document.body.classList.remove('reader-nav-hidden');
  header?.addEventListener('focusin',showHeader);
  scope.listen(window,'pageshow',showHeader);
  let frame;
  const update=()=>{
    frame=null;
    const y=Math.max(0,Math.min(window.scrollY,document.documentElement.scrollHeight-window.innerHeight));
    const delta=y-previous, nextDirection=Math.sign(delta);
    if(nextDirection && nextDirection!==direction){direction=nextDirection;distance=0;}
    distance+=Math.abs(delta);previous=y;
    if(y<=100 || document.body.classList.contains('menu-open') || header?.contains(document.activeElement))showHeader();
    else if(distance>=12){document.body.classList.toggle('reader-nav-hidden',direction>0);distance=0;}
    const top=110;
    let current=entries[0];for(const entry of entries){if(entry.target.getBoundingClientRect().top<=top)current=entry;}
    if(current)mark(current);
  };
  scope.listen(window,'scroll',()=>{if(!frame)frame=requestAnimationFrame(update);},{passive:true});
  scope.listen(window,'resize',()=>{if(!frame)frame=requestAnimationFrame(update);});
  scope.cleanup(()=>cancelAnimationFrame(frame));
  update();
});
