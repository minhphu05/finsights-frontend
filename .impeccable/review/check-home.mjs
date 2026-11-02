import { chromium } from 'playwright-core';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
for(const width of [1672,390]){
 await page.setViewportSize({width,height:941});
 await page.goto('http://127.0.0.1:3000',{waitUntil:'networkidle'});
 await page.screenshot({path:`.impeccable/review/home-${width}.png`,fullPage:false});
 console.log(JSON.stringify({width,title:await page.title(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),images:await page.locator('.fin-home img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0))}));
}
await page.getByRole('button',{name:'Trò chuyện với AI'}).first().click();
console.log('Dialog opens:',await page.locator('dialog[open]').count());
await page.keyboard.press('Escape');
await page.getByRole('button',{name:'Tìm tin tức'}).click();
await page.locator('#fin-query').fill('FPT');
console.log('Search results:',await page.locator('.fin-search a').count(),'errors:',errors);
await browser.close();
