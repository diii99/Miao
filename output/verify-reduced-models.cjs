const { chromium } = require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const crypto = require('node:crypto');
(async () => {
 const base = 'https://miao-heritage.wu-d1.workers.dev';
 for (let i=1;i<=6;i++) {
  const response = await fetch(`${base}/models/MiaoGirl_${i}.glb?v=reduced-20260905`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const local = fs.readFileSync(`D:/Miao/public/人物/3d/MiaoGirl_${i}.glb`);
  if (!response.ok || !bytes.equals(local)) throw new Error(`Model ${i} mismatch: ${response.status}`);
  console.log(`Live model ${i}: ${bytes.length} bytes, SHA256 matches ${crypto.createHash('sha256').update(bytes).digest('hex')}`);
 }
 const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try {
  const page = await browser.newPage({viewport:{width:430,height:900}});
  page.on('pageerror', error => console.log('PAGE ERROR:',error.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => document.querySelector('model-viewer')?.loaded, null, {timeout:90000});
  console.log('Home avatar rendered:', await page.locator('model-viewer').first().evaluate(el => el.src));
  await page.screenshot({path:'D:/Miao/output/reduced-model-live.png'});
  for (let i=1;i<=6;i++) {
   const result = await page.evaluate(async (i) => {
    const viewer = document.querySelector('model-viewer');
    const url = `/models/MiaoGirl_${i}.glb?v=reduced-20260905`;
    if (viewer.src === url && viewer.loaded) return 'loaded';
    return await new Promise((resolve,reject) => {
     const timer=setTimeout(()=>reject(new Error('Model load timed out')),60000);
     viewer.addEventListener('load',()=>{clearTimeout(timer);resolve('loaded');},{once:true});
     viewer.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('Model error'));},{once:true});
     viewer.setAttribute('src',url);
    });
   },i);
   console.log(`Browser model ${i}: ${result}`);
  }
 } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
