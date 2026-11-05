// Historical first-person QA from revision5; current camera QA is ../verify_xijiang_gameplay.cjs
const { chromium } = require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');

const baseUrl = process.env.MIAO_QA_URL || 'http://127.0.0.1:5173';
const outputDir = 'D:/Miao/output/xijiang-map';
let report = { startedAt: new Date().toISOString(), url: baseUrl, environment: 'Chrome headless, software WebGL, real mouse and CDP touch input; no camera or avatar state mutations', devices: [], errors: [] };
if (process.env.MIAO_QA_RESUME && fs.existsSync(path.join(outputDir, 'controls-verification.json'))) {
  report = JSON.parse(fs.readFileSync(path.join(outputDir, 'controls-verification.json'), 'utf8').replace(/^\uFEFF/, ''));
  report.harnessNotes = ['Previous opposite-step reset accumulated displacement at a walkable boundary. Remaining cases reset through actual plaza navigation; passed actual-movement cases retained.'];
  delete report.failure; report.status = 'running';
}
const saveReport = () => fs.writeFileSync(path.join(outputDir, 'controls-verification.json'), JSON.stringify(report, null, 2));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
const round = value => Math.round(value * 10000) / 10000;
const groundAxes = ({ x, y, z, w }) => {
  // Rotate the camera's local right vector into world space, then flatten it.
  const rightX = 1 - 2 * (y * y + z * z);
  const rightZ = 2 * (x * z - y * w);
  const magnitude = Math.hypot(rightX, rightZ);
  assert(magnitude > 1e-6, 'Camera right axis cannot define a ground direction');
  return { right: { x: rightX / magnitude, z: rightZ / magnitude }, forward: { x: rightZ / magnitude, z: -rightX / magnitude } };
};
const heading = diagnostic => {
  const forward = groundAxes(diagnostic.camera.quaternion).forward;
  return Math.atan2(forward.x, forward.z);
};
const snapshot = page => page.evaluate(() => window.__miaoMapDiagnostics());
const frames = (page, count = 3) => page.evaluate(count => new Promise(resolve => {
  const values = [];
  let priorFrame = -1;
  const capture = () => {
    const value = window.__miaoMapDiagnostics();
    if (value.frame !== priorFrame) { values.push(value); priorFrame = value.frame; }
    if (values.length >= count) resolve(values);
    else requestAnimationFrame(capture);
  };
  requestAnimationFrame(capture);
}), count);

function gestures(page, cdp, touch) {
  let point;
  const touches = (x, y) => [{ x, y, radiusX: 2, radiusY: 2, force: 1, id: 1 }];
  return {
    async start(x, y) {
      point = { x, y };
      if (touch) await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touches(x, y) });
      else { await page.mouse.move(x, y); await page.mouse.down(); }
    },
    async move(x, y, steps = 5) {
      const previous = point;
      if (touch) {
        for (let index = 1; index <= steps; index++) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touches(previous.x + (x - previous.x) * index / steps, previous.y + (y - previous.y) * index / steps) });
        }
      } else await page.mouse.move(x, y, { steps });
      point = { x, y };
    },
    async end(cancel = false) {
      if (touch) await cdp.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
      else if (cancel) {
        await page.evaluate(() => window.dispatchEvent(new Event('blur')));
        await page.mouse.up();
      } else await page.mouse.up();
    },
  };
}

async function canvasPoint(page, dx = 0, dy = 0) {
  const point = await page.evaluate(({ dx, dy }) => {
    const canvas = document.querySelector('.miao-3d-canvas-viewport canvas');
    const box = canvas.getBoundingClientRect();
    for (const fy of [.57, .66, .73, .39, .48]) for (const fx of [.45, .56, .32, .67]) {
      const x = box.left + box.width * fx, y = box.top + box.height * fy;
      if (x + dx < box.left + 12 || x + dx > box.right - 12 || y + dy < box.top + 12 || y + dy > box.bottom - 12) continue;
      if ([[0,0],[35,0],[-35,0],[0,35],[0,-35],[25,25],[-25,25],[25,-25],[-25,-25]].every(([px,py]) => document.elementFromPoint(x+px,y+py) === canvas)) return { x, y, width: box.width, height: box.height };
    }
    return null;
  }, { dx, dy });
  assert(point, 'Could not locate an unobstructed starting point on the map canvas');
  return point;
}

