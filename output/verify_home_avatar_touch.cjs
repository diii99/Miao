const { chromium } = require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const c=await b.newContext({viewport:{width:440,height:956},isMobile:true,hasTouch:true});const p=await c.newPage();const checks=[];
 const check=(name,pass,detail)=>checks.push({name,pass,detail});
 await p.goto('http://127.0.0.1:5173/',{waitUntil:'domcontentloaded'});await p.getByRole('button',{name:'跳过'}).click();await p.waitForFunction(()=>document.querySelector('.home-avatar-model')?.loaded);
 const v=p.locator('.home-avatar-model');await v.evaluate(v=>{v.autoRotate=false;v.resetTurntableRotation(0)});
 for(let i=0;i<3;i++)await p.locator('.opening-guide button').click();await p.getByRole('button',{name:'收起对话'}).click();
 const measure=async()=>{await p.evaluate(async()=>{for(let i=0;i<10;i++)await new Promise(requestAnimationFrame)});return v.evaluate(async v=>{const img=new Image();img.src=v.toDataURL();await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const cx=canvas.getContext('2d');cx.drawImage(img,0,0);const data=cx.getImageData(0,0,canvas.width,canvas.height).data;let left=canvas.width,right=0;for(let i=3;i<data.length;i+=4)if(data[i]>220){const x=((i-3)/4)%canvas.width;left=Math.min(left,x);right=Math.max(right,x)}const s=v.clientWidth/canvas.width;return{left:left*s,right:right*s,width:v.clientWidth,orbit:v.getCameraOrbit(),target:v.getCameraTarget(),fov:v.getFieldOfView()}})};
 const initial=await measure();const box=await v.boundingBox();const x=box.x+box.width*.58,y=box.y+box.height*.55;const client=await c.newCDPSession(p);
 const points=spread=>[{x:x-spread,y,id:1},{x:x+spread,y,id:2}];
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points(20)});
 for(const spread of [23,26,29,32,35]){await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points(spread)});await p.evaluate(()=>new Promise(requestAnimationFrame))}
 await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});const pinched=await measure();
 check('Native two-finger pinch enlarges toward left',pinched.left<initial.left-8&&pinched.right-pinched.left>initial.right-initial.left+8,{initial,pinched});
 check('Pinch keeps right edge visible',pinched.right<pinched.width&&Math.abs(pinched.right-initial.right)<15,{initial,pinched});
 check('Pinch controls model without zooming whole page',await p.evaluate(()=>visualViewport.scale===1));
 await v.evaluate(v=>{v.cameraOrbit='0deg 78deg 5m';v.fieldOfView='28deg';v.jumpCameraToGoal()});
 for(const size of [{width:844,height:390},{width:320,height:480},{width:440,height:956}]){
  await p.setViewportSize(size);const frame=await measure();check(`Resize ${size.width}x${size.height} keeps avatar toward right`,frame.right<frame.width&&(frame.left+frame.right)/2>frame.width*.55,{frame});
  check(`Resize ${size.width}x${size.height} keeps full page in viewport`,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight));
 }
 await p.getByRole('button',{name:'再次向纠笙提问'}).click();await measure();check('Conversation reopens clear after pinch and resize',await p.evaluate(()=>document.querySelector('.home-avatar-model').getBoundingClientRect().left-document.querySelector('.pet-speech').getBoundingClientRect().right>=11.5));
 await p.screenshot({path:'output/home-avatar-anchor/touch-resize-final.jpg',type:'jpeg',quality:85});
 fs.writeFileSync('output/home-avatar-anchor/touch-report.json',JSON.stringify(checks,null,2));console.log(JSON.stringify(checks,null,2));if(checks.some(c=>!c.pass))process.exitCode=1;
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});