const { chromium } = require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const output = 'D:/Miao/output/xijiang-map';
const url = process.env.MIAO_QA_URL || 'http://127.0.0.1:5173';
const report = { startedAt: new Date().toISOString(), environment: 'Chrome headless software WebGL, real mouse and CDP touch; read-only scene diagnostics', devices: [], errors: [] };
const assert = (value, message) => { if (!value) throw new Error(message); };
const save = () => fs.writeFileSync(path.join(output, 'gameplay-verification.json'), JSON.stringify(report, null, 2));
const snap = page => page.evaluate(() => window.__miaoMapDiagnostics());
const length = (a, b = { x: 0, y: 0, z: 0 }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const quatDistance = (a, b) => 1 - Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w);
const axes = q => { const x = 1 - 2 * (q.y * q.y + q.z * q.z), z = 2 * (q.x * q.z - q.w * q.y), n = Math.hypot(x, z); return { right: { x: x / n, z: z / n }, forward: { x: z / n, z: -x / n } }; };
const frames = (page, count = 4) => page.evaluate(count => new Promise(resolve => { const values = []; let last = -1; function tick() { const value = window.__miaoMapDiagnostics(); if (value.frame !== last) { last = value.frame; values.push(value); } if (values.length >= count) resolve(values); else requestAnimationFrame(tick); } requestAnimationFrame(tick); }), count);

function input(page, cdp, touch) {
  let position;
  const points = (x, y) => [{ x, y, radiusX: 2, radiusY: 2, force: 1, id: 1 }];
  return {
    async start(x, y) { position = { x, y }; if (touch) await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(x, y) }); else { await page.mouse.move(x, y); await page.mouse.down(); } },
    async move(x, y, steps = 5) { const previous = position; if (touch) { for (let i = 1; i <= steps; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(previous.x + (x - previous.x) * i / steps, previous.y + (y - previous.y) * i / steps) }); } else await page.mouse.move(x, y, { steps }); position = { x, y }; },
    async end(cancel = false) { if (touch) await cdp.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] }); else { if (cancel) await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await page.mouse.up(); } },
  };
}

async function canvasPoint(page, radius = 35) {
  const point = await page.evaluate(radius => {
    const canvas = document.querySelector('.miao-3d-canvas-viewport canvas'), box = canvas.getBoundingClientRect();
    for (const fy of [.57, .66, .46, .35, .75]) for (const fx of [.45, .56, .32, .67]) {
      const x = box.left + box.width * fx, y = box.top + box.height * fy;
      const safe = [[0, 0], [radius, 0], [-radius, 0], [0, radius], [0, -radius], [radius * .7, radius * .7], [-radius * .7, radius * .7], [radius * .7, -radius * .7], [-radius * .7, -radius * .7]].every(([dx, dy]) => document.elementFromPoint(x + dx, y + dy) === canvas);
      if (safe) return { x, y, width: box.width, height: box.height };
    }
    return null;
  }, radius);
  assert(point, 'No unobstructed map area with sufficient touch-target clearance');
  return point;
}

function validateCamera(value, reference, centered = true) {
  assert(value.mode === 'gameplay', 'Gameplay camera mode must remain active');
  assert(value.avatar.visible, 'Gameplay avatar must stay visible');
  assert(Math.abs(value.camera.fov - 45) < .001 && Math.abs(value.camera.zoom - 1) < .001 && Math.abs(value.camera.effectiveFov - 45) < .001, 'Gameplay zoom must change distance with fixed 45-degree field of view');
  assert(quatDistance(value.camera.quaternion, reference.camera.quaternion) < .00001, 'Gameplay camera heading/pitch must remain fixed');
  assert(value.gameplay.zoom >= .1 - 1e-6 && value.gameplay.zoom <= .5 + 1e-6, 'Gameplay zoom must stay in 0.1–0.5 range');
  if (centered) {
    assert(Math.abs(value.gameplay.peek.x) < .01 && Math.abs(value.gameplay.peek.z) < .01, 'Camera peek must reset after release');
    assert(Math.hypot(value.gameplay.target.x - value.avatar.position.x, value.gameplay.target.z - value.avatar.position.z) < .12, 'Camera target must recenter on avatar');
    assert(Math.abs(value.avatar.screen.x) < .12 && Math.abs(value.avatar.screen.y) < .35 && value.avatar.screen.z > -1 && value.avatar.screen.z < 1, 'Avatar must remain centrally framed and in front of the camera');
  }
}

