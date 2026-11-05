const { chromium } = require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const out = 'output/home-conversation';
fs.mkdirSync(out, { recursive: true });
const sizes = [
 {name:'folded',width:280,height:653}, {name:'small',width:320,height:480},
 {name:'standard',width:390,height:844}, {name:'large',width:440,height:956},
 {name:'wide',width:480,height:960}, {name:'landscape',width:568,height:320},
 {name:'notched-landscape',width:844,height:390,safe:true}, {name:'desktop',width:1440,height:1000,desktop:true}
];
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const results=[];
 try{
  for(const size of sizes){
   const context=await browser.newContext({viewport:{width:size.width,height:size.height},isMobile:!size.desktop,hasTouch:!size.desktop,reducedMotion:'reduce'});
   const page=await context.newPage();
   const checks=[],errors=[];
   const check=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/api/chat',route=>route.fulfill({json:{reply:'苗绣的针法和纹样会因地区而异。认识一件作品，可以先看它来自哪个村寨，再观察针路、线色和图案。'.repeat(8)}}));
   await page.goto('http://127.0.0.1:5173/',{waitUntil:'domcontentloaded'});
   await page.getByRole('button',{name:'跳过'}).click();
   await page.locator('.home-shell').waitFor();
   if(size.safe) await page.evaluate(()=>{document.documentElement.style.setProperty('--app-safe-left','44px');document.documentElement.style.setProperty('--app-safe-right','44px');document.documentElement.style.setProperty('--app-safe-bottom','21px')});
   const checkPanel=async(selector,state)=>{
    const m=await page.evaluate(selector=>{
     const el=document.querySelector(selector),panel=el.getBoundingClientRect(),avatar=document.querySelector('.home-avatar-model').getBoundingClientRect(),content=document.querySelector('.page-content').getBoundingClientRect();
     return {gap:avatar.left-panel.right,panelWidth:panel.width,avatarWidth:avatar.width,inBounds:panel.left>=content.left&&panel.right<=content.right&&panel.top>=content.top-1&&panel.bottom<=content.bottom+1,avatarInBounds:avatar.left>=content.left&&avatar.right<=content.right+1&&avatar.top>=content.top-1&&avatar.bottom<=content.bottom+1,noHorizontalOverflow:el.scrollWidth<=el.clientWidth+1,documentFits:document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight};
    },selector);
    check(state+': at least12px separation',m.gap>=11.5,m);
    check(state+': panel and model fit content',m.inBounds&&m.avatarInBounds&&m.noHorizontalOverflow&&m.documentFits,m);
    return m;
   };
   await checkPanel('.opening-guide','Guide');
   for(let i=0;i<3;i++)await page.locator('.opening-guide button').click();
   await page.locator('.pet-speech').waitFor();
   const open=await checkPanel('.pet-speech','Conversation');
   if(['small','large','landscape'].includes(size.name)) await page.screenshot({path:`${out}/${size.name}-suggestions.jpg`,type:'jpeg',quality:80});
   await page.getByRole('textbox',{name:'输入想问纠笙的问题'}).fill('苗绣的纹样有什么寓意？');
   await page.getByRole('button',{name:'发送',exact:true}).click();
   await page.locator('.pet-message.assistant').waitFor();
   await checkPanel('.pet-speech','Long reply');
   const input=page.getByRole('textbox',{name:'输入想问纠笙的问题'});
   await input.scrollIntoViewIfNeeded();
   await input.click();
   check('Input reachable above tabs',await input.evaluate(el=>{const r=el.getBoundingClientRect(),tabs=document.querySelector('.tab-bar').getBoundingClientRect();return r.bottom<=tabs.top&&r.width>35}));
   if(['small','large','landscape'].includes(size.name)){
    await page.waitForFunction(()=>document.querySelector('model-viewer').loaded,{},{timeout:20000}).catch(()=>{});
    await page.screenshot({path:`${out}/${size.name}.jpg`,type:'jpeg',quality:80});
   }
   await page.getByRole('button',{name:'收起对话'}).click();
   const closedWidth=await page.locator('.home-avatar-model').evaluate(el=>el.getBoundingClientRect().width);
   check('Closed conversation restores avatar width',size.width>=520||closedWidth>open.avatarWidth);
   await page.getByRole('button',{name:'再次向纠笙提问'}).click();
   await checkPanel('.pet-speech','Reopened conversation');
   check('No browser runtime errors',errors.length===0,errors);
   results.push({size,checks});
   fs.writeFileSync(`${out}/report.json`,JSON.stringify(results,null,2));
   console.log(JSON.stringify({size:size.name,failed:checks.filter(c=>!c.pass)}));
   await context.close();
  }
 }finally{await browser.close()}
 const failures=results.flatMap(r=>r.checks.filter(c=>!c.pass).map(c=>({size:r.size.name,...c})));
 console.log(JSON.stringify({viewports:results.length,checks:results.reduce((n,r)=>n+r.checks.length,0),failures},null,2));
 if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