async function dragCanvas(page, gesture, dx, dy = 0) {
  const point = await canvasPoint(page, dx, dy);
  if (process.env.MIAO_QA_DEBUG) console.log('drag', point, dx, dy);
  await gesture.start(point.x, point.y);
  await gesture.move(point.x + dx, point.y + dy);
  await gesture.end();
  await frames(page, 12); // Let OrbitControls damping settle before testing direction.
}

async function faceHeading(page, gesture, target, mode) {
  const point = await canvasPoint(page);
  const pixelsPerRadian = mode === 'first-person' ? Math.max(320, Math.min(point.width, point.height)) / Math.PI : point.height / (2 * Math.PI);
  let calibrationSign = -1;
  for (let attempt = 0; attempt < 10; attempt++) {
    const current = heading(await snapshot(page));
    const difference = wrap(target - current);
    if (Math.abs(difference) < .20) return;
    let amount = Math.max(-point.width * .28, Math.min(point.width * .28, difference * pixelsPerRadian * (calibrationSign || 1)));
    if (Math.abs(amount) < 20) amount = Math.sign(amount) * 20;
    await dragCanvas(page, gesture, amount);
    const moved = wrap(heading(await snapshot(page)) - current);
    if (Math.abs(moved) <= .001) console.log('no-rotation-diagnostics', JSON.stringify({ snapshot: await snapshot(page), events: await page.evaluate(() => window.__qaPointerLog) }));
    assert(Math.abs(moved) > .001, `${mode}: horizontal canvas gesture did not rotate the camera`);
    calibrationSign = Math.sign(moved / amount);
  }
  const error = Math.abs(wrap(target - heading(await snapshot(page))));
  assert(error < .22, `${mode}: could not rotate to requested heading (${round(error)} radians off)`);
}

