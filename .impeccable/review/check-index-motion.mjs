import {chromium} from 'playwright-core';import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:3000',{waitUntil:'networkidle'});const group=p.getByLabel('Các chỉ số thị trường',{exact:true});await group.scrollIntoViewIfNeeded();
const buttons=group.locator('button');const indicator=group.locator(':scope > span');
await buttons.nth(1).click();assert.ok(await indicator.evaluate(e=>e.getAnimations().length)>0);await p.waitForTimeout(650);
async function aligned(){const a=await indicator.boundingBox();const c=await group.locator('button[aria-pressed="true"]').boundingBox();assert.ok(Math.abs(a.x-c.x)<2&&Math.abs(a.y-c.y)<2);}
await aligned();await buttons.nth(3).click();await p.waitForTimeout(80);await buttons.nth(0).click();await p.waitForTimeout(650);await aligned();
await p.setViewportSize({width:390,height:844});await buttons.nth(3).click();await p.waitForTimeout(650);await aligned();assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await p.emulateMedia({reducedMotion:'reduce'});await buttons.nth(1).click();assert.equal(await indicator.evaluate(e=>e.getAnimations().filter(a=>a.playState==='running').length),0);await aligned();console.log('slide animation, rapid switching, mobile alignment, reduced motion OK; errors:',errors);assert.deepEqual(errors,[]);await b.close();
