import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const width of [1440,768,390]){
 await page.setViewportSize({width,height:1000});await page.goto('http://127.0.0.1:3000',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow ${width}`);
 await page.locator('#thi-truong').scrollIntoViewIfNeeded();await page.screenshot({path:`.impeccable/review/lower-${width}.png`});console.log('responsive',width,'OK');
}
const table=page.locator('#thi-truong table');
await page.getByRole('textbox',{name:'Tìm cổ phiếu trong bảng'}).fill('FPT');assert.equal(await table.locator('tbody tr').count(),1);
await table.locator('tbody tr').getByRole('button').first().click();assert.match(await page.locator('#home-chart').innerText(),/FPT/);
await page.getByRole('textbox',{name:'Tìm cổ phiếu trong bảng'}).fill('zzzz');assert.equal(await table.locator('tbody tr').count(),0);
await page.getByRole('button',{name:'Xóa bộ lọc',exact:true}).click();assert.equal(await table.locator('tbody tr').count(),6);
await page.getByRole('button',{name:'Bộ lọc',exact:true}).click();await page.getByRole('combobox',{name:'Ngành',exact:true}).selectOption('Công nghệ');assert.equal(await table.locator('tbody tr').count()>0,true);
await page.getByRole('button',{name:'Đặt lại bộ lọc',exact:true}).click();
await page.getByRole('button',{name:'Trang sau',exact:true}).click();assert.equal(await page.locator('button[aria-current="page"]').innerText(),'2');
await page.getByRole('button',{name:'1 tháng',exact:true}).click();assert.equal(await page.getByRole('button',{name:'1 tháng',exact:true}).getAttribute('aria-pressed'),'true');
await page.getByRole('button',{name:'Thêm cổ phiếu theo dõi'}).click();await page.getByRole('textbox',{name:'Tìm mã để theo dõi'}).fill('FPT');
console.log('search, select, empty state, filters, pagination, chart range, watch search: OK');console.log('browser errors',errors);assert.deepEqual(errors,[]);await browser.close();
