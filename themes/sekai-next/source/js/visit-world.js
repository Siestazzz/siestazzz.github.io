/* Blog visit policy, not a game mechanic. Keep one scene until a long absence. */
(()=>{
 const worlds=['5','7','8','9','10','27'],key='sekai-world-visit',timeout=30*60*1000;
 const read=()=>{try{return JSON.parse(localStorage.getItem(key));}catch{return null;}};
 const valid=s=>s&&worlds.includes(s.world)&&Number.isFinite(s.lastSeen);
 let state=read();const now=Date.now();
 if(!valid(state)||now-state.lastSeen>=timeout){
  const pool=worlds.filter(w=>w!==state?.world);
  state={world:pool[Math.floor(Math.random()*pool.length)],lastSeen:now,startedAt:now};
 }
 document.documentElement.dataset.homeWorld=state.world;
 state.startedAt=state.startedAt||now;
 document.documentElement.dataset.visitId=String(state.startedAt);
 const save=()=>{state.lastSeen=Date.now();try{localStorage.setItem(key,JSON.stringify(state));localStorage.setItem('sekai-home-world',state.world);}catch{}};
 function resume(){
  if(document.hidden)return;
  const latest=read();
  if(valid(latest)&&(latest.world!==state.world||Date.now()-latest.lastSeen>=timeout)){location.reload();return;}
  save();
 }
 save();
 setInterval(()=>{if(!document.hidden)save();},15000);
 addEventListener('pagehide',()=>{if(!document.hidden)save();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)save();else resume();});
 addEventListener('pageshow',e=>{if(e.persisted)resume();});
})();
