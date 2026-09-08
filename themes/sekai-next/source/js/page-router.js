/* Persistent scene shell. Page modules explicitly own their listeners and observers. */
(()=>{
  const modules=new Map(),cleanups=[];let active=null,serial=0;
  function mount(name,init){
    const controller=new AbortController();
    const scope={signal:controller.signal,cleanup:fn=>cleanups.push(fn),
      listen:(target,type,fn,options={})=>target?.addEventListener(type,fn,{...options,signal:controller.signal})};
    cleanups.push(()=>controller.abort());init(scope);
  }
  function unmount(){for(const dispose of cleanups.splice(0).reverse())try{dispose();}catch(error){console.warn(error);}}
  window.SekaiPages={register(name,init){if(modules.has(name))return;modules.set(name,init);mount(name,init);}};
  const documents=new Map();
  let shown=location.pathname+location.search;
  const eligible=url=>url.origin===location.origin&&url.pathname.startsWith(document.body.dataset.root||'/')&&!/\/map\/?$/.test(url.pathname)&&!url.searchParams.has('world')&&!!document.querySelector('.unknown-scene');
  async function navigate(value,{pop=false}={}){
    const url=new URL(value,location.href);
    if(!eligible(url)){location.assign(url.href);return;}
    const ticket=++serial;active?.abort();active=new AbortController();
    document.documentElement.classList.add('route-loading');
    try{
      let html=documents.get(url.pathname);
      if(!html){const response=await fetch(url.pathname,{signal:active.signal});if(!response.ok)throw Error('Page '+response.status);html=await response.text();documents.set(url.pathname,html);if(documents.size>12)documents.delete(documents.keys().next().value);}
      const next=new DOMParser().parseFromString(html,'text/html');
      if(!next.querySelector('.site-main')||!next.querySelector('.unknown-scene'))throw Error('Not a shared scene page');
      const wanted=new Set([...next.querySelectorAll('link[rel=stylesheet]')].map(e=>new URL(e.getAttribute('href'),url).href));
      await Promise.all([...wanted].map(href=>new Promise((resolve,reject)=>{
        let link=[...document.querySelectorAll('link[rel=stylesheet]')].find(e=>e.href===href);
        if(link){if(!document.head.contains(link))document.head.append(link);resolve();return;}
        link=document.createElement('link');link.rel='stylesheet';link.href=href;link.onload=resolve;link.onerror=reject;document.head.append(link);
      })));
      if(ticket!==serial)return;
      unmount();
      if(!pop)history.pushState(null,'',url.href);
      shown=url.pathname+url.search;
      document.title=next.title;
      document.querySelector('meta[name=description]')?.setAttribute('content',next.querySelector('meta[name=description]')?.content||'');
      document.body.className=next.body.className;
      for(const selector of ['.topbar','.menu-panel','.menu-scrim','.site-main']){
        const node=next.querySelector(selector);node.querySelectorAll?.('script[src],link[rel=stylesheet]').forEach(e=>e.remove());
        document.querySelector(selector).replaceWith(node);
      }
      document.querySelectorAll('link[rel=stylesheet]').forEach(link=>{link.disabled=!wanted.has(link.href);});
      for(const [name,init] of modules)mount(name,init);
      window.scrollTo(0,0);
      const main=document.querySelector('.site-main');main.tabIndex=-1;main.focus({preventScroll:true});
      if(url.hash)document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView();
      if(!matchMedia('(prefers-reduced-motion: reduce)').matches)main.animate([{opacity:.75},{opacity:1}],{duration:120});
      dispatchEvent(new Event('sekai-page-ready'));
    }catch(error){if(error.name!=='AbortError'&&ticket===serial){console.warn('Page navigation fallback',error);location.assign(url.href);}}
    finally{if(ticket===serial)document.documentElement.classList.remove('route-loading');}
  }
  window.sekaiNavigate=navigate;
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');
    if(!link||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||link.target||link.hasAttribute('download'))return;
    const url=new URL(link.href);if(!eligible(url))return;
    if(url.pathname===location.pathname&&url.search===location.search&&url.hash)return;
    event.preventDefault();navigate(url.href);
  });
  addEventListener('popstate',()=>{const next=location.pathname+location.search;if(next!==shown)navigate(location.href,{pop:true});});
})();
