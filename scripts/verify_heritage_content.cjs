const { chromium } = require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve('output/heritage-content');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const checks = [], errors = [];
  const check = (name, pass, detail) => checks.push({ name, pass: !!pass, ...(detail ? { detail } : {}) });
  try {
    const context = await browser.newContext({ viewport: { width: 440, height: 956 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/heritage', { waitUntil: 'domcontentloaded' });
    const skip = page.getByRole('button', { name: '跳过' });
    await skip.waitFor();
    await skip.click();
    await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '非遗', exact: true }).click();
    await page.locator('.heritage-library-entry').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(out, 'large-phone-overview.png') });
    const search = page.getByRole('searchbox', { name: '搜索非遗故事' });
    await search.fill('苗绣');
    check('Keyword search returns embroidery', await page.locator('.heritage-list-card').filter({ hasText: '苗绣' }).count() > 0);
    await search.fill('this-will-not-match-12345');
    check('Empty results explain how to recover', await page.getByRole('heading', { name: '还没有找到这个故事' }).isVisible());
    await page.getByRole('button', { name: '浏览全部故事', exact: true }).click();
    const cards = page.locator('.heritage-list-card');
    const count = await cards.count();
    check('Archive contains all 21 stories', count === 21, count);
    await page.getByRole('button', { name: '匠作与服饰', exact: true }).click();
    check('Category filter narrows archive to craft stories', await cards.count() >= 5 && await cards.count() < count);
    check('Selected category is exposed accessibly', await page.getByRole('button', { name: '匠作与服饰', exact: true }).getAttribute('aria-pressed') === 'true');
    await search.fill('丹寨');
    check('Search also finds regions within category', await cards.count() > 0);
    await search.fill('');
    await page.getByRole('button', { name: '全部', exact: true }).click();
    const seen = [];
    for (let i = 0; i < count; i++) {
      await cards.nth(i).click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      const name = await dialog.getAttribute('aria-label');
      seen.push(name);
      const metadata = await dialog.locator('.story-facts').innerText();
      const sources = await dialog.locator('.story-source a').evaluateAll(links => links.map(a => ({ title: a.textContent, href: a.href })));
      check(`${name}: regional facts, narrative sections, observations and sources`, metadata.includes('流传地区') && await dialog.locator('.story-section').count() >= 4 && sources.length >= 1 && sources.every(s => s.href.startsWith('https://') && s.title.trim().length > 4));
      check(`${name}: no horizontal reading overflow`, await dialog.locator('.story-body').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
      await dialog.getByRole('button', { name: '查阅来源 ↗' }).click();
      const end = await dialog.locator('.story-source').evaluate(el => { const r = el.getBoundingClientRect(), p = el.closest('.story-body').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, parentTop: p.top, parentBottom: p.bottom }; });
      check(`${name}: source links reachable inside story scroller`, end.top >= end.parentTop - 1 && end.top < end.parentBottom);
      await dialog.locator('.story-body').evaluate(el => el.scrollTop = el.scrollHeight);
      check(`${name}: final reading note is reachable`, await dialog.locator('.story-image-note').evaluate(el => {
        const note = el.getBoundingClientRect(), panel = el.closest('.story-body').getBoundingClientRect();
        return note.bottom <= panel.bottom + 1 && note.bottom > panel.top;
      }));
      check(`${name}: modal scrolling leaves outer page fixed`, await page.evaluate(() => scrollY === 0));
      if (name.includes('龙船')) {
        const body = await dialog.innerText();
        check('Dragon boat story uses locally correct lunar dates', body.includes('二十四') && body.includes('二十七'));
        await page.screenshot({ path: path.join(out, 'dragon-boat-sources.png') });
      }
      if (name.includes('苗绣')) {
        await dialog.getByRole('button', { name: '文化故事', exact: true }).click();
        await page.screenshot({ path: path.join(out, 'embroidery-story.png') });
      }
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      check(`${name}: closing restores card focus`, await cards.nth(i).evaluate(el => el === document.activeElement));
    }
    await cards.last().click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Shift+Tab');
    check('Reverse tab stays within dialog', await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]')));
    await page.keyboard.press('Tab');
    check('Forward tab stays within dialog', await page.getByRole('button', { name: '关闭', exact: true }).evaluate(el => el === document.activeElement));
    for (const size of [{ width: 320, height: 568 }, { width: 932, height: 430 }]) {
      await page.setViewportSize(size);
      await page.getByRole('button', { name: '查阅来源 ↗' }).click();
      await page.locator('.story-body').evaluate(el => el.scrollTop = el.scrollHeight);
      const fits = await page.evaluate(() => {
        const body = document.querySelector('.story-body'), close = document.querySelector('.story-close').getBoundingClientRect(), sheet = document.querySelector('.heritage-story-sheet').getBoundingClientRect();
        return document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight && body.clientHeight > 50 && body.scrollWidth <= body.clientWidth + 1 && close.top >= 0 && close.bottom <= innerHeight && sheet.bottom <= innerHeight;
      });
      check(`Story fits ${size.width}×${size.height} with close and scrolling available`, fits);
      await page.screenshot({ path: path.join(out, `story-${size.width}x${size.height}.png`) });
    }
    check('No browser runtime errors', errors.length === 0, errors);
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ checks, seen, errors }, null, 2));
    console.log(JSON.stringify({ stories: count, checks: checks.length, failed: checks.filter(c => !c.pass), errors }, null, 2));
    if (checks.some(c => !c.pass)) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
