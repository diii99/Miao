const { chromium } = require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve('output/phone-layout');
fs.mkdirSync(out, { recursive: true });
const only = process.argv[2];
const loadedMap = process.argv.includes('--loaded-map');
const sizes = [
  { name: 'phone-folded-280', width: 280, height: 653 },
  { name: 'phone-320', width: 320, height: 568 },
  { name: 'phone-360', width: 360, height: 640 },
  { name: 'phone-375', width: 375, height: 667 },
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'phone-412', width: 412, height: 915 },
  { name: 'phone-430', width: 430, height: 932 },
  { name: 'phone-440', width: 440, height: 956 },
  { name: 'phone-480', width: 480, height: 960 },
  { name: 'phone-short', width: 320, height: 480 },
  { name: 'landscape-568', width: 568, height: 320 },
  { name: 'landscape-844', width: 844, height: 390 },
  { name: 'landscape-956', width: 956, height: 440 },
  { name: 'notched-phone', width: 390, height: 844, safe: { top: 47, bottom: 34, left: 0, right: 0 } },
  { name: 'notched-landscape', width: 844, height: 390, safe: { top: 0, bottom: 21, left: 44, right: 44 } },
  { name: 'desktop', width: 1440, height: 1000, desktop: true },
  { name: 'short-desktop', width: 1024, height: 700, desktop: true },
  { name: 'compact-desktop', width: 1024, height: 520, desktop: true },
];
const near = (a, b) => Math.abs(a - b) < 1.5;
const contains = (outer, inner) => outer && inner && inner.x >= outer.x - 1 && inner.y >= outer.y - 1 && inner.right <= outer.right + 1 && inner.bottom <= outer.bottom + 1;
const same = (a, b) => a && b && ['x', 'y', 'width', 'height'].every(key => near(a[key], b[key]));
async function measure(page) {
  return page.evaluate(() => {
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height,
        scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight,
        scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    };
    const selectors = { frame: '.app-frame', nav: '.navigation-bar', content: '.page-content', tabs: '.tab-bar',
      avatar: '.home-avatar-model', guide: '.opening-guide', chat: '.pet-speech', input: '.pet-speech input',
      scene: '.miao-real-scene-container', hud: '.scene-top-hud', tools: '.scene-float-tools', outfits: '.avatar-selector-bar',
      landmarks: '.landmarks-quick-nav', joystick: '.virtual-joystick-zone', sheet: '.heritage-story-sheet', storyBody: '.story-body' };
    return { documentWidth: document.documentElement.scrollWidth, documentHeight: document.documentElement.scrollHeight,
      scrollY, path: location.pathname, tabsList: [...document.querySelectorAll('.tab-bar a')].map(rect),
      ...Object.fromEntries(Object.entries(selectors).map(([name, selector]) => [name, rect(document.querySelector(selector))])) };
  });
}
async function scrollPanel(page, selector) {
  const box = await page.locator(selector).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height - 25, 120));
  await page.mouse.wheel(0, 4000);
  await page.waitForTimeout(180);
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const results = [];
  try {
    for (const size of sizes.filter(size => !only || size.name === only)) {
      const context = await browser.newContext({ viewport: { width: size.width, height: size.height },
        isMobile: !size.desktop, hasTouch: !size.desktop, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      const page = await context.newPage(), checks = [], errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const check = (name, pass, details) => checks.push({ name, pass: Boolean(pass), ...(details === undefined ? {} : { details }) });
      const shot = name => page.screenshot({ path: path.join(out, `${size.name}${loadedMap ? '-loaded' : ''}-${name}.jpg`), type: 'jpeg', quality: 75 });
      const result = { size, checks, routes: {}, errors };
      try {
        await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
        await page.locator('.intro-screen').waitFor();
        if (size.safe) await page.evaluate(safe => Object.entries(safe).forEach(([key, value]) =>
          document.documentElement.style.setProperty(`--app-safe-${key}`, `${value}px`)), size.safe);
        const intro = await measure(page);
        await shot('intro');
        await page.getByRole('button', { name: '跳过' }).click();
        await page.locator('.home-shell').waitFor();
        await page.evaluate(() => document.fonts.ready);
        const home = await measure(page);
        check('Intro and home share frame bounds', same(intro.frame, home.frame));
        check('Phone frame uses all viewport space or desktop frame fits', size.desktop
          ? near(home.frame.width, 430) && home.frame.bottom <= size.height
          : near(home.frame.width, size.width) && near(home.frame.height, size.height) && near(home.frame.y, 0));
        check('Home avatar fits within usable content', contains(home.content, home.avatar));
        check('Opening guide fits within usable content', contains(home.content, home.guide));
        await shot('home');
        for (let step = 0; step < 3; step++) await page.locator('.opening-guide button').click();
        await page.locator('.pet-speech').waitFor();
        await page.locator('.pet-speech input').scrollIntoViewIfNeeded();
        const chat = await measure(page);
        check('Chat and reachable input stay above navigation', contains(chat.content, chat.chat) && contains(chat.content, chat.input));
        check('Home stays stationary when reaching chat input', chat.content.scrollTop === 0 && chat.scrollY === 0);
        await shot('chat');
        await page.locator('.pet-close').scrollIntoViewIfNeeded();
        await page.getByRole('button', { name: '收起对话' }).click();
        for (const route of [{ name: 'home', label: '首页', path: '/' }, { name: 'map', label: '地图', path: '/map' },
          { name: 'heritage', label: '非遗', path: '/heritage' }, { name: 'workshop', label: '体验坊', path: '/workshop' }]) {
          await page.getByRole('navigation', { name: '主导航', exact: true }).getByRole('link', { name: route.label, exact: true }).click();
          await page.waitForURL(`**${route.path}`);
          await page.locator(`.${route.name}-shell`).waitFor();
          if (route.name === 'map') {
            await page.locator('.miao-3d-canvas-viewport canvas').waitFor();
            if (loadedMap) await page.locator('.map-model-status').waitFor({ state: 'hidden', timeout: 90000 });
          }
          await page.waitForTimeout(180);
          const before = await measure(page);
          result.routes[route.name] = before;
          check(`${route.name}: no outer document overflow`, before.documentWidth <= size.width && before.documentHeight <= size.height && before.scrollY === 0);
          check(`${route.name}: four complete tabs stay visible`, before.tabsList.length === 4 && before.tabsList.every(tab => contains(before.frame, tab)));
          check(`${route.name}: usable content ends above tabs`, before.content.height > 0 && near(before.content.bottom, before.tabs.y));
          check(`${route.name}: no horizontal content overflow`, before.content.scrollWidth <= before.content.clientWidth + 1);
          if (route.name === 'map') {
            for (const name of ['hud', 'tools', 'outfits', 'landmarks', 'joystick'])
              check(`Map ${name} remains inside scene`, contains(before.scene, before[name]));
          }
          await shot(route.name);
          if (route.name === 'map' && loadedMap) {
            const overlaps = await page.evaluate(() => {
              const names = ['.scene-top-hud', '.scene-float-tools', '.avatar-selector-bar', '.landmarks-quick-nav', '.virtual-joystick-zone', '.poi-interaction-bubble'];
              const boxes = names.map(name => ({ name, box: document.querySelector(name)?.getBoundingClientRect() })).filter(item => item.box);
              return boxes.flatMap((a, index) => boxes.slice(index + 1).filter(b => Math.min(a.box.right, b.box.right) - Math.max(a.box.left, b.box.left) > 2
                && Math.min(a.box.bottom, b.box.bottom) - Math.max(a.box.top, b.box.top) > 2).map(b => [a.name, b.name]));
            });
            check('Loaded map control groups do not overlap', overlaps.length === 0, overlaps);
            const instrument = page.getByRole('button', { name: /近观苗族芦笙/ });
            if (await instrument.count()) {
              await instrument.scrollIntoViewIfNeeded();
              await instrument.click();
              const dialog = page.getByRole('dialog', { name: '芦笙细节查看' });
              await dialog.waitFor();
              const bounds = await dialog.boundingBox();
              const scene = before.scene;
              check('Instrument overlay fits inside usable map', bounds.x >= scene.x && bounds.y >= scene.y
                && bounds.x + bounds.width <= scene.right && bounds.y + bounds.height <= scene.bottom);
              check('Instrument model stays inside its overlay', await dialog.locator('model-viewer').evaluate(el => {
                const parent = el.parentElement.getBoundingClientRect(), box = el.getBoundingClientRect();
                return box.x >= parent.x && box.right <= parent.right && box.y >= parent.y && box.bottom <= parent.bottom;
              }));
              await shot('instrument');
              await dialog.locator('.lusheng-viewer-close').click();
            }
          }
          if (route.name === 'heritage' && size.safe) {
            await page.locator('.heritage-hero-story').click();
            await page.getByRole('dialog').waitFor();
            await page.waitForTimeout(250);
            const opened = await measure(page);
            const close = await page.getByRole('button', { name: '关闭', exact: true }).boundingBox();
            check('Notched story sheet stays within safe content edges', opened.sheet.x >= before.content.x - 1
              && opened.sheet.right <= before.content.right + 1 && opened.sheet.bottom <= before.tabs.y + 1);
            check('Notched story close remains fully within safe content edges', close.x >= before.content.x
              && close.x + close.width <= before.content.right && close.y >= before.content.y);
            await shot('notched-story');
            await page.getByRole('button', { name: '关闭', exact: true }).click();
          }
          if (route.name === 'heritage' || route.name === 'workshop') {
            await scrollPanel(page, '.page-content');
            const after = await measure(page);
            check(`${route.name}: inner content can scroll when needed`, before.content.scrollHeight <= before.content.clientHeight + 1 || after.content.scrollTop > 10);
            check(`${route.name}: scrolling keeps header and tabs fixed`, same(before.nav, after.nav) && same(before.tabs, after.tabs) && after.scrollY === 0);
            await shot(`${route.name}-scroll`);
          }
        }
        check('No browser runtime errors', errors.length === 0, errors);
      } catch (error) { check('Browser interaction completed', false, error.message); await shot('failure').catch(() => {}); }
      results.push(result);
      fs.writeFileSync(path.join(out, only ? only + (loadedMap ? '-loaded' : '') + '-report.json' : 'report.json'), JSON.stringify(results, null, 2));
      console.log(JSON.stringify({ viewport: size.name, checks: checks.length, failed: checks.filter(check => !check.pass) }));
      await context.close();
    }
  } finally { await browser.close(); }
  const failed = results.flatMap(result => result.checks.filter(check => !check.pass).map(check => ({ viewport: result.size.name, ...check })));
  console.log(JSON.stringify({ cases: results.length, checks: results.reduce((sum, result) => sum + result.checks.length, 0), failed }, null, 2));
  if (failed.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });




