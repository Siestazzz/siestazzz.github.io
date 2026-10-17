(() => {
  'use strict';
  if (window.SekaiStats) return;
  const config = document.getElementById('sekai-statistics').dataset;
  // Preview builds must never pollute production counts.
  const enabled = location.origin === config.origin && !!config.endpoint;
  let snapshot = null, fetchedAt = 0, pending = null, visitor = null;
  const sent = new Map(), inflight = new Map();
  const number = value => Number.isSafeInteger(value) && value >= 0 ? String(value) : '—';
  function paint() {
    document.querySelectorAll('[data-total-views]').forEach(el => el.textContent = number(snapshot?.reads));
    document.querySelectorAll('[data-total-visits]').forEach(el => el.textContent = number(snapshot?.visits));
    document.querySelectorAll('[data-post-views]').forEach(el => el.textContent = number(snapshot?.articles?.[el.dataset.postViews]));
  }
  async function request(path, options={}) {
    const response = await fetch(config.endpoint.replace(/\/$/,'') + path, {...options, cache:'no-store', credentials:'omit', signal:AbortSignal.timeout(8000)});
    if (!response.ok) throw Error('Statistics unavailable');
    return response.json();
  }
  async function refresh(force=false) {
    if (!enabled) return;
    if (pending) { await pending; if (force) return refresh(true); return; }
    if (!force && Date.now()-fetchedAt < 30000) { paint(); return; }
    pending = request('/stats').then(data => {
      if (!data || number(data.reads)==='—' || number(data.visits)==='—' || !data.articles || typeof data.articles !== 'object') throw Error('Invalid statistics');
      snapshot=data; fetchedAt=Date.now(); paint();
    }).catch(() => { /* Keep confirmed numbers or the initial dash; never invent zero. */ });
    await pending; pending=null;
  }
  function identity() {
    if (visitor) return visitor;
    try { visitor=localStorage.getItem('sekai-stats-visitor'); } catch {}
    if (!/^[0-9a-f-]{36}$/i.test(visitor || '')) visitor=crypto.randomUUID();
    try { localStorage.setItem('sekai-stats-visitor',visitor); } catch {}
    return visitor;
  }
  async function event(kind,id) {
    if (!enabled) return;
    const key=kind+':'+(id || 'site'), storageKey='sekai-stats-event:'+key;
    let last=sent.get(key) || 0;
    try { last=Math.max(last,Number(localStorage.getItem(storageKey)) || 0); } catch {}
    const windowMs = kind === 'visit' ? 365 * 86400000 : 1800000;
    if (Date.now()-last < windowMs || inflight.has(key)) return;
    const job=request('/events', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,id,visitor:identity()})})
      .then(async () => {
        const now=Date.now(); sent.set(key,now);
        try { localStorage.setItem(storageKey,String(now)); } catch {}
        await refresh(true);
      }).catch(() => {}).finally(() => inflight.delete(key));
    inflight.set(key,job); await job;
  }
  window.SekaiStats = {views:id => number(snapshot?.articles?.[id]), paint};
  window.SekaiPages.register('statistics', scope => {
    paint(); refresh();
    const id=document.querySelector('[data-stats-article]')?.dataset.statsArticle;
    let remaining=30000, started=0, timer=null, finished=false;
    function visible() {
      if (timer !== null) { clearTimeout(timer); timer=null; remaining-=performance.now()-started; }
      if (document.visibilityState !== 'visible') return;
      event('visit');
      if (!id || finished) return;
      started=performance.now();
      timer=setTimeout(() => { timer=null; finished=true; event('read',id); },Math.max(0,remaining));
    }
    scope.listen(document,'visibilitychange',visible);
    scope.cleanup(() => clearTimeout(timer));
    visible();
  });
})();
