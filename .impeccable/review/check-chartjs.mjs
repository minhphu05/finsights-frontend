import{chromium}from'playwright-core';import assert from'node:assert/strict';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:3000',{waitUntil:'networkidle'});const canvas=p.locator('#home-chart canvas');await canvas.scrollIntoViewIfNeeded();
assert.equal(await canvas.count(),1);console.log('canvas',await canvas.evaluate(e=>({width:e.width,height:e.height,painted:e.getContext('2d').getImageData(0,0,e.width,e.height).data.some((v,i)=>i%4===3&&v>0)})));
const box=await canvas.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.waitForTimeout(200);assert.equal(await p.locator('#home-chart .pointer-events-none').count(),1);
await p.getByRole('button',{name:'1 tháng',exact:true}).click();await p.getByRole('textbox',{name:'Tìm cổ phiếu trong bảng'}).fill('FPT');await p.locator('#thi-truong table tbody button').first().click();assert.match(await canvas.getAttribute('aria-label'),/FPT/);
await p.getByRole('button',{name:'Bật chế độ tối',exact:true}).click();await canvas.scrollIntoViewIfNeeded();await p.screenshot({path:'.impeccable/review/chartjs-dark.png'});
for(const width of [390,768,1440]){await p.setViewportSize({width,height:900});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.ok((await canvas.boundingBox()).height>=200);}
await p.getByRole('button',{name:'Bật chế độ sáng',exact:true}).click();await p.emulateMedia({reducedMotion:'reduce'});await p.getByRole('button',{name:'1 năm',exact:true}).click();await canvas.scrollIntoViewIfNeeded();await p.screenshot({path:'.impeccable/review/chartjs-light.png'});
console.log('hover, stock/range changes, theme, responsive, reduced motion: OK; errors:',errors);assert.deepEqual(errors,[]);await b.close();
