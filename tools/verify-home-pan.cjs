const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync('themes/sekai-next/source/js/home-world.js','utf8');
const body=js.match(/function panLimit\(viewWidth,imageWidth\)\{([\s\S]*?)\n  \}/)[1];
const limit=vm.runInNewContext('(function(viewWidth,imageWidth){'+body+'})');
for(const [view,image] of [[1920,2400],[1280,1600],[699,1956],[2560,3200],[1276.6667,1595.8334],[1200,1200],[900,905]]){
 const cap=limit(view,image);assert(cap>=0&&cap<=view*.12);
 for(const oldPan of [-10000,-500,0,500,10000]){
  const pan=Math.max(-cap,Math.min(cap,oldPan));
  assert((view-image)/2+pan<=.001);
  assert((view+image)/2+pan>=view-.001);
 }
}
assert(js.includes('cameraResize.observe(ground)'));
assert(js.includes("addEventListener('resize',reframe)"));
console.log('PASS: pan bounds at wide/narrow/fractional viewports, stale offsets after resize, image-load reframe.');
