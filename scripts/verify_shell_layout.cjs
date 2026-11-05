const { chromium } = require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve('output/layout-fix');
fs.mkdirSync(out, { recursive: true });
const phase = process.argv[2] || 'fixed';
const only = process.argv[3];
const sizes = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'short-desktop', width: 1024, height: 700 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
];
const near = (a, b) => Math.abs(a - b) <= 1;
const sameFrame = (a, b) => ['x', 'y', 'width', 'height'].every(k => near(a[k], b[k]));
function rect(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect(), s = getComputedStyle(el);
  return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom,
    scrollTop: el.scrollTop, scrollLeft: el.scrollLeft, scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
    overflowY: s.overflowY, position: s.position };
}
async function measure(page) {
  return page.evaluate(`(() => {
    const rect = ${rect.toString()};
    const selectors = { intro: '.intro-screen', frame: '.mini-program', nav: '.navigation-bar',
      content: '.page-content', tabs: '.tab-bar', heritage: '.culture-explore',
      catalog: '.heritage-catalog', sheet: '.heritage-story-sheet', modal: '.heritage-story-modal',
      storyBody: '.story-body', source: '.story-source', close: '.story-close' };
    return { url: location.pathname, windowY: scrollY, documentHeight: document.documentElement.scrollHeight,
      documentWidth: document.documentElement.scrollWidth, viewport: { width: innerWidth, height: innerHeight },
      ...Object.fromEntries(Object.entries(selectors).map(([k, s]) => [k, rect(document.querySelector(s))])) };
  })()`);
}
async function scrollAt(page, selector, amount, touch = false) {
  const b = await page.locator(selector).first().boundingBox();
  if (!b) throw new Error(`Missing scroll target ${selector}`);
  const view = page.viewportSize();
  const bottom = Math.min(b.y + b.height, view.height - 72);
  const x = b.x + b.width * .5;
  if (touch) {
    const session = await page.context().newCDPSession(page);
    const y = bottom - 36;
    const end = Math.max(b.y + 45, y - Math.min(Math.abs(amount), 420));
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let step = 1; step <= 12; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + (end - y) * step / 12 }] });
      await page.waitForTimeout(18);
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.detach();
  } else {
    await page.mouse.move(x, Math.max(b.y + 30, bottom - 70));
    await page.mouse.wheel(0, amount);
  }
  await page.waitForTimeout(450);
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const results = [];
  try {
    for (const size of sizes.filter(size => !only || size.name.includes(only))) {
      const mobile = size.width < 431;
      const context = await browser.newContext({ viewport: { width: size.width, height: size.height },
        isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
      const page = await context.newPage(), errors = [], checks = [];
      const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), ...(detail === undefined ? {} : { detail }) });
      const shot = name => page.screenshot({ path: path.join(out, `${phase}-${size.name}-${name}.png`) });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:5173/heritage', { waitUntil: 'domcontentloaded' });
      await page.locator('.intro-screen').waitFor();
      const intro = await measure(page);
      await shot('intro');
      await page.getByRole('button', { name: '跳过' }).click();
      await page.locator('.mini-program').waitFor();
      const home = await measure(page);
      await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '非遗', exact: true }).click();
      await page.locator('.culture-explore').waitFor();
      await page.evaluate(() => document.fonts.ready);
      const before = await measure(page);
      await shot('heritage-top');
      check('Opening animation and main frame have identical bounds', sameFrame(intro.intro, home.frame) && sameFrame(intro.intro, before.frame));
      check('Opening and main frame fit viewport without document overflow',
        [intro, home, before].every(m => m.documentHeight <= size.height && m.documentWidth <= size.width)
        && before.frame.y >= 0 && before.frame.bottom <= size.height);
      check('Heritage content ends above bottom tabs', before.content.bottom <= before.tabs.y + 1);
      check('Four navigation tabs remain available', await page.locator('.tab-bar .tab-item').count() === 4);
      await scrollAt(page, '.page-content', 1200, mobile);
      const after = await measure(page);
      await shot('heritage-scroll');
      if (!after.content) throw new Error(`${size.name}: page left heritage while scrolling: ${JSON.stringify(after)}`);
      check('Heritage content scrolls within its frame', after.content.scrollTop > 30);
      check('Header and tabs stay stationary during content scroll', sameFrame(before.nav, after.nav) && sameFrame(before.tabs, after.tabs));
      await page.mouse.move(mobile ? size.width / 2 : size.width - 12, mobile ? 25 : size.height / 2);
      await page.mouse.wheel(0, 1600);
      await page.waitForTimeout(200);
      const outsideScroll = await measure(page);
      check('Outer page does not scroll or move the frame', outsideScroll.windowY === 0 && sameFrame(before.frame, outsideScroll.frame));
      check('Tabs remain fully inside viewport', after.tabs.bottom <= size.height && after.tabs.y >= 0);
      if (mobile) {
        const rail = page.locator('.explore-rail').first();
        await rail.scrollIntoViewIfNeeded();
        const railBefore = await measure(page);
        await scrollAt(page, '.explore-rail', 220, true);
        const railAfter = await measure(page);
        check('Vertical touch beginning on a card rail scrolls heritage', railAfter.content.scrollTop > railBefore.content.scrollTop + 30);
      }
      // Real UI navigation brings the first heading back into view; no app state is mutated.
      const viewAll = page.locator('.explore-heading button').first();
      await viewAll.scrollIntoViewIfNeeded();
      await viewAll.click();
      await page.locator('.heritage-catalog').waitFor();
      const catalogStart = await measure(page);
      check('View-all catalog opens at the top', catalogStart.content.scrollTop <= 1);
      await scrollAt(page, '.page-content', 900, mobile);
      const catalogScrolled = await measure(page);
      check('Catalog scroll stays inside stable shell', catalogScrolled.content.scrollTop > 30 && sameFrame(before.frame, catalogScrolled.frame));
      await page.locator('.heritage-list-card').last().click();
      await page.getByRole('dialog').waitFor();
      await page.waitForTimeout(320);
      const opened = await measure(page);
      check('Dialog receives keyboard focus', await page.getByRole('button', { name: '关闭', exact: true }).evaluate(el => el === document.activeElement));
      await page.keyboard.press('Shift+Tab');
      const reverseFocus = await page.evaluate(() => Boolean(document.activeElement?.closest('[role=dialog]')));
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      check('Tab and Shift+Tab stay inside the story dialog', reverseFocus && await page.evaluate(() => Boolean(document.activeElement?.closest('[role=dialog]'))));
      check('Story opens inside visible app frame after catalog scroll', opened.sheet.y >= before.frame.y - 1 && opened.sheet.bottom <= before.frame.bottom + 1);
      check('Story close control is visible and has accessible name', await page.getByRole('button', { name: '关闭', exact: true }).isVisible()
        && opened.close.y >= before.frame.y && opened.close.bottom <= before.frame.bottom);
      await scrollAt(page, '.story-body', 1600, mobile);
      await scrollAt(page, '.story-body', 1600, false);
      const storyScrolled = await measure(page);
      check('Story footer can be reached without clipping', storyScrolled.source.y >= storyScrolled.sheet.y - 1
        && storyScrolled.source.bottom <= storyScrolled.sheet.bottom + 1);
      check('Story scroll leaves background content stationary', near(opened.content.scrollTop, storyScrolled.content.scrollTop) && storyScrolled.windowY === 0);
      await shot('story-scroll');
      await page.getByRole('button', { name: '关闭', exact: true }).click();
      check('Story closes back to catalog', await page.getByRole('dialog').count() === 0 && await page.locator('.heritage-catalog').isVisible());
      check('Dialog returns focus to its story trigger', await page.locator('.heritage-list-card').last().evaluate(el => el === document.activeElement));
      await page.keyboard.press('Enter');
      await page.getByRole('dialog').waitFor();
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      check('Story can be opened and closed from the keyboard', await page.locator('.heritage-list-card').last().evaluate(el => el === document.activeElement));
      await page.getByRole('button', { name: /^返回/ }).click();
      await page.locator('.culture-explore').waitFor();
      check('Catalog back control restores heritage overview', (await measure(page)).content.scrollTop <= 1);
      if (size.name === 'short-desktop') {
        await page.setViewportSize({ width: 1024, height: 520 });
        await page.waitForTimeout(100);
        const resized = await measure(page);
        check('Short-window resize keeps header and tabs inside fixed frame', resized.documentHeight <= 520 && resized.frame.bottom <= 520 && resized.tabs.bottom <= 520 && resized.content.height > 0);
        await shot('resized');
      }
      check('No browser runtime errors', errors.length === 0, errors);
      results.push({ size, checks, intro, home, before, after, outsideScroll, catalogStart, catalogScrolled, opened, storyScrolled, errors });
      fs.writeFileSync(path.join(out, `${phase}-report.json`), JSON.stringify(results, null, 2));
      await context.close();
    }
  } finally { await browser.close(); }
  fs.writeFileSync(path.join(out, `${phase}-report.json`), JSON.stringify(results, null, 2));
  const failed = results.flatMap(r => r.checks.filter(c => !c.pass).map(c => ({ viewport: r.size.name, ...c })));
  console.log(JSON.stringify({ phase, cases: results.length, checks: results.reduce((n, r) => n + r.checks.length, 0), failed }, null, 2));
  if (failed.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
