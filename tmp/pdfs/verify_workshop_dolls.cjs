const {chromium}=require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');const assert=require('assert/strict');const out='D:/Miao/output/workshop-dolls';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader']});
 const report=[];
 for(const device of [{name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true},{name:'desktop',viewport:{width:1440,height:1000},isMobile:false,hasTouch:false}]){
 const context=await browser.newContext({...device,deviceScaleFactor:1});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:/跳过/}).click({timeout:2000}).catch(()=>{});
 await page.getByRole('navigation',{name:'主导航'}).getByRole('link',{name:'体验坊',exact:true}).click();
 await page.locator('.craft-preview-card.doll').click();
 await page.waitForFunction(()=>document.querySelectorAll('.doll-style-model').length===6 && [...document.querySelectorAll('.doll-style-model')].every(m=>m.loaded),{},{timeout:60000});
 const srcs=await page.locator('.doll-style-model').evaluateAll(ms=>ms.map(m=>m.src));assert.equal(new Set(srcs).size,6);assert(srcs.every(s=>s.includes('/人物/3d/MiaoGirl_')&&s.includes('reduced-20260905')));
 assert.equal(await page.locator('.doll-model-status,.doll-model-error').count(),0);
 await page.screenshot({path:out+'/'+device.name+'-entry.png'});
 const first=page.locator('.doll-style-model').first();await first.scrollIntoViewIfNeeded();
 const before=await first.evaluate(m=>m.getCameraOrbit().theta);const box=await first.boundingBox();
 await page.mouse.move(box.x+box.width*.25,box.y+box.height*.55);await page.mouse.down();await page.mouse.move(box.x+box.width*.8,box.y+box.height*.55,{steps:15});await page.mouse.up();await page.waitForTimeout(500);
 const after=await first.evaluate(m=>m.getCameraOrbit().theta);assert(Math.abs(after-before)>.1);
 for(let i=0;i<6;i++){await page.locator('.doll-style-select').nth(i).click();assert.equal(await page.locator('.doll-style-select[aria-pressed=true]').count(),1);assert.equal(await page.locator('.doll-style-select').nth(i).getAttribute('aria-pressed'),'true');}
 await page.screenshot({path:out+'/'+device.name+'-last-row.png'});
 await page.locator('input[type=file]').setInputFiles('D:/Miao/public/人物/images/miao_girl_6.jpg');await page.getByRole('button',{name:'生成我的 3D 苗族人物玩偶',exact:true}).click();
 await page.locator('.doll-model-preview').waitFor();assert((await page.locator('.doll-model-preview').evaluate(m=>m.src)).includes('MiaoGirl_6.glb'));
 await page.locator('.doll-model-preview').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.doll-model-preview')?.loaded);await page.screenshot({path:out+'/'+device.name+'-selected-result.png'});
 await page.locator('.doll-style-select').nth(3).click();assert.equal(await page.locator('.workshop-result').count(),0);
 const bounds=await page.evaluate(()=>{let el=document.querySelector('.page-content');let nav=document.querySelector('.tab-bar').getBoundingClientRect();return {scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,navBottom:nav.bottom,viewport:innerHeight}});assert(bounds.scrollWidth<=bounds.clientWidth+1);assert(bounds.navBottom<=bounds.viewport+1);
 await page.getByRole('button',{name:'‹ 返回选择',exact:true}).click();await page.locator('.craft-preview-card.embroidery').click();assert.equal(await page.locator('.style-option').count(),2);assert.equal(await page.locator('.doll-style-model').count(),0);
 report.push({device:device.name,modelsLoaded:6,uniqueModels:srcs,rotationChanged:Math.abs(after-before),sixthResultMatches:true,selectionClearsResult:true,otherCraftUnchanged:true,bounds,errors});assert.deepEqual(errors,[]);await context.close();
 }
 fs.writeFileSync(out+'/verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
