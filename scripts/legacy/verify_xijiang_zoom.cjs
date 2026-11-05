// Historical first-person QA from revision5; current camera QA is ../verify_xijiang_gameplay.cjs
const { chromium } = require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const output = 'D:/Miao/output/xijiang-map';
const baseUrl = process.env.MIAO_QA_URL || 'http://127.0.0.1:5173';
const report = { startedAt: new Date().toISOString(), url: baseUrl, environment: 'Chrome headless software WebGL; actual buttons, wheel and CDP touch; read-only diagnostics', devices: [], errors: [] };
const assert = (condition, message) => { if (!condition) throw Error(message); };
const close = (a, b, message, epsilon = 1e-7) => assert(Math.abs(a - b) < epsilon, `${message}: ${a} != ${b}`);
const snapshot = page => page.evaluate(() => window.__miaoMapDiagnostics());
const frames = (page, count = 2) => page.evaluate(count => new Promise(resolve => {
  let remaining = count;
  function tick() { if (--remaining <= 0) resolve(window.__miaoMapDiagnostics()); else requestAnimationFrame(tick); }
  requestAnimationFrame(tick);
}), count);
const fixedEyes = (before, after, action) => {
  for (const key of ['x','y','z']) close(before.camera.position[key], after.camera.position[key], `${action}: eye ${key}`);
  for (const key of ['x','y','z','w']) close(before.camera.quaternion[key], after.camera.quaternion[key], `${action}: bearing ${key}`);
  close(after.camera.position.y - after.avatar.position.y, after.firstPerson.eyeHeight, `${action}: eye height`);
  assert(!after.avatar.visible && after.routeLength === 0, `${action}: must retain hidden avatar and not launch a route`);
};
async function clearCanvasPoint(page, halfSpan = 0) {
  const point = await page.evaluate(halfSpan => {
    const canvas = document.querySelector('.miao-3d-canvas-viewport canvas');
    const box = canvas.getBoundingClientRect();
    for (const fy of [.62,.70,.55,.42]) for (const fx of [.5,.4,.6]) {
      const x = box.left + box.width * fx, y = box.top + box.height * fy;
      const clear = [-halfSpan,0,halfSpan].every(offset => [[0,0],[-30,0],[30,0],[0,-30],[0,30]].every(([a,b]) => document.elementFromPoint(x+offset+a,y+b) === canvas));
      if (clear) return { x,y };
    }
    return null;
  }, halfSpan);
  assert(point, 'No unobstructed canvas region for gesture');
  return point;
}
async function verifyDevice(browser, device) {
  const context = await browser.newContext({ viewport: { width: device.width, height: device.height }, hasTouch: device.touch, isMobile: device.touch, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => report.errors.push({ device: device.name, error: error.message }));
  const cdp = await context.newCDPSession(page);
  const results = { device: device.name, checks: [], screenshots: [] };
  report.devices.push(results);
  const activate = async locator => { if (device.touch) await locator.tap(); else await locator.click(); await frames(page); };
  try {
    console.log(device.name, 'loading');
    await page.goto(`${baseUrl}/miniapp/map`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__miaoMapDiagnostics?.().modelReady, undefined, { timeout: 90000 });
    await activate(page.getByRole('button', { name: '🎥 第一人称', exact: true }));
    const baseline = await snapshot(page);
    const inButton = page.getByRole('button', { name: '第一人称放大', exact: true });
    const outButton = page.getByRole('button', { name: '第一人称缩小', exact: true });
    const check = async (expected, action, screenshot = false) => {
      const after = await frames(page);
      close(after.camera.zoom, expected, `${action}: literal camera zoom`);
      close(after.camera.fov, 65, `${action}: unchanged base FOV`);
      close(after.camera.effectiveFov, 2 * Math.atan(Math.tan(65 * Math.PI / 360) / expected) * 180 / Math.PI, `${action}: optical effective FOV`);
      fixedEyes(baseline, after, action);
      assert((await page.getByLabel('当前缩放倍率', { exact: true }).textContent()) === `${expected.toFixed(1)}×`, `${action}: visible exact tenth`);
      results.checks.push({ action, zoom: after.camera.zoom, effectiveFov: after.camera.effectiveFov, fixedEyes: true });
      if (screenshot) {
        const file = path.join(output, `${device.name}-zoom-${expected.toFixed(1)}x.png`);
        await page.screenshot({ path: file }); results.screenshots.push(file);
      }
    };
    await check(.3, 'default', true);
    await activate(outButton); await check(.2, 'button-out .2');
    await activate(outButton); await check(.1, 'minimum', true);
    assert(await outButton.isDisabled(), 'Minimum disables zoom-out');
    for (const zoom of [.2,.3,.4,.5]) { await activate(inButton); await check(zoom, `button-in ${zoom}`, zoom === .5); }
    assert(await inButton.isDisabled(), 'Maximum disables zoom-in');
    console.log(device.name, 'button bounds passed');
    if (device.touch) {
      const point = await clearCanvasPoint(page, 90);
      const points = span => [{ x:point.x-span/2,y:point.y,id:41,radiusX:2,radiusY:2,force:1 },{ x:point.x+span/2,y:point.y,id:42,radiusX:2,radiusY:2,force:1 }];
      const pinch = async spans => {
        await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:points(spans[0]) });
        for (const span of spans.slice(1)) await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:points(span) });
        await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
        await frames(page);
      };
      await pinch([180,140,95,55,20]); await check(.1,'pinch minimum');
      await pinch([20,45,85,130,180]); await check(.5,'spread maximum');
    } else {
      const point = await clearCanvasPoint(page);
      await page.mouse.move(point.x,point.y);
      for (let i=0;i<3;i++) { await page.mouse.wheel(0,600); await frames(page); }
      await check(.1,'wheel minimum');
      for (let i=0;i<3;i++) { await page.mouse.wheel(0,-600); await frames(page); }
      await check(.5,'wheel maximum');
    }
    console.log(device.name, 'gesture bounds passed');
    await activate(page.getByRole('button', { name: '🗺️ 宏观全景', exact: true }));
    const overview = await snapshot(page);
    close(overview.camera.zoom,1,'Overview resets zoom');
    assert(overview.avatar.visible,'Overview restores avatar');
    await activate(page.getByRole('button', { name: '🎥 第一人称', exact: true }));
    await check(.3,'reentry default');
    // One short real joystick hold checks map-forward remains independent of magnification.
    const b = await page.locator('.joystick-base').boundingBox();
    const x=b.x+b.width/2, y=b.y+b.height/2;
    const point = (x,y) => [{ x,y,id:51,radiusX:2,radiusY:2,force:1 }];
    const before = await snapshot(page);
    if (device.touch) {
      await cdp.send('Input.dispatchTouchEvent',{ type:'touchStart',touchPoints:point(x,y-18) });
    } else { await page.mouse.move(x,y-18); await page.mouse.down(); }
    const moving = await frames(page,3);
    if (device.touch) await cdp.send('Input.dispatchTouchEvent',{ type:'touchEnd',touchPoints:[] }); else await page.mouse.up();
    const stopped = await frames(page,2);
    const q=moving.camera.quaternion, rx=1-2*(q.y*q.y+q.z*q.z), rz=2*(q.x*q.z-q.w*q.y), length=Math.hypot(rx,rz);
    const dx=moving.avatar.position.x-before.avatar.position.x,dz=moving.avatar.position.z-before.avatar.position.z;
    const alignment=(dx*rz/length-dz*rx/length)/Math.hypot(dx,dz);
    assert(alignment>.98,'Joystick must move camera-forward after zoom');
    assert(!stopped.input.active,'Joystick must stop after release');
    results.checks.push({ action:'map-forward after zoom',alignment,stopped:true });
    results.status='passed';
    console.log(device.name,'passed');
  } catch(error) { results.status='failed';results.failure=error.stack;throw error; }
  finally { fs.writeFileSync(path.join(output,'zoom-verification.json'),JSON.stringify(report,null,2));await context.close(); }
}
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-webgl']});
  try {
    for(const device of [{name:'desktop',width:1440,height:1000,touch:false},{name:'mobile',width:430,height:932,touch:true}]) await verifyDevice(browser,device);
    assert(!report.errors.length,'No browser errors expected');report.status='passed';
  } catch(error){report.status='failed';report.failure=error.stack;throw error;}
  finally {report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(output,'zoom-verification.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