async function settle(page) {
  await page.waitForFunction(() => {
    const s = window.__miaoMapDiagnostics();
    return s.mode === 'gameplay' && Math.abs(s.gameplay.peek.x) < .008 && Math.abs(s.gameplay.peek.z) < .008 && Math.hypot(s.gameplay.target.x - s.avatar.position.x, s.gameplay.target.z - s.avatar.position.z) < .07;
  }, undefined, { timeout: 15000 });
  await frames(page, 5);
}

async function movement(page, gesture, x, y, reference, cancel = false) {
  const base = await page.locator('.joystick-base').boundingBox();
  assert(base, 'Bottom-left joystick must be visible');
  const center = { x: base.x + base.width / 2, y: base.y + base.height / 2 }, before = await snap(page);
  await gesture.start(center.x, center.y);
  await gesture.move(center.x + x * base.width * .4, center.y + y * base.width * .4, 1);
  const held = await frames(page, 4);
  await gesture.end(cancel);
  const stopped = await frames(page, 4);
  const after = stopped.at(-1), previous = stopped.at(-2);
  assert(!after.input.active && Math.abs(after.input.x) < .001 && Math.abs(after.input.y) < .001, 'Joystick must clear on release/cancel');
  assert(length(after.avatar.position, previous.avatar.position) < .0001, 'Avatar must stop when joystick is released/cancelled');
  let actualDistance = 0, requestAlignment = 1, actualAlignment = 1;
  for (const state of held) {
    const a = axes(state.camera.quaternion), wanted = { x: a.right.x * x - a.forward.x * y, z: a.right.z * x - a.forward.z * y }, wantedLength = Math.hypot(wanted.x, wanted.z);
    for (const [kind, vector] of [['requested', state.requestedMovement], ['applied', state.appliedMovement]]) {
      const n = Math.hypot(vector.x, vector.z);
      if (n < .00001) continue;
      const alignment = (vector.x * wanted.x + vector.z * wanted.z) / n / wantedLength;
      if (kind === 'requested') requestAlignment = Math.min(requestAlignment, alignment); else { actualAlignment = Math.min(actualAlignment, alignment); actualDistance += n; }
    }
    validateCamera(state, reference, false);
  }
  assert(actualDistance > .01 && requestAlignment > .99 && actualAlignment > .98, 'Avatar must actually move in the current map direction independently of its facing');
  await settle(page);
  const following = await snap(page);
  validateCamera(following, reference);
  const avatarDelta = { x: following.avatar.position.x - before.avatar.position.x, y: following.avatar.position.y - before.avatar.position.y, z: following.avatar.position.z - before.avatar.position.z };
  const cameraDelta = { x: following.camera.position.x - before.camera.position.x, y: following.camera.position.y - before.camera.position.y, z: following.camera.position.z - before.camera.position.z };
  assert(Math.hypot(cameraDelta.x - avatarDelta.x, cameraDelta.z - avatarDelta.z) < .15, 'Following camera must translate with avatar movement');
  return { input: [x, y], cancel, requestAlignment, actualAlignment, actualDistance, avatarRotationBefore: before.avatar.rotationY, avatarRotationAfter: following.avatar.rotationY, avatarDelta, cameraDelta, projection: following.avatar.screen };
}

