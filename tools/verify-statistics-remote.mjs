import assert from 'node:assert/strict';
const production=process.argv.includes('--production');
const base=production?'https://siestablog.2259670306-11c.workers.dev':'https://siestablog-stats-test.2259670306-11c.workers.dev';
const origin='https://siestazzz.github.io';
async function call(path,body,source=origin){
 const r=await fetch(base+path,{method:body?'POST':'GET',headers:{Origin:source,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
 return {status:r.status,cache:r.headers.get('X-Stats-Cache'),cors:r.headers.get('Access-Control-Allow-Origin'),body:await r.json()};
}
if(process.argv.includes('--disabled')){
 assert.equal((await call('/events',{kind:'visit',visitor:crypto.randomUUID()})).body.error,'writes_disabled');
 assert.equal((await call('/stats')).status,200);
 console.log('PASS remote: disabled writes, reads remain available');
 process.exit(0);
}
const first=await call('/stats');assert.equal(first.status,200);assert.equal(Object.keys(first.body.articles).length,10);
await new Promise(r=>setTimeout(r,1500));
const cached=await call('/stats?arbitrary-cache-buster='+crypto.randomUUID());
assert.equal(cached.cache,'HIT');assert.equal(cached.cors,origin);
assert.equal((await call('/events',{kind:'visit',visitor:crypto.randomUUID()},'https://invalid.example')).status,403);
assert.equal((await call('/events',{kind:'read',id:'nonexistent-test-article',visitor:crypto.randomUUID()})).status,404);
if(production){
 console.log('PASS production: 10 articles, canonical cache HIT, CORS rejection, unknown article rejection. No accepted events sent.');
 console.log(JSON.stringify(cached.body));process.exit(0);
}
const event={kind:'read',id:'allsafe-android-writeup',visitor:crypto.randomUUID()};
assert.equal((await call('/events',event)).body.accepted,true);
assert.equal((await call('/events',event)).body.accepted,false);
const visit={kind:'visit',visitor:event.visitor};
assert.equal((await call('/events',visit)).body.accepted,true);
assert.equal((await call('/events',visit)).body.accepted,false);
let blocked=false;
for(let i=0;i<35;i++)if((await call('/events',event)).status===429){blocked=true;break;}
assert.ok(blocked,'expected WRITE_LIMITER 429');
blocked=false;
for(let i=0;i<45;i++)if((await call('/stats')).status===429){blocked=true;break;}
assert.ok(blocked,'expected READ_LIMITER 429');
console.log('PASS remote test: real D1 receipt/triggers, dedup, cache, CORS, read/write rate limits. Only test database received events.');
