import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const evidence = path.resolve('../.impeccable/review');
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [], missing = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.status() >= 400) missing.push(`${response.status()} ${response.url()}`); });
const base = 'http://127.0.0.1:57610';
async function visit(route) { const response = await page.goto(base + route, {waitUntil: 'networkidle'}); assert.equal(response.status(), 200); await page.evaluate(() => document.fonts.ready); }
async function capture(route, name, width, height=1000) {
  await page.setViewportSize({width, height}); await visit(route);
  await page.screenshot({path:path.join(evidence,name),fullPage:true});
  const overflow = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  assert.ok(overflow.scroll <= overflow.width + 1, `${route} overflows at ${width}: ${overflow.scroll}`);
}
try {
  await capture('/', 'desktop.png', 1440);
  await capture('/tin-tuc/', 'news-desktop.png', 1440);
  await capture('/', 'mobile.png', 390, 844);
  await capture('/tin-tuc/', 'news-mobile.png', 390, 844);
  await capture('/tin-tuc/dong-tien-ngan-hang/', 'article-mobile.png', 390, 844);
  for (const width of [360, 768, 1280]) {
    for (const route of ['/', '/tin-tuc/', '/theo-doi/']) {
      await page.setViewportSize({width,height:900}); await visit(route);
      const dimensions=await page.evaluate(()=>[innerWidth,document.documentElement.scrollWidth]);
      assert.ok(dimensions[1]<=dimensions[0]+1,`${route} horizontal overflow at ${width}: ${dimensions[1]}`);
    }
  }
  checks.push('All primary routes fit 360, 390, 768, 1280 and 1440px viewports');
  await page.setViewportSize({width:1440,height:1000}); await visit('/');
  await page.locator('.index-item').nth(1).click();
  assert.match(await page.locator('.chart-instrument').innerText(),/VN30/);
  await page.getByRole('button',{name:'1 tuần',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'1 tuần',exact:true}).getAttribute('aria-pressed'),'true');
  checks.push('Benchmark selection and chart range update');
  const search=page.getByRole('textbox',{name:'Tìm cổ phiếu trong bảng'});
  await search.fill('FPT'); assert.equal(await page.locator('tbody tr').count(),1);
  await page.locator('.table-company').click(); assert.match(await page.locator('.chart-instrument').innerText(),/FPT/);
  await search.fill('no-such-company'); assert.match(await page.locator('.table-empty').innerText(),/Chưa tìm thấy/);
  await page.getByRole('button',{name:'Xóa bộ lọc',exact:true}).click();
  await page.getByRole('button',{name:'Giảm giá',exact:true}).click();
  for(const trend of await page.locator('tbody .change-cell .trend').all()) assert.match(await trend.getAttribute('class'),/negative/);
  await page.locator('.table-tabs button').first().click();
  await page.getByRole('button',{name:'Bộ lọc',exact:true}).click();
  await page.getByLabel('Ngành',{exact:true}).selectOption('Ngân hàng');
  assert.equal(await page.locator('tbody tr').count(),3);
  await page.getByRole('button',{name:'Đặt lại bộ lọc',exact:true}).click();
  await page.getByRole('button',{name:'Giá',exact:true}).click();
  assert.match(await page.locator('tbody tr').first().innerText(),/FPT/);
  await page.getByRole('button',{name:'Thay đổi',exact:true}).click();
  assert.match(await page.locator('tbody tr').first().innerText(),/FPT/);
  await page.getByRole('button',{name:'Trang sau',exact:true}).click();
  assert.equal(await page.locator('.page-number.current').innerText(),'2');
  checks.push('Company search, empty state, loss filter, sector filter, sorting and pagination');
  await visit('/');
  await page.getByRole('button',{name:'Theo dõi VIC',exact:true}).click();
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.getByRole('button',{name:'Bỏ theo dõi VIC',exact:true}).count(),1);
  await visit('/theo-doi/'); assert.match(await page.locator('tbody').innerText(),/VIC/);
  await page.getByRole('button',{name:'Bỏ theo dõi VIC',exact:true}).click();
  checks.push('Watchlist persists across reloads and synchronizes with its own page');
  await page.getByRole('button',{name:'Tìm kiếm cổ phiếu',exact:true}).click();
  await page.getByRole('textbox',{name:'Mã cổ phiếu hoặc tên công ty'}).fill('FPT');
  await page.locator('.search-results>a').first().click();
  await page.waitForURL('**/?ma=FPT');
  assert.match(await page.locator('.chart-instrument').innerText(),/FPT/);
  checks.push('Header search navigates to company chart');
  await visit('/tin-tuc/?ma=FPT');
  assert.match(await page.locator('.feature-copy h2').innerText(),/FPT/);
  await page.locator('.feature-copy h2').click();
  await page.waitForURL('**/tin-tuc/fpt-goc-nhin-cong-nghe/');
  assert.equal(await page.locator('.prose p').count(),4);
  await page.getByRole('link',{name:'Trở lại tin tức',exact:true}).click();
  await page.getByRole('button',{name:'Vĩ mô',exact:true}).click();
  assert.match(await page.locator('.feature-copy h2').innerText(),/Lãi suất/);
  await page.locator('.news-stock-select select').selectOption('BSR');
  assert.equal(await page.locator('.news-no-results').count(),1);
  await page.getByRole('button',{name:'Xem tất cả tin tức',exact:true}).click();
  assert.equal(await page.locator('.news-featured').count(),1);
  checks.push('News company/category filters, full article route, back navigation and no-results recovery');
  await visit('/');
  await page.getByRole('button',{name:'Thêm cổ phiếu theo dõi',exact:true}).click();
  await page.getByRole('textbox',{name:'Tìm mã để theo dõi'}).fill('VRE');
  await page.locator('.add-watch-results button').click();
  await page.getByRole('button',{name:'Đóng thêm cổ phiếu',exact:true}).click();
  await visit('/theo-doi/'); assert.match(await page.locator('tbody').innerText(),/VRE/);
  await page.getByRole('button',{name:'Bỏ theo dõi VRE',exact:true}).click();
  checks.push('Sidebar add-to-watchlist search works');
  assert.deepEqual(errors,[], 'Browser runtime errors'); assert.deepEqual(missing,[], 'Missing assets');
  checks.push('No JavaScript errors or missing assets');
  await writeFile(path.join(evidence,'verification.json'),JSON.stringify({passed:true,checks,errors,missing},null,2));
  console.log(JSON.stringify({passed:true,checks,errors,missing},null,2));
} finally { await browser.close(); }
