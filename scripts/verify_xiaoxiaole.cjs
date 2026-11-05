const { chromium } = require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = 'output/xiaoxiaole';
fs.mkdirSync(out, { recursive: true });
const base = process.env.GAME_TEST_URL || 'http://127.0.0.1:5177';
const cells = page => page.locator('.tile');
const at = (page, p) => page.locator(`.tile[data-r="${p[0]}"][data-c="${p[1]}"]`);
const state = page => page.evaluate(() => ({
  values: [...document.querySelectorAll('.tile')].map(b => +b.dataset.value),
  moves: +document.querySelector('#moves').textContent,
  score: +document.querySelector('#score').textContent,
  count: document.querySelectorAll('.tile').length,
  busy: document.querySelector('#board').getAttribute('aria-busy'),
}));
const settled = page => page.waitForFunction(() => document.querySelector('#board').getAttribute('aria-busy') === 'false');
const hint = async page => {
  await page.locator('#hint').click();
  return page.locator('.tile.hint').evaluateAll(els => els.map(b => [+b.dataset.r, +b.dataset.c]));
};
async function play(page, swipe = false) {
  const pair = await hint(page);
  assert.equal(pair.length, 2);
  if (swipe) {
    const a = await at(page, pair[0]).boundingBox(), b = await at(page, pair[1]).boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 5 }); await page.mouse.up();
  } else {
    await at(page, pair[0]).click(); await at(page, pair[1]).click();
  }
  await settled(page);
}
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const results = [], errors = [];
  results.push = function(message) { console.log(message); return Array.prototype.push.call(this, message); };
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(10000);
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(`${base}/games/xiaoxiaole/index.html`);
    await page.locator('[data-pick="medium"]').click();
    assert.equal(await cells(page).count(), 49);
    const initial = await state(page);
    await page.locator('#help').click(); await page.locator('#resume').click();
    assert.deepEqual(await state(page), initial);
    results.push('Help preserves board, moves and score');
    // Find an invalid adjacent exchange using the engine, without modifying live game state.
    const invalid = await page.evaluate(async () => {
      const { findMatches, swap } = await import('./engine.js');
      const values = [...document.querySelectorAll('.tile')].map(b => +b.dataset.value);
      const n = Math.sqrt(values.length), grid = Array.from({ length: n }, (_, r) => values.slice(r*n, (r+1)*n));
      for (let r=0;r<n;r++) for(let c=0;c<n-1;c++) {
        const pair=[[r,c],[r,c+1]]; swap(grid,...pair); const hits=findMatches(grid); swap(grid,...pair);
        if(!hits.length) return pair;
      }
    });
    await at(page, invalid[0]).click(); await at(page, invalid[1]).click(); await settled(page);
    assert.deepEqual(await state(page), initial);
    results.push('Invalid exchange restores tiles without spending a move');
    await play(page);
    assert.equal((await state(page)).moves, initial.moves - 1);
    assert.ok((await state(page)).score >= 30);
    const touchPair = await hint(page);
    const ta = await at(page, touchPair[0]).boundingBox(), tb = await at(page, touchPair[1]).boundingBox();
    const touchBefore = await state(page), cdp = await page.context().newCDPSession(page);
    const touch = async (type, box) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: box ? [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] : [] });
    await touch('touchStart', ta); await touch('touchMove', tb); await touch('touchEnd');
    await settled(page);
    assert.equal((await state(page)).moves, touchBefore.moves - 1);
    await cdp.detach();
    results.push('Native touch swipe completes a match without scrolling the board');
    const beforeSwipe = await state(page);
    await play(page, true);
    assert.equal((await state(page)).moves, beforeSwipe.moves - 1);
    results.push('Click and pointer swipe each spend exactly one move, including cascades');
    await page.locator('#restart').click();
    const pair = await hint(page);
    await at(page, pair[0]).click(); await at(page, pair[1]).click();
    await page.waitForSelector('.tile.pop');
    await page.locator('[data-level="hard"]').click();
    const restarted = await state(page);
    await page.waitForTimeout(1000);
    assert.deepEqual(await state(page), restarted);
    assert.equal(restarted.count, 64); assert.equal(restarted.moves, 18); assert.equal(restarted.score, 0);
    await play(page);
    results.push('Difficulty change during removal cancels the old cascade; new board remains playable');
    await page.locator('#restart').click();
    const resetPair = await hint(page);
    await at(page, resetPair[0]).click(); await at(page, resetPair[1]).click();
    await page.locator('#restart').click();
    const resetState = await state(page); await page.waitForTimeout(800);
    assert.deepEqual(await state(page), resetState);
    results.push('Restart during swap cancels delayed work and resets busy state');
    await page.locator('#theme').selectOption('indigo');
    const beforeShuffle = await state(page);
    await page.locator('#shuffle').click(); await page.locator('#shuffle').click();
    assert.equal(await page.locator('#shuffle').isDisabled(), true);
    assert.equal((await state(page)).moves, beforeShuffle.moves);
    assert.equal((await state(page)).score, beforeShuffle.score);
    results.push('Theme switching and two free manual shuffles work');
    await page.locator('#collection').click();
    assert.equal(await page.locator('.collection-item').count(), 21);
    await page.locator('#resume').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.querySelectorAll('.collection-item img')].every(i => i.complete && i.naturalWidth > 0));
    await page.screenshot({ path: `${out}/collection.png` });
    await page.locator('#resume').click();
    results.push('All 21 catalog images load');
    await cells(page).first().focus(); await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.c), '1');
    await page.keyboard.press('Space'); assert.equal(await page.locator('.tile.selected').count(), 1);
    results.push('Keyboard navigation and selection work');
    await page.locator('[data-level="easy"]').click();
    let turns = 0;
    while (!(await page.locator('#overlay').evaluate(el => el.open)) && turns++ < 24) await play(page);
    assert.equal(await page.locator('#overlay').evaluate(el => el.open), true);
    assert.match(await page.locator('#dialog-title').textContent(), /苗乡欢喜|再试一次/);
    await page.locator('#again').click(); assert.equal((await state(page)).moves, 24);
    results.push('Full round reaches a result and can restart');
    for (const [name, width, height] of [['phone',390,844],['small-phone',320,568],['short-phone',320,480],['landscape',844,390],['desktop',1280,900]]) {
      await page.setViewportSize({ width, height });
      await page.locator('[data-level="hard"]').click();
      await page.locator('#theme').selectOption('indigo');
      const layout = await page.evaluate(() => {
        const game=document.querySelector('#game'), board=document.querySelector('#board').getBoundingClientRect();
        return { viewport: innerWidth, document: document.documentElement.scrollWidth, width:game.clientWidth, content:game.scrollWidth, boardWidth:board.width };
      });
      assert.ok(layout.document <= layout.viewport && layout.content <= layout.width);
      assert.ok(layout.boardWidth > 250);
      await page.locator('#restart').scrollIntoViewIfNeeded();
      const box = await page.locator('#restart').boundingBox(); assert.ok(box.y >= 0 && box.y + box.height <= height + 1);
      await page.locator('#game').evaluate(el => el.scrollTop = 0);
      await page.screenshot({ path: `${out}/${name}.png` });
      results.push(`${name}: no horizontal overflow, restart reachable`);
    }
    // Verify both existing iframe entry points still load the game.
    for (const route of ['/games/xiaoxiaole','/miniapp/games/xiaoxiaole']) {
      await page.goto(base + route);
      const frame = page.frameLocator('iframe[src="/games/xiaoxiaole/index.html"]');
      await frame.locator('[data-pick="medium"]').click();
      assert.equal(await frame.locator('.tile').count(), 49);
      results.push(`${route}: embedded game loads`);
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(`${out}/verification.json`, JSON.stringify({ results, errors }, null, 2));
    console.log(JSON.stringify({ results, errors }, null, 2));
  } catch(error) { console.error(error); process.exitCode=1; }
  finally { await browser.close(); }
})();
