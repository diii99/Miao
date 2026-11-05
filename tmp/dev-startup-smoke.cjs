const { chromium } = require('C:/Users/di/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-webgl'] });
  try {
    const page = await browser.newPage({ viewport: { width: 430, height: 932 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /跳过/ }).click();
    await page.waitForFunction(() => document.querySelector('model-viewer')?.loaded, undefined, { timeout: 60000 });
    await page.getByRole('link', { name: '非遗', exact: true }).click();
    await page.locator('.heritage-shell').waitFor();
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(JSON.stringify({ status: 'passed', url: 'http://127.0.0.1:3000/', intro: true, avatarLoaded: true, navigation: true, browserErrors: errors }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
