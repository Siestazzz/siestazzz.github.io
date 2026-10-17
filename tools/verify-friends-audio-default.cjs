const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/22596/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.addInitScript(()=>localStorage.setItem('sekai-audio-enabled','0'));
 await page.goto('http://localhost:4100/friends/',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('.friends-row').count(),2);
 for(const avatar of await page.locator('.friends-avatar img').all()){
  assert.equal(await avatar.getAttribute('loading'),'eager');
  assert.equal(await avatar.getAttribute('fetchpriority'),'high');
 }
 const names=await page.locator('.friends-identity strong').allTextContents();
 assert.deepEqual(names.sort(),['JuicyMio','RinpoStk']);
 assert.equal(await page.locator('[data-friend-name="RinpoStk"] .friends-comment').textContent(),'这个人很懒，没有留下他的介绍');
 assert.equal(await page.locator('[data-friend-name="JuicyMio"] .friends-comment').textContent(),'Happy hacking');
 assert.equal(await page.locator('[data-friend-name="RinpoStk"] img').getAttribute('src'),'https://rinpostk.github.io/image/2.png');
 assert.equal(await page.locator('[data-friend-name="JuicyMio"] img').getAttribute('src'),'https://juicymio.github.io/avatar.jpg');
 await page.waitForFunction(()=>window.sekaiAudio?.state.playing);
 assert.equal(await page.evaluate(()=>window.sekaiAudio.state.enabled),true);
 await page.locator('.bgm-toggle').click();
 assert.equal(await page.evaluate(()=>window.sekaiAudio.state.enabled),false);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.sekaiAudio?.state.playing);
 await page.screenshot({path:'backups/verification/friends-two.png'});
 await page.goto('http://localhost:4100/',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('.title-entry-note').count(),0);
 await page.waitForFunction(()=>window.sekaiAudio?.state.playing);
 assert.equal(await page.evaluate(()=>window.sekaiAudio.state.track),'music0001');
 console.log('PASS: two friends, supplied avatars/descriptions, no entry disclaimer, default autoplay where allowed, mute/reload.');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
