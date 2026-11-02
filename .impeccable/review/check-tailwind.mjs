import { chromium } from 'playwright-core';
const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page = await browser.newPage();
const errors=[];page.on('pageerror', e=>errors.push(e.message));
for (const width of [1672,850,390]) {
 await page.setViewportSize({width,height:941});
 await page.goto('http://127.0.0.1:3000',{waitUntil:'networkidle'});
 await page.screenshot({path:`.impeccable/review/tailwind-${width}.png`,fullPage:false});
 console.log(JSON.stringify(await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,heading:getComputedStyle(document.querySelector('h1')).color,button:getComputedStyle(document.querySelector('a.bg-primary')).backgroundColor,font:getComputedStyle(document.querySelector('h1')).fontFamily}))));
}
await page.getByRole('button',{name:'Tìm tin tức'}).click();
await page.locator('#fin-query').fill('FPT');
console.log('search results',await page.locator('#home-search a').count());
await page.getByRole('button',{name:'Trò chuyện với AI'}).first().click();
console.log('dialog',await page.locator('dialog[open]').count());
await page.keyboard.press('Escape');
for (const route of ['/tin-tuc/','/theo-doi/']) {
 await page.goto('http://127.0.0.1:3000'+route,{waitUntil:'networkidle'});
 console.log(route, await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,title:document.title})));
}
console.log('errors',errors);
await browser.close();