async function joystickHold(page, gesture, inputX, inputY, { cancel = false, sampleCount = 2 } = {}) {
  const zone = await page.locator('.virtual-joystick-zone').boundingBox();
  const base = await page.locator('.joystick-base').boundingBox();
  assert(zone && base, 'Joystick must be visible');
  const center = { x: base.x + base.width / 2, y: base.y + base.height / 2 };
  const prior = await snapshot(page);
  await gesture.start(center.x, center.y);
  await gesture.move(center.x + inputX * base.width * .4, center.y + inputY * base.width * .4, 1);
  const samples = await frames(page, sampleCount);
  await gesture.end(cancel);
  const stopped = await frames(page, 3);
  const last = stopped.at(-1), settled = stopped.at(-2);
  assert(!last.input.active && Math.abs(last.input.x) < .001 && Math.abs(last.input.y) < .001, 'Joystick must reset after release/cancellation');
  assert(Math.hypot(last.avatar.position.x - settled.avatar.position.x, last.avatar.position.z - settled.avatar.position.z) < .0001, 'Avatar must stop after joystick release/cancellation');
  const moving = samples.filter(value => Math.hypot(value.requestedMovement.x, value.requestedMovement.z) > .00001);
  assert(moving.length, 'Held joystick must request movement');
  let minimumRequestedAlignment = 1, minimumAppliedAlignment = 1, appliedDistance = 0;
  for (const value of moving) {
    const axes = groundAxes(value.camera.quaternion);
    const desired = { x: axes.right.x * inputX - axes.forward.x * inputY, z: axes.right.z * inputX - axes.forward.z * inputY };
    const desiredLength = Math.hypot(desired.x, desired.z);
    const requested = value.requestedMovement, applied = value.appliedMovement;
    const requestedLength = Math.hypot(requested.x, requested.z);
    const requestedAlignment = (requested.x * desired.x + requested.z * desired.z) / requestedLength / desiredLength;
    minimumRequestedAlignment = Math.min(minimumRequestedAlignment, requestedAlignment);
    const appliedLength = Math.hypot(applied.x, applied.z);
    if (appliedLength > .00001) {
      minimumAppliedAlignment = Math.min(minimumAppliedAlignment, (applied.x * desired.x + applied.z * desired.z) / appliedLength / desiredLength);
      appliedDistance += appliedLength;
    }
  }
  assert(minimumRequestedAlignment > .985, `Joystick requested the wrong map direction (alignment ${minimumRequestedAlignment})`);
  assert(appliedDistance > .01, 'Avatar did not move; the direction test must start within walkable space');
  assert(minimumAppliedAlignment > .97, `Avatar moved in the wrong map direction (alignment ${minimumAppliedAlignment})`);
  const result = {
    avatarStart: prior.avatar.position, avatarEnd: last.avatar.position,
    input: [inputX, inputY], headingDegrees: round(heading(moving[0]) * 180 / Math.PI),
    avatarRotationBefore: round(prior.avatar.rotationY),
    requestedAlignment: round(minimumRequestedAlignment), appliedAlignment: round(minimumAppliedAlignment),
    appliedDistance: round(appliedDistance), cancel, stopped: true,
  };
  if (prior.mode === 'first-person') {
    const cameraYawChange = Math.abs(wrap(heading(last) - heading(prior)));
    assert(cameraYawChange < .005, 'First-person movement changed camera yaw while turning the avatar');
    assert(!last.avatar.visible, 'Avatar body must be hidden in first-person view');
    const eyeHeight = last.firstPerson.eyeHeight;
    assert(Math.abs(last.camera.position.x - last.avatar.position.x) < .0001 && Math.abs(last.camera.position.z - last.avatar.position.z) < .0001, 'First-person camera must remain at the avatar horizontal position');
    assert(Math.abs(last.camera.position.y - last.avatar.position.y - eyeHeight) < .0001, 'First-person camera must remain at actual avatar eye height');
    result.eyeHeight = eyeHeight;
  }
  return result;
}

function assertFixedEye(before, after, message) {
  const eye = after.camera.position, avatar = after.avatar.position;
  assert(Math.abs(eye.x - avatar.x) < .0001 && Math.abs(eye.z - avatar.z) < .0001 && Math.abs(eye.y - avatar.y - after.firstPerson.eyeHeight) < .0001, `${message}: camera must stay at avatar eyes`);
  assert(Math.hypot(eye.x - before.camera.position.x, eye.y - before.camera.position.y, eye.z - before.camera.position.z) < .0001, `${message}: zoom must not move the camera`);
  assert(Math.abs(wrap(heading(after) - heading(before))) < .005, `${message}: zoom must preserve camera bearing`);
}

