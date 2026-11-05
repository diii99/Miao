(function smoke() {
const {chromium}=require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');const path=require('node:path');
const base='http://127.0.0.1:4178';const report={checks:[],errors:[],modelAssets:'Local public/人物/3d fixtures substitute for the production Worker /models endpoint.'};
const assert=(v,m)=>{if(!v)throw Error(m)};
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-webgl']});
 try {
 async function open(route) {
 console.log('Checking',route); const context=await browser.newContext({viewport:{width:430,height:932}});
 await context.route('**/models/MiaoGirl_*.glb*',async route=>{
 const name=path.basename(new URL(route.request().url()).pathname);
 await route.fulfill({path:path.join('D:/Miao/public/人物/3d',name),contentType:'model/gltf-binary'});
 });
 const page=await context.newPage(); const scripts=[];
 page.on('pageerror',e=>report.errors.push({route,message:e.message}));
 page.on('request',r=>{if(r.resourceType()==='script')scripts.push(r.url())});
 page.setDefaultTimeout(45000);
 await page.goto(base+route,{waitUntil:'domcontentloaded'});
 return {context,page,scripts};
 }
 let {context,page,scripts}=await open('/miniapp/games/hongsuantang');
 await page.locator('iframe').waitFor();
 assert(!scripts.some(u=>/three-core|three-renderer|ModelViewerElement|MiaoVillageScene|WaxWorkbench3D/.test(u)),'Game frame eagerly loads 3D');
 console.log('Check passed'); report.checks.push({route:'/miniapp/games/hongsuantang',no3D:true,scripts:scripts.filter(u=>u.includes('/assets/'))});await context.close();
 ({context,page,scripts}=await open('/'));
 await page.getByRole('button',{name:/跳过/}).click();
 await page.waitForFunction(()=>document.querySelector('model-viewer')?.loaded,undefined,{timeout:60000});
 assert(!scripts.some(u=>/MiaoVillageScene|WaxWorkbench3D/.test(u)),'Home eagerly loads other 3D features');
 assert(await page.locator('model-viewer').getAttribute('camera-controls')!==null,'Viewer attributes lost');
 console.log('Check passed'); report.checks.push({route:'/',avatarLoaded:true,mapAndWaxDeferred:true});
 await page.getByRole('link',{name:'非遗',exact:true}).click();
 await page.locator('.heritage-shell').waitFor();
 await page.getByRole('link',{name:'体验坊',exact:true}).click();
 await page.getByRole('button',{name:/玩偶.*生成并打印/}).click();
 await page.waitForFunction(()=>document.querySelectorAll('.doll-style-model').length===6 && [...document.querySelectorAll('.doll-style-model')].every(v=>v.loaded),undefined,{timeout:90000});
 await page.waitForFunction(()=>document.querySelectorAll('.doll-model-status').length===0);
 console.log('Check passed'); report.checks.push({route:'/workshop',dollsLoaded:6,loadListenersWorking:true});await context.close();
 ({context,page,scripts}=await open('/miniapp/map'));
 await page.waitForFunction(()=>!document.documentElement.classList.contains('miniapp-map-booting') && !!document.querySelector('.miao-3d-canvas-viewport canvas'),undefined,{timeout:90000});
 assert(!scripts.some(u=>/ModelViewerElement|WaxWorkbench3D/.test(u)),'Map eagerly loads model viewer or wax');
 assert(!await page.evaluate(()=>document.documentElement.classList.contains('miniapp-map-booting')),'Map loading overlay did not clear');
 await page.getByRole('button',{name:'🗺️ 宏观全景',exact:true}).click();
 assert((await page.getByRole('button',{name:'🗺️ 宏观全景',exact:true}).getAttribute('class')).includes('active'),'Overview control did not activate');
 console.log('Check passed'); report.checks.push({route:'/miniapp/map',modelReady:true,modeSwitch:true,viewerAndWaxDeferred:true});await context.close();
 ({context,page,scripts}=await open('/miniapp/games/batik'));
 await page.locator('.three-canvas-root canvas').waitFor();
 await page.locator('.scene-loader-overlay').waitFor({state:'hidden',timeout:90000});
 const knifeButton=page.getByRole('button',{name:/点击取起 3D 铜蜡刀/}); await knifeButton.evaluate(button => button.scrollIntoView({block:'center'})); const knifeBox=await knifeButton.boundingBox(); assert(knifeBox,'Knife button missing'); await page.mouse.click(knifeBox.x+knifeBox.width/2,knifeBox.y+knifeBox.height/2);
 await page.locator('.wax-3d-scene-container.is-phase-warm').waitFor();
 assert(!scripts.some(u=>/ModelViewerElement|MiaoVillageScene/.test(u)),'Wax eagerly loads map or model viewer');
 console.log('Check passed'); report.checks.push({route:'/miniapp/games/batik',canvasReady:true,pickKnife:true,otherFeaturesDeferred:true});await context.close();
 assert(!report.errors.length,JSON.stringify(report.errors));
 report.status='passed'; console.log(JSON.stringify(report,null,2));
 }catch(e){report.status='failed';report.failure=e.stack;throw e}
 finally{fs.writeFileSync('D:/Miao/tmp/build-chunk-smoke.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
})()
