const {chromium}=require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');const crypto=require('node:crypto');
const out='D:/Miao/output/xijiang-map';
const mobileOnly=process.argv.includes('--mobile-only');
const report=mobileOnly?JSON.parse(fs.readFileSync(out+'/gameplay-route-verification.json','utf8')):{devices:[],errors:[]};if(mobileOnly){report.devices=report.devices.filter(d=>d.device==='desktop');delete report.failure;report.errors=[];}const assert=(v,m)=>{if(!v)throw Error(m)};
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-webgl']});try{
for(const device of [{name:'desktop',route:'/miniapp/map',width:1440,height:1000},{name:'mobile-shell',route:'/map',width:430,height:932}].filter(d=>!mobileOnly||d.name!=='desktop')){
 const page=await browser.newPage({viewport:{width:device.width,height:device.height},hasTouch:device.name!=='desktop',isMobile:device.name!=='desktop'});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5173'+device.route,{waitUntil:'domcontentloaded'});
 if(device.route==='/map'){await page.getByRole('button',{name:'跳过'}).click();await page.getByRole('link',{name:'地图',exact:true}).click()}
 await page.waitForFunction(()=>window.__miaoMapDiagnostics?.().modelReady,undefined,{timeout:90000});
 await page.locator('.landmark-pill').filter({hasText:'西江苗族博物馆'}).click();
 assert((await page.evaluate(()=>window.__miaoMapDiagnostics())).mode==='landmark','Landmark should frame selected place');
 await page.getByRole('button',{name:'沿路步行前往',exact:true}).click();
 const before=await page.evaluate(()=>window.__miaoMapDiagnostics());assert(before.mode==='gameplay'&&before.routeLength>0,'Walk action must enter gameplay and start a route');
 const samples=await page.evaluate(()=>new Promise((resolve,reject)=>{const start=performance.now(),samples=[];let count=0;function tick(){const d=window.__miaoMapDiagnostics();if(++count%10===0)samples.push(d);if(!d.routeLength&&samples.length>2)return resolve(samples);if(performance.now()-start>55000)return reject(Error('Route did not finish'));requestAnimationFrame(tick)}tick()}));
 for(const d of samples){assert(d.mode==='gameplay'&&d.avatar.visible,'Route must retain visible avatar and gameplay');assert(Math.abs(d.avatar.screen.x)<.12&&Math.abs(d.avatar.screen.y)<.18,'Camera must keep walking avatar centered');const q=d.camera.quaternion,b=before.camera.quaternion;assert(Math.abs(q.x-b.x)+Math.abs(q.y-b.y)+Math.abs(q.z-b.z)+Math.abs(q.w-b.w)<1e-5,'Route turns must not rotate camera')}
 const after=await page.evaluate(()=>window.__miaoMapDiagnostics());assert(Math.hypot(after.avatar.position.x-before.avatar.position.x,after.avatar.position.z-before.avatar.position.z)>4,'Avatar must traverse route');assert(Math.hypot(after.camera.position.x-before.camera.position.x,after.camera.position.z-before.camera.position.z)>4,'Camera must follow route');
 await page.screenshot({path:out+'/'+device.name+'-gameplay-museum.png'});report.devices.push({device:device.name,route:device.route,samples:samples.length,status:'passed',initialMode:before.mode,finalRouteLength:after.routeLength,finalProjection:after.avatar.screen});await page.close();console.log(device.name,'landmark route camera follow passed')
}
assert(!report.errors.length,'Browser errors');report.status='passed';report.sourceSha256=crypto.createHash('sha256').update(fs.readFileSync('D:/Miao/src/map-3d/MiaoVillageScene.tsx')).digest('hex');
}catch(e){report.status='failed';report.failure=e.stack;throw e}finally{fs.writeFileSync(out+'/gameplay-route-verification.json',JSON.stringify(report,null,2));await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
