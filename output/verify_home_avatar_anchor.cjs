const { chromium } = require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const out = 'output/home-avatar-anchor';
fs.mkdirSync(out, { recursive: true });
const sizes = [{name:'small',width:320,height:480},{name:'standard',width:390,height:844},{name:'large',width:440,height:956},{name:'landscape',width:844,height:390},{name:'desktop',width:1440,height:1000,desktop:true}];
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const results=[];
 try {
  for(const size of sizes){
   const context=await browser.newContext({viewport:{width:size.width,height:size.height},isMobile:!size.desktop,hasTouch:!size.desktop});
   const page=await context.newPage();
   const errors=[],checks=[];
   const check=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:5173/',{waitUntil:'domcontentloaded'});
   await page.getByRole('button',{name:'跳过'}).click();
   await page.waitForFunction(()=>document.querySelector('.home-avatar-model')?.loaded);
   const viewer=page.locator('.home-avatar-model');
   await viewer.evaluate(v=>{v.autoRotate=false;v.resetTurntableRotation(0)});
   const settle=()=>page.evaluate(async()=>{for(let i=0;i<8;i++)await new Promise(requestAnimationFrame)});
   const pixels=async()=>{await settle();return viewer.evaluate(async v=>{
    const img=new Image(); img.src=v.toDataURL();await img.decode();
    const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const cx=c.getContext('2d');cx.drawImage(img,0,0);
    const data=cx.getImageData(0,0,c.width,c.height).data;let left=c.width,right=0,top=c.height,bottom=0,count=0;
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(data[(y*c.width+x)*4+3]>220){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++}
    const scale=v.clientWidth/c.width;return {left:left*scale,right:right*scale,top:top*scale,bottom:bottom*scale,pixels:count,width:v.clientWidth,height:v.clientHeight,orbit:v.getCameraOrbit(),target:v.getCameraTarget(),turntable:v.turntableRotation,fov:v.getFieldOfView()};
   })};
   const guide=await pixels();
   check('Guide renders visible avatar',guide.pixels>1000,guide);
   for(let i=0;i<3;i++)await page.locator('.opening-guide button').click();
   await page.locator('.pet-speech').evaluate(async e=>await Promise.all(e.getAnimations().map(a=>a.finished)));
   const open=await pixels();
   check('Open conversation has 12px viewer gap',await page.evaluate(()=>document.querySelector('.home-avatar-model').getBoundingClientRect().left-document.querySelector('.pet-speech').getBoundingClientRect().right>=11.5));
   if(size.name==='large')await page.screenshot({path:`${out}/large-conversation.jpg`,type:'jpeg',quality:85});
   await page.getByRole('button',{name:'收起对话'}).click();
   const initial=await pixels();
   check('Avatar sits in right part of container',(initial.left+initial.right)/2>initial.width*.55&&initial.right<initial.width,{initial});
   if(size.name==='large')await page.screenshot({path:`${out}/large-default.jpg`,type:'jpeg',quality:85});
   await viewer.hover();
   await page.mouse.wheel(0,-65);
   const zoomed=await pixels();
   check('Native wheel enlarges avatar toward left',zoomed.right-zoomed.left>initial.right-initial.left+8&&zoomed.left<initial.left-8,{initial,zoomed});
   check('Zoom keeps right edge inside container',zoomed.right<zoomed.width&&Math.abs(zoomed.right-initial.right)<15,{initial,zoomed});
   if(size.name==='large')await page.screenshot({path:`${out}/large-zoom.jpg`,type:'jpeg',quality:85});
   await page.mouse.wheel(0,65);
   const zoomOut=await pixels();
   check('Zoom out moves left edge back right',zoomOut.left>zoomed.left+8,{zoomed,zoomOut});
   const beforeDrag=zoomOut.orbit.theta;
   const box=await viewer.boundingBox();
   await page.mouse.move(box.x+box.width*.65,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.45,box.y+box.height*.5,{steps:8});await page.mouse.up();
   const rotated=await pixels();
   check('Native drag rotates avatar and retains right framing',Math.abs(rotated.orbit.theta-beforeDrag)>.1&&rotated.right<rotated.width&&rotated.pixels>1000,rotated);
   await viewer.evaluate(v=>{v.cameraOrbit='0deg 78deg 5m';v.resetTurntableRotation(0);v.autoRotateDelay=0;v.autoRotate=true});
   const beforeTurn=await pixels();
   await page.waitForFunction(t=>Math.abs(document.querySelector('.home-avatar-model').turntableRotation-t)>.25,beforeTurn.turntable,{timeout:10000});
   const turning=await pixels();
   check('Auto rotation continues with right framing',turning.right<turning.width&&turning.pixels>1000,{beforeTurn,turning});
   await viewer.evaluate(v=>{v.autoRotate=false;v.resetTurntableRotation(0);v.cameraOrbit='0deg 78deg 5m'});
   await page.getByRole('button',{name:'再次向纠笙提问'}).click();
   await pixels();
   await viewer.hover();await page.mouse.wheel(0,-65);await pixels();
   check('Zoomed conversation stays clear and page fits',await page.evaluate(()=>{const a=document.querySelector('.home-avatar-model').getBoundingClientRect(),p=document.querySelector('.pet-speech').getBoundingClientRect();return a.left-p.right>=11.5&&document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight}));
   if(size.name==='large')await page.screenshot({path:`${out}/large-conversation-zoom.jpg`,type:'jpeg',quality:85});
   check('No runtime errors',errors.length===0,errors);
   results.push({size,checks});
   console.log(JSON.stringify({size:size.name,failures:checks.filter(c=>!c.pass)}));
   fs.writeFileSync(`${out}/report.json`,JSON.stringify(results,null,2));
   await context.close();
  }
 }finally{await browser.close()}
 const failures=results.flatMap(r=>r.checks.filter(c=>!c.pass).map(c=>({size:r.size.name,...c})));
 console.log(JSON.stringify({viewports:results.length,checks:results.reduce((n,r)=>n+r.checks.length,0),failures},null,2));
 if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});