const {chromium}=require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-webgl']});const report=[];try{
for(const version of ['revision1','revision2']) {
 const page=await browser.newPage({viewport:{width:430,height:932}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(version==='revision1')await page.route('**/map-assets/models/xijiang-valley.glb',r=>r.fulfill({path:'D:/Miao/output/xijiang-map/revision1/xijiang-valley.glb',contentType:'model/gltf-binary'}));
 const started=Date.now();await page.goto('http://127.0.0.1:5173/miniapp/map',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('.find-lusheng') && !document.querySelector('.find-lusheng').disabled);const readyMs=Date.now()-started;
 const timing=await page.evaluate(()=>new Promise(resolve=>{let previous=performance.now(),start=previous;const samples=[];function tick(now){samples.push(now-previous);previous=now;if(now-start<4000)requestAnimationFrame(tick);else {samples.sort((a,b)=>a-b);resolve({samples:samples.length,medianFrameMs:samples[Math.floor(samples.length*.5)],p95FrameMs:samples[Math.floor(samples.length*.95)]})}}requestAnimationFrame(tick)}));
 if(version==='revision2') {
  await page.locator('.map-access-toggle').click();await page.getByRole('heading',{name:'从哪里进入西江'}).waitFor();await page.getByRole('button',{name:'关闭入口说明'}).click();
  await page.locator('.find-lusheng').click();await page.getByRole('button',{name:'关闭地标卡片'}).click();await page.screenshot({path:'D:/Miao/output/xijiang-map/final-plaza.png'});
  await page.getByRole('button',{name:'🗺️ 宏观全景'}).click();
  await page.locator('.landmark-pill').filter({hasText:'西江苗族博物馆'}).click();await page.getByRole('button',{name:'关闭地标卡片'}).click();await page.screenshot({path:'D:/Miao/output/xijiang-map/final-museum.png'});
 }
 report.push({version,readyMs,...timing,errors});await page.close();
}
fs.writeFileSync('D:/Miao/output/xijiang-map/runtime-comparison.json',JSON.stringify({environment:'Chrome headless software WebGL, 430x932, one 4-second overview sample per model; shared current UI; local dev server; not a physical-phone benchmark',report},null,2));console.log(report);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
