const { chromium } = require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
(async () => {
 const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true, args:['--use-angle=swiftshader','--enable-webgl']});
 const errors=[];
 try {
  for (const [name,route,width,height] of [['desktop','/miniapp/map',1440,1000],['mobile','/map',430,932]]) {
   const page = await browser.newPage({viewport:{width,height}});
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:5173'+route,{waitUntil:'domcontentloaded'});
   if (route === '/map') { await page.getByRole('button',{name:'跳过'}).click(); await page.getByRole('link',{name:'地图',exact:true}).click(); }
   await page.waitForFunction(()=>document.querySelector('.landmark-pill') && !document.querySelector('.landmark-pill').disabled,{timeout:60000});
   await page.waitForTimeout(1500);
   await page.screenshot({path:`D:/Miao/output/xijiang-map/${name}-day.png`});
   await page.getByRole('button',{name:'🏮 千户夜景'}).click();
   await page.waitForTimeout(400);
   await page.screenshot({path:`D:/Miao/output/xijiang-map/${name}-night.png`});
   console.log(name, 'loaded', await page.locator('.landmark-pill').allTextContents());
   await page.getByRole('button',{name:'☀️ 晴日'}).click();
   await page.locator('.landmark-pill').filter({hasText:'西江苗族博物馆'}).click();
   await page.getByRole('button',{name:'沿路步行前往'}).click();
   await page.locator('.poi-interaction-bubble h3').filter({hasText:'西江苗族博物馆'}).waitFor({timeout:30000});
   await page.locator('.bubble-action-btn').click();
   await page.getByRole('button',{name:'返回苗寨',exact:true}).click();
   await page.getByRole('button',{name:'🎥 追随视角'}).click();
   await page.waitForTimeout(500);
   await page.screenshot({path:`D:/Miao/output/xijiang-map/${name}-street.png`});
   console.log(name, 'museum arrived, details opened/closed, follow camera checked');
   await page.close();
  }
  const retry = await browser.newPage();
  await retry.route('**/map-assets/models/xijiang-valley.glb', route => route.abort());
  await retry.goto('http://127.0.0.1:5173/miniapp/map',{waitUntil:'domcontentloaded'});
  await retry.getByRole('button',{name:'重新加载'}).waitFor();
  await retry.unroute('**/map-assets/models/xijiang-valley.glb');
  await retry.getByRole('button',{name:'重新加载'}).click();
  await retry.waitForFunction(()=>document.querySelector('main[aria-busy="false"]'));
  console.log('GLB failure/retry and onReady verified');
  await retry.close();
  fs.writeFileSync('D:/Miao/output/xijiang-map/browser-errors.json',JSON.stringify(errors,null,2));
  if(errors.length) throw new Error(errors.join('\n'));
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