async function peek(page, gesture, reference, cancel = false) {
  const point = await canvasPoint(page), before = await snap(page);
  await gesture.start(point.x, point.y);
  await gesture.move(point.x + Math.min(85, point.width * .19), point.y - 35);
  await frames(page, 5);
  const held = await snap(page);
  assert(Math.hypot(held.gameplay.peek.x, held.gameplay.peek.z) > .1, 'Holding a map drag must temporarily peek away from the avatar');
  assert(length(held.avatar.position, before.avatar.position) < .001, 'Dragging the map must not move the avatar');
  validateCamera(held, reference, false);
  await gesture.end(cancel);
  await settle(page);
  const restored = await snap(page);
  validateCamera(restored, reference);
  assert(restored.routeLength === 0, 'A map drag must not leave a click-navigation route');
  return { cancel, heldPeek: held.gameplay.peek, heldTarget: held.gameplay.target, restoredPeek: restored.gameplay.peek, restoredProjection: restored.avatar.screen };
}

async function zoomSnapshot(page, reference) {
  await settle(page);
  // Distance easing may continue after the target has settled; use actual convergence.
  const states = await frames(page, 15), state = states.at(-1);
  validateCamera(state, reference);
  return { zoom: state.gameplay.zoom, distance: length(state.camera.position, state.gameplay.target), fov: state.camera.fov, effectiveFov: state.camera.effectiveFov, position: state.camera.position, target: state.gameplay.target };
}
async function zoomChecks(page, cdp, touch, reference) {
  const results = [], zoomIn = page.getByRole('button', { name: '漫游视角放大', exact: true }), zoomOut = page.getByRole('button', { name: '漫游视角缩小', exact: true });
  const initial = await zoomSnapshot(page, reference);
  for (const [kind, button, target] of [['button-in-max', zoomIn, .5], ['button-out-min', zoomOut, .1]]) {
    for (let i = 0; i < 20 && Math.abs((await snap(page)).gameplay.zoom - target) > 1e-6; i++) { assert(await button.isEnabled(), `${kind} disabled before reaching limit`); await button.click(); }
    const state = await zoomSnapshot(page, reference);
    assert(Math.abs(state.zoom - target) < 1e-6, `${kind} must reach configured zoom boundary`);
    results.push({ action: kind, ...state });
  }
  assert(results[1].distance > results[0].distance * 4.5, '0.1 overview distance must be approximately five times 0.5 close distance');
  if (touch) {
    const point = await canvasPoint(page, 65);
    const points = span => [{ x: point.x - span / 2, y: point.y, radiusX: 2, radiusY: 2, force: 1, id: 2 }, { x: point.x + span / 2, y: point.y, radiusX: 2, radiusY: 2, force: 1, id: 3 }];
    let before = await zoomSnapshot(page, reference);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(35) });
    for (const span of [50, 75, 110]) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(span) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    let after = await zoomSnapshot(page, reference);
    assert(after.zoom > before.zoom && after.distance < before.distance, 'Pinch spread must increase zoom and move camera closer');
    results.push({ action: 'touch-spread', beforeZoom: before.zoom, ...after });
    before = after;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(110) });
    for (const span of [80, 55, 35]) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(span) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    after = await zoomSnapshot(page, reference);
    assert(after.zoom < before.zoom && after.distance > before.distance, 'Pinch contraction must decrease zoom and move camera farther');
    results.push({ action: 'touch-pinch', beforeZoom: before.zoom, ...after });
  } else {
    const point = await canvasPoint(page); await page.mouse.move(point.x, point.y);
    const before = await zoomSnapshot(page, reference);
    await page.mouse.wheel(0, -550); const closer = await zoomSnapshot(page, reference);
    assert(closer.zoom > before.zoom && closer.distance < before.distance, 'Wheel up must zoom closer');
    results.push({ action: 'wheel-in', beforeZoom: before.zoom, ...closer });
    await page.mouse.wheel(0, 550); const farther = await zoomSnapshot(page, reference);
    assert(farther.zoom < closer.zoom && farther.distance > closer.distance, 'Wheel down must zoom farther');
    results.push({ action: 'wheel-out', beforeZoom: closer.zoom, ...farther });
  }
  return { initial, results };
}