async function verifyZoom(page, cdp, gesture, touch) {
  await loadMap(page);
  await page.getByRole('button', { name: '🎥 第一人称', exact: true }).click();
  await frames(page, 3);
  const start = await snapshot(page);
  const tests = [];
  // Names are the user-visible labels supplied by the camera controls.
  const zoomIn = page.getByRole('button', { name: '第一人称放大', exact: true });
  const zoomOut = page.getByRole('button', { name: '第一人称缩小', exact: true });
  await zoomIn.click();
  await frames(page, 3);
  const buttonIn = await snapshot(page);
  assert(buttonIn.camera.fov < start.camera.fov, 'Zoom-in button must narrow the first-person FOV');
  assertFixedEye(start, buttonIn, 'Zoom-in button');
  tests.push({ action: 'button-in', beforeFov: start.camera.fov, afterFov: buttonIn.camera.fov });
  await zoomOut.click();
  await frames(page, 3);
  const buttonOut = await snapshot(page);
  assert(buttonOut.camera.fov > buttonIn.camera.fov, 'Zoom-out button must widen the first-person FOV');
  assertFixedEye(start, buttonOut, 'Zoom-out button');
  tests.push({ action: 'button-out', beforeFov: buttonIn.camera.fov, afterFov: buttonOut.camera.fov });

  if (touch) {
    const point = await canvasPoint(page, 55);
    const makePoints = span => [
      { x: point.x - span / 2, y: point.y, radiusX: 2, radiusY: 2, force: 1, id: 2 },
      { x: point.x + span / 2, y: point.y, radiusX: 2, radiusY: 2, force: 1, id: 3 },
    ];
    let before = await snapshot(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: makePoints(45) });
    for (const span of [60, 80, 110]) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: makePoints(span) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await frames(page, 3);
    let after = await snapshot(page);
    assert(after.camera.fov < before.camera.fov, 'Two-finger spread must zoom in');
    assertFixedEye(before, after, 'Pinch spread');
    tests.push({ action: 'touch-spread', beforeFov: before.camera.fov, afterFov: after.camera.fov });
    before = after;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: makePoints(110) });
    for (const span of [85, 60, 40]) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: makePoints(span) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await frames(page, 3);
    after = await snapshot(page);
    assert(after.camera.fov > before.camera.fov, 'Two-finger pinch must zoom out');
    assertFixedEye(before, after, 'Pinch contraction');
    tests.push({ action: 'touch-pinch', beforeFov: before.camera.fov, afterFov: after.camera.fov });
  } else {
    const point = await canvasPoint(page);
    await page.mouse.move(point.x, point.y);
    let before = await snapshot(page);
    await page.mouse.wheel(0, -240);
    await frames(page, 3);
    let after = await snapshot(page);
    assert(after.camera.fov < before.camera.fov, 'Mouse wheel up must zoom in');
    assertFixedEye(before, after, 'Wheel in');
    tests.push({ action: 'wheel-in', beforeFov: before.camera.fov, afterFov: after.camera.fov });
    before = after;
    await page.mouse.wheel(0, 480);
    await frames(page, 3);
    after = await snapshot(page);
    assert(after.camera.fov > before.camera.fov, 'Mouse wheel down must zoom out');
    assertFixedEye(before, after, 'Wheel out');
    tests.push({ action: 'wheel-out', beforeFov: before.camera.fov, afterFov: after.camera.fov });
  }
  const afterZoom = await snapshot(page);
  assert(afterZoom.camera.fov >= 35 && afterZoom.camera.fov <= 90, 'First-person FOV must stay within supported limits');
  const movement = await joystickHold(page, gesture, 0, -.3, { sampleCount: 2 });
  return { tests, movementAfterZoom: movement, fixedEyes: true };
}
async function loadMap(page) {
  await page.goto(`${baseUrl}/miniapp/map`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.__miaoMapDiagnostics === 'function' && window.__miaoMapDiagnostics().modelReady && !document.querySelector('.find-lusheng')?.disabled, undefined, { timeout: 90000 });
  await frames(page, 4);
}

