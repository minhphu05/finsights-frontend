import { chromium } from 'playwright-core';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const page=await browser.newPage({viewport:{width:390,height:844}});await page.goto('http://127.0.0.1:3000/');console.log(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,15).map(e=>[e.tagName,e.className,e.getBoundingClientRect().right])));await browser.close();

