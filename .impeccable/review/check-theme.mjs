import {chromium} from 'playwright-core';import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:3000',{waitUntil:'networkidle'});
await page.getByRole('button',{name:'Bật chế độ tối',exact:true}).click();
assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'dark');
console.log('dark colors',await page.locator('#thi-truong').evaluate(e=>({bg:getComputedStyle(e).backgroundColor,text:getComputedStyle(e).color})));
await page.reload({waitUntil:'networkidle'});assert.equal(await page.getByRole('button',{name:'Bật chế độ sáng',exact:true}).getAttribute('aria-pressed'),'true');
for(const width of [1440,390,360]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);console.log('responsive',width,'OK');}
await page.locator('#thi-truong').scrollIntoViewIfNeeded();await page.screenshot({path:'.impeccable/review/darkmode-mobile.png'});
await page.getByRole('button',{name:'Bật chế độ sáng',exact:true}).click();assert.equal(await page.evaluate(()=>localStorage.getItem('finsight-theme')),'light');console.log('toggle, persistence, light restore: OK; errors:',errors);assert.deepEqual(errors,[]);await browser.close();
