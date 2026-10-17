export const VISIT_WINDOW = 365 * 86400;
const READ_WINDOW = 1800;
export const receiptSQL = `INSERT INTO receipts(kind,subject,visitor,accepted_at) VALUES(?,?,?,?)
  ON CONFLICT(kind,subject,visitor) DO UPDATE SET accepted_at=excluded.accepted_at
  WHERE receipts.accepted_at <= excluded.accepted_at - CASE WHEN excluded.kind='visit' THEN ${VISIT_WINDOW} ELSE ${READ_WINDOW} END
  RETURNING accepted_at`;

async function hash(secret, value) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))), b => b.toString(16).padStart(2,'0')).join('');
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const headers = {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'Vary':'Origin'};
    if (allowed.includes(origin)) Object.assign(headers, {
      'Access-Control-Allow-Origin':origin,
      'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type',
      'Access-Control-Max-Age':'86400'
    });
    const reply = (data, status=200) => new Response(JSON.stringify(data), {status, headers});
    if (origin && !allowed.includes(origin)) return reply({error:'origin_not_allowed'},403);
    const path = new URL(request.url).pathname;
    if (!['/stats','/events'].includes(path)) return reply({error:'not_found'},404);
    if (request.method === 'OPTIONS') return new Response(null, {status:204, headers});
    if ((path === '/stats' && request.method !== 'GET') || (path === '/events' && request.method !== 'POST')) return reply({error:'method_not_allowed'},405);
    if (path === '/events' && (!origin || !allowed.includes(origin))) return reply({error:'origin_required'},403);
    if (path === '/events' && env.STATS_WRITES_ENABLED !== 'true') return reply({error:'writes_disabled'},503);
    if (!env.DB) return reply({error:'database_not_configured'},503);
    try {
      // Fail closed: missing protection must not silently enable unlimited D1 access.
      const limiter = path === '/stats' ? env.READ_LIMITER : env.WRITE_LIMITER;
      if (!limiter || !env.STATS_SECRET) return reply({error:'protection_not_configured'},503);
      const ip = request.headers.get('CF-Connecting-IP');
      if (!ip) return reply({error:'client_address_unavailable'},503);
      const actor = await hash(env.STATS_SECRET, 'limit:'+Math.floor(Date.now()/86400000)+':'+ip);
      if (!(await limiter.limit({key:actor})).success) {
        headers['Retry-After']='60';
        return reply({error:'rate_limited'},429);
      }
      if (path === '/stats') {
        // No caller query/Origin in cache key. Only cache data, apply CORS per response.
        const cache = globalThis.caches?.default;
        const key = new Request(new URL('/__statistics_snapshot_v2',request.url).href);
        const cached = cache ? await cache.match(key) : null;
        if(cached) { headers['X-Stats-Cache']='HIT'; return reply(await cached.json()); }
        // One transaction gives a consistent site + article snapshot, one browser request.
        const [total, articles] = await env.DB.batch([
          env.DB.prepare('SELECT visits, reads FROM totals WHERE id=1'),
          env.DB.prepare('SELECT id, views FROM articles ORDER BY id LIMIT 500')
        ]);
        const data={ ...total.results[0], articles:Object.fromEntries(articles.results.map(r => [r.id,r.views])) };
        if(cache) {
          const put=cache.put(key,new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=60'}})).catch(()=>{});
          if(ctx) ctx.waitUntil(put); else await put;
        }
        headers['X-Stats-Cache']='MISS';
        return reply(data);
      }
      if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return reply({error:'json_required'},415);
      // Stream with a hard bound; Content-Length alone is not trustworthy.
      const reader = request.body?.getReader();
      if (!reader) return reply({error:'invalid_body'},400);
      let chunks=[], size=0;
      while (true) {
        const {done,value} = await reader.read(); if(done) break;
        size += value.length;
        if(size > 1024) { await reader.cancel(); return reply({error:'body_too_large'},413); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size); let offset=0;
      for(const c of chunks) { bytes.set(c,offset); offset+=c.length; }
      let body; try { body=JSON.parse(new TextDecoder().decode(bytes)); } catch { return reply({error:'invalid_json'},400); }
      if (!body || !['visit','read'].includes(body.kind) || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.visitor || '')) return reply({error:'invalid_event'},400);
      const subject = body.kind === 'visit' ? 'site' : body.id;
      if (typeof subject !== 'string' || !/^[a-z0-9][a-z0-9-]{0,119}$/.test(subject)) return reply({error:'invalid_article'},400);
      const now = Math.floor(Date.now()/1000);
      if(body.kind === 'read' && !await env.DB.prepare('SELECT id FROM articles WHERE id=?').bind(subject).first()) return reply({error:'unknown_article'},404);
      const visitor = await hash(env.STATS_SECRET, 'visitor:'+body.visitor.toLowerCase());
      const result = await env.DB.prepare(receiptSQL).bind(body.kind,subject,visitor,now).all();
      return reply({accepted:result.results.length > 0});
    } catch {
      // Do not expose SQL or identifiers to clients.
      return reply({error:'statistics_unavailable'},503);
    }
  },
  async scheduled(event,env,ctx) {
    const now = Math.floor(Date.now()/1000);
    ctx.waitUntil(env.DB.batch([
      env.DB.prepare("DELETE FROM receipts WHERE (kind='visit' AND accepted_at < ?) OR (kind='read' AND accepted_at < ?)").bind(now-VISIT_WINDOW,now-86400),
      env.DB.prepare('DELETE FROM rate_limits WHERE expires < ?').bind(now)
    ]));
  }
};
