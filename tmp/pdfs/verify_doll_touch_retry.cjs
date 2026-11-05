const {chromium}=require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('assert/strict');const fs=require('fs');
(async()=>{
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:320,height:740},isMobile:true,hasTouch:true});const page=await context.newPage();let failures=0;
await page.route('**/MiaoGirl_6.glb*',r=>{if(!failures++){return r.abort()}return r.continue()});
await page.goto('http://127.0.0.1:5173/');await page.getByRole('button',{name:/跳过/}).click();await page.getByRole('navigation',{name:'主导航'}).getByRole('link',{name:'体验坊',exact:true}).click();await page.locator('.craft-preview-card.doll').click();
await page.getByRole('button',{name:'重新加载彩绣披肩'}).click();await page.waitForFunction(()=>[...document.querySelectorAll('.doll-style-model')].length===6&&[...document.querySelectorAll('.doll-style-model')].every(m=>m.loaded),{},{timeout:60000});
await page.locator('.page-content').evaluate(el=>el.scrollTop=0);await page.waitForTimeout(500);const box=await page.locator('.doll-style-model').first().boundingBox();
const cdp=await context.newCDPSession(page);const x=box.x+box.width*.5;const y=box.y+box.height*.8;const start=await page.locator('.page-content').evaluate(el=>el.scrollTop);
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*12}]});await page.waitForTimeout(20)}
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(500);
const end=await page.locator('.page-content').evaluate(el=>el.scrollTop);assert(end-start>60);const horizontalOverflow=await page.locator('.page-content').evaluate(el=>el.scrollWidth-el.clientWidth);assert(horizontalOverflow<=1);
await page.screenshot({path:'D:/Miao/output/workshop-dolls/mobile-320-touch.png'});const result={retryRecovered:true,loadedModels:6,touchScrollDistance:end-start,horizontalOverflow};fs.writeFileSync('D:/Miao/output/workshop-dolls/touch-retry-verification.json',JSON.stringify(result,null,2));console.log(result);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