async function verify(browser, device) {
  const context = await browser.newContext({ viewport: { width: device.width, height: device.height }, hasTouch: device.touch, isMobile: device.touch, deviceScaleFactor: 1 });
  const page = await context.newPage(), cdp = await context.newCDPSession(page), gesture = input(page, cdp, device.touch);
  const result = { ...device, status: 'running', movements: [], peeks: [], screenshots: [] }; report.devices.push(result);
  page.on('pageerror', error => report.errors.push({ device: device.name, message: error.message }));
  page.setDefaultTimeout(30000);
  try {
    await page.goto(url + '/miniapp/map', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__miaoMapDiagnostics?.().modelReady, undefined, { timeout: 90000 });
    await settle(page); const initial = await snap(page);
    await page.getByRole('button', { name: '🎮 俯视漫游', exact: true }).waitFor();
    assert(await page.getByRole('button', { name: /第一人称|追随视角/ }).count() === 0, 'Previous camera mode labels must be removed');
    assert(Math.abs(initial.gameplay.zoom - .3) < 1e-6, 'Default gameplay zoom must be 0.3');
    validateCamera(initial, initial);
    const joystick = await page.locator('.virtual-joystick-zone').boundingBox();
    assert(joystick && joystick.x < device.width * .25 && joystick.y > device.height * .6 && joystick.y + joystick.height <= device.height, 'Joystick must remain in bottom-left visible area');
    result.initial = { mode: initial.mode, zoom: initial.gameplay.zoom, camera: initial.camera, avatar: initial.avatar, target: initial.gameplay.target, joystick };
    const screenshot = path.join(output, `${device.name}-gameplay-default.png`); await page.screenshot({ path: screenshot }); result.screenshots.push(screenshot);
    for (const [label, x, y, cancel] of [['forward', 0, -.4, false], ['strafe', .4, 0, false], ['forward-after-strafe', 0, -.4, false], ['cancel', -.4, 0, true]]) result.movements.push({ label, ...await movement(page, gesture, x, y, initial, cancel) });
    result.peeks.push(await peek(page, gesture, initial));
    result.peeks.push(await peek(page, gesture, initial, true));
    result.zoom = await zoomChecks(page, cdp, device.touch, initial);
    result.movements.push({ label: 'after-zoom', ...await movement(page, gesture, 0, -.35, initial) });
    await page.getByRole('button', { name: '🗺️ 宏观全景', exact: true }).click(); await frames(page, 3);
    assert((await snap(page)).mode === 'panoramic', 'Overview button must activate panoramic mode');
    await page.getByRole('button', { name: '🎮 俯视漫游', exact: true }).click(); await settle(page);
    validateCamera(await snap(page), initial);
    result.modeTransition = 'gameplay → panoramic → gameplay passed';
    result.status = 'passed'; save(); console.log(device.name, 'gameplay movement, peek/recenter, zoom, and transitions passed');
  } catch (error) { result.status = 'failed'; result.failure = error.stack; await page.screenshot({ path: path.join(output, `${device.name}-gameplay-failure.png`) }).catch(() => {}); throw error; }
  finally { await context.close(); }
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-webgl'] });
  try {
    for (const device of [{ name: 'desktop', width: 1440, height: 1000, touch: false }, { name: 'mobile', width: 430, height: 932, touch: true }]) await verify(browser, device);
    assert(report.devices.length === 2 && report.devices.every(device => device.status === 'passed' && device.movements.length === 5 && device.peeks.length === 2 && device.zoom.results.length === 4 && !device.failure), 'Both devices must complete all movement/peek/zoom cases');
    assert(!report.errors.length, 'No browser application errors allowed');
    report.status = 'passed'; report.finishedAt = new Date().toISOString();
    report.fingerprints = Object.fromEntries(['src/map-3d/MiaoVillageScene.tsx', 'src/map-3d/cameraNavigation.ts', 'src/map-3d/navigation.ts', 'src/map-3d/terrain.ts', 'src/map-3d/xijiang-layout.json', 'public/map-assets/models/xijiang-valley.glb'].map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join('D:/Miao', file))).digest('hex')]));
  } catch (error) { report.status = 'failed'; report.failure = error.stack; throw error; }
  finally { save(); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