async function resetToPlaza(page, mode) {
  await page.locator('.find-lusheng').click();
  await page.getByRole('button', { name: '沿路步行前往', exact: true }).click();
  await page.waitForFunction(() => window.__miaoMapDiagnostics().routeLength === 0, undefined, { timeout: 30000 });
  await frames(page, 2);
  await page.getByRole('button', { name: mode === 'first-person' ? '🎥 第一人称' : '🗺️ 宏观全景', exact: true }).click();
  await frames(page, 2);
}
async function verifyDevice(browser, { name, width, height, touch }) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  await page.addInitScript(() => { window.__qaPointerLog = []; for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'touchstart', 'touchmove', 'touchend']) document.addEventListener(type, event => { window.__qaPointerLog.push({ type, pointerType: event.pointerType, pointerId: event.pointerId, target: event.target.tagName, className: event.target.className, x: event.clientX, y: event.clientY, prevented: event.defaultPrevented, touches: event.touches?.length }); if (window.__qaPointerLog.length > 40) window.__qaPointerLog.shift(); }, true); });
  page.on('pageerror', error => report.errors.push({ device: name, message: error.message }));
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) console.log(name, 'navigation', frame.url()); });
  const cdp = await context.newCDPSession(page);
  const gesture = gestures(page, cdp, touch);
  const results = report.devices.find(device => device.name === name) || { name, width, height, input: touch ? 'touch' : 'mouse', movements: [], screenshots: [] };
  if (!report.devices.includes(results)) report.devices.push(results);
  if (results.status === 'passed') return context.close();
  delete results.failure; results.status = 'running';
  try {
    await loadMap(page);
    await page.getByRole('button', { name: '🎥 第一人称', exact: true }).waitFor({ state: 'visible' });
    assert(await page.getByRole('button', { name: /追随视角/ }).count() === 0, 'Old follow-view label must be removed');
    const layout = await page.evaluate(() => {
      const box = document.querySelector('.virtual-joystick-zone').getBoundingClientRect();
      return { x: box.x, y: box.y, right: box.right, bottom: box.bottom, width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth };
    });
    assert(layout.x >= 0 && layout.right < layout.width * .5 && layout.y > layout.height * .5 && layout.bottom <= layout.height && layout.scrollWidth <= layout.width + 1, 'Joystick must remain accessible at bottom left without horizontal overflow');
    results.layout = layout;
    const overview = path.join(outputDir, `${name}-controls-overview.png`);
    await page.screenshot({ path: overview });
    results.screenshots.push(overview);

    for (const mode of ['panoramic', 'first-person']) {
      for (const degrees of process.env.MIAO_QA_SMOKE ? [0, 90] : [0, 45, 90, 135, 180, 225, 270, 315]) {
        if (results.movements.some(value => value.mode === mode && value.requestedHeading === degrees && value.appliedAlignment > .97)) continue;
        await resetToPlaza(page, mode);
        await faceHeading(page, gesture, degrees * Math.PI / 180, mode);
        const result = await joystickHold(page, gesture, 0, -1);
        results.movements.push({ mode, requestedHeading: degrees, ...result });
        saveReport();
        console.log(`${name} ${mode} ${degrees}° up: requested=${result.requestedAlignment} actual=${result.appliedAlignment}`);
        if (mode === 'first-person' && degrees === 90) {
          const screenshot = path.join(outputDir, `${name}-controls-first-person.png`);
          await page.screenshot({ path: screenshot });
          results.screenshots.push(screenshot);
        }

        saveReport();
      }
    }

    // A direction change leaves avatar facing from the preceding input. Up must
    // still follow the displayed map, and movement must not steer the FP camera.
    await loadMap(page);
    await page.getByRole('button', { name: '🎥 第一人称', exact: true }).click();
    await frames(page, 3);
    results.movements.push({ mode: 'first-person', case: 'strafe', ...await joystickHold(page, gesture, 1, 0, { sampleCount: 3 }) });
    results.movements.push({ mode: 'first-person', case: 'up-after-strafe', ...await joystickHold(page, gesture, 0, -1, { sampleCount: 3 }) });
    results.movements.push({ mode: 'first-person', case: touch ? 'pointercancel' : 'window-blur', ...await joystickHold(page, gesture, -.3, 0, { cancel: true, sampleCount: 2 }) });
    await resetToPlaza(page, 'first-person');
    results.movements.push({ mode: 'first-person', case: 'plaza-diagonal', ...await joystickHold(page, gesture, .7, -.7, { sampleCount: 3 }) });
    await resetToPlaza(page, 'first-person');
    await dragCanvas(page, gesture, 0, -90);
    results.movements.push({ mode: 'first-person', case: 'pitched-camera-up', ...await joystickHold(page, gesture, 0, -.3, { sampleCount: 2 }) });
    await page.getByRole('button', { name: '🗺️ 宏观全景', exact: true }).click();
    await frames(page, 4);
    assert((await snapshot(page)).mode === 'panoramic' && (await snapshot(page)).avatar.visible, 'Leaving first-person must restore avatar and overview camera');
    await page.getByRole('button', { name: '📸 拍照打卡', exact: true }).click();
    await frames(page, 4);
    assert((await snapshot(page)).mode === 'photo' && (await snapshot(page)).avatar.visible, 'Photo mode must restore avatar visibility');
    await page.getByRole('button', { name: '🎥 第一人称', exact: true }).click();
    await frames(page, 4);
    assert((await snapshot(page)).mode === 'first-person' && !(await snapshot(page)).avatar.visible, 'Re-entering first-person must hide avatar');
    const switchingBase = await page.locator('.joystick-base').boundingBox();
    const switchingX = switchingBase.x + switchingBase.width / 2;
    const switchingY = switchingBase.y + switchingBase.height / 2;
    await gesture.start(switchingX, switchingY);
    await gesture.move(switchingX, switchingY - switchingBase.width * .4, 1);
    await frames(page, 2);
    assert((await snapshot(page)).input.active, 'Mode-cancellation test must begin with a held joystick');
    await page.getByRole('button', { name: '🗺️ 宏观全景', exact: true }).focus();
    await page.keyboard.press('Enter');
    await frames(page, 3);
    assert(!(await snapshot(page)).input.active, 'Changing camera mode must cancel held joystick input');
    await gesture.end();
    await frames(page, 3);
    results.heldInputModeSwitch = 'passed';
    results.zoom = await verifyZoom(page, cdp, gesture, touch);
    results.modeTransitions = 'panoramic → first-person → panoramic → photo → first-person passed';
    results.status = 'passed';
    results.screenshots = [...new Set(results.screenshots)];
    saveReport();
    console.log(name, 'functional, zoom, cancellation, and mode-transition checks passed');
  } catch (error) {
    results.status = 'failed';
    results.failure = error.stack;
    await page.screenshot({ path: path.join(outputDir, `${name}-controls-failure.png`) }).catch(() => {});
    throw error;
  } finally { await context.close(); }
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-webgl'] });
  try {
    const devices = [{ name: 'desktop', width: 1440, height: 1000, touch: false }, { name: 'mobile', width: 430, height: 932, touch: true }];
    for (const device of process.env.MIAO_QA_SMOKE ? devices.slice(0, 1) : devices) await verifyDevice(browser, device);
    const requiredHeadings = process.env.MIAO_QA_SMOKE ? [0, 90] : [0, 45, 90, 135, 180, 225, 270, 315];
    const requiredDevices = process.env.MIAO_QA_SMOKE ? ['desktop'] : ['desktop', 'mobile'];
    for (const deviceName of requiredDevices) {
      const device = report.devices.find(value => value.name === deviceName);
      assert(device?.status === 'passed' && !device.failure, `${deviceName}: a completed result without a stale failure is required`);
      for (const mode of ['panoramic', 'first-person']) {
        const actual = new Set(device.movements.filter(value => value.mode === mode && value.appliedAlignment > .97 && value.requestedAlignment > .985 && value.stopped).map(value => value.requestedHeading).filter(Number.isFinite));
        assert(requiredHeadings.every(value => actual.has(value)) && actual.size === requiredHeadings.length, `${deviceName} ${mode}: incomplete heading coverage`);
      }
      const zoomActions = new Set(device.zoom?.tests.map(value => value.action));
      for (const action of deviceName === 'mobile' ? ['button-in', 'button-out', 'touch-spread', 'touch-pinch'] : ['button-in', 'button-out', 'wheel-in', 'wheel-out']) assert(zoomActions.has(action), `${deviceName}: missing zoom action ${action}`);
      assert(device.zoom.fixedEyes && device.zoom.movementAfterZoom.appliedAlignment > .97 && device.heldInputModeSwitch === 'passed', `${deviceName}: zoom/mode-switch regressions incomplete`);
    }
    report.coverage = { devices: requiredDevices, modes: ['panoramic', 'first-person'], headings: requiredHeadings, totalHeadingCases: requiredDevices.length * 2 * requiredHeadings.length, complete: true };
    assert(!report.errors.length, `Browser errors: ${JSON.stringify(report.errors)}`);
    report.status = 'passed'; report.finishedAt = new Date().toISOString();
  } catch (error) { report.status = 'failed'; report.failure = error.stack; throw error; }
  finally {
    fs.writeFileSync(path.join(outputDir, 'controls-verification.json'), JSON.stringify(report, null, 2));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });














