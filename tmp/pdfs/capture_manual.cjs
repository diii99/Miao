const { chromium } = require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const out = 'D:/Miao/output/pdf/manual-assets';
fs.mkdirSync(out, {recursive:true});
(async()=>{
 const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader']});
 const context = await browser.newContext({viewport:{width:440,height:956},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});
 const page = await context.newPage(); const report={shots:[],errors:[]};
 page.on('pageerror',e=>report.errors.push(e.message));
 async function shot(name){await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(out,name+'.png')});report.shots.push({name,url:page.url(),text:await page.locator('body').innerText()});fs.writeFileSync(path.join(out,'capture-report.json'),JSON.stringify(report,null,2));console.log(name);}
 await page.goto('http://127.0.0.1:5173/',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'跳过'}).click();await page.waitForTimeout(3500);await shot('01-home');
 await page.getByRole('button',{name:'继续',exact:true}).click();await page.getByRole('button',{name:'继续',exact:true}).click();await page.getByRole('button',{name:'去问问纠笙'}).click();await shot('02-guide');
 await page.getByRole('navigation',{name:'主导航'}).getByRole('link',{name:'非遗',exact:true}).click();await shot('03-heritage');
 await page.locator('.heritage-library-entry').click();await shot('04-catalog');
 await page.getByRole('searchbox').fill('苗绣');await shot('05-search');await page.locator('.heritage-list-card').first().click();await shot('06-story');
 await page.getByRole('button',{name:'查阅来源 ↗',exact:true}).click();await shot('07-sources');await page.getByRole('button',{name:'关闭',exact:true}).click();
 await page.getByRole('navigation',{name:'主导航'}).getByRole('link',{name:'体验坊',exact:true}).click();await shot('08-workshop');
 await page.locator('.craft-preview-card.embroidery').click();await shot('09-editor');
 await page.locator('input[type=file]').setInputFiles('D:/Miao/src/assets/miao-butterfly-pattern.png');await page.getByRole('button',{name:'生成我的苗绣纹样',exact:true}).click();await page.locator('.workshop-result').waitFor();await page.locator('.workshop-result').scrollIntoViewIfNeeded();await shot('10-result');
 await page.getByRole('button',{name:'定制这件手作',exact:true}).click();await shot('11-order');report.issues=['440x956: submit button overlaps bottom navigation; keyboard Enter used for demo verification.'];await page.getByRole('button',{name:'提交定制',exact:true}).focus();await page.keyboard.press('Enter');await shot('12-order-demo');await page.waitForTimeout(2700);
 await page.getByRole('navigation',{name:'主导航'}).getByRole('link',{name:'地图',exact:true}).click();await page.locator('.find-lusheng:not([disabled])').waitFor({timeout:60000});await page.waitForTimeout(3500);await shot('13-map');
 await page.getByRole('button',{name:'宏观全景',exact:false}).click();await page.waitForTimeout(1500);await shot('14-overview');await page.getByRole('button',{name:'芦笙广场在哪里',exact:false}).click();await page.waitForTimeout(1000);await shot('15-landmark');
 await page.getByRole('button',{name:'关闭地标卡片'}).click();await page.getByRole('button',{name:'入寨入口与换乘',exact:true}).click();await shot('16-access');
 for(const [route,name] of [['xiaoxiaole','17-match'],['hongsuantang','18-soup'],['silver','19-silver'],['miao-feast','20-feast'],['miao-language','21-language'],['wax-dye','22-wax']]){
  await page.goto('http://127.0.0.1:5173/games/'+route,{waitUntil:'domcontentloaded'});await page.waitForTimeout(route==='wax-dye'?3500:800);await shot(name);
  const frame=page.frames().find(f=>f!==page.mainFrame());if(frame) report.shots.at(-1).frameText=await frame.locator('body').innerText();
  if(route==='xiaoxiaole'){await frame.locator('[data-pick="easy"]').click();await shot('17b-board');}
  if(route==='hongsuantang'){await frame.locator('#btnStart').click();await shot('18b-ingredients');}
  if(route==='silver'){await frame.locator('#go').click();await shot('19b-step');}
 }
 fs.writeFileSync(path.join(out,'capture-report.json'),JSON.stringify(report,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

