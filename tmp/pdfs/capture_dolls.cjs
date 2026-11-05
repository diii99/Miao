const {chromium}=require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
(async()=>{
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:450,height:550},deviceScaleFactor:2});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/manual-model-preview',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#f2f6f7}model-viewer{width:450px;height:550px;--progress-bar-height:0}</style><script type="module" src="/miniapp-avatar-3d/model-viewer.min.js"></script><model-viewer camera-orbit="0deg 85deg 115%" field-of-view="28deg" shadow-intensity="0.5" exposure="1" interaction-prompt="none" loading="eager"></model-viewer>`}));
await page.goto('http://127.0.0.1:5173/manual-model-preview');
await page.evaluate(async()=>{await customElements.whenDefined('model-viewer');customElements.get('model-viewer').meshoptDecoderLocation='/vendor/meshopt_decoder-1.1.js'});
for(let i=1;i<=6;i++){
await page.evaluate(i=>new Promise((resolve,reject)=>{let m=document.querySelector('model-viewer');m.addEventListener('load',resolve,{once:true});m.addEventListener('error',reject,{once:true});m.src='/人物/3d/MiaoGirl_'+i+'.glb?v=reduced-20260905'}),i);
await page.waitForTimeout(1500);
await page.screenshot({path:'D:/Miao/output/pdf/manual-assets/doll-model-0'+i+'.png'});console.log('Captured reduced 3D avatar '+i);
}
fs.writeFileSync('D:/Miao/tmp/pdfs/avatar-capture-report.json',JSON.stringify({count:6,models:'public/人物/3d/MiaoGirl_1..6.glb',errors},null,2));
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

