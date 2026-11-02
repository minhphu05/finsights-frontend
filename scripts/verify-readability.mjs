import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
const base='http://127.0.0.1:57610';
const root=path.resolve('../.impeccable/review');
const results=[];
async function contrast(selector,pseudo=null){
  const v=await page.locator(selector).first().evaluate((el,pseudo)=>{
    const style=getComputedStyle(el,pseudo),fg=style.color;let current=el,bg='';
    while(current){const c=getComputedStyle(current).backgroundColor;if(c!=='rgba(0, 0, 0, 0)'&&c!=='transparent'){bg=c;break}current=current.parentElement}
    return {fg,bg:bg||'rgb(255,255,255)',font:style.fontSize};
  },pseudo);
  function lum(color){const c=color.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return c[0]*.2126+c[1]*.7152+c[2]*.0722}
  const a=lum(v.fg),b=lum(v.bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  assert.ok(ratio>=4.5,`${selector}: ${ratio}`);results.push({selector,...v,ratio:Number(ratio.toFixed(2))});
}
try{
  await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  for(const sel of ['.page-heading p','.chart-y-axis','.chart-x-axis','.table-company strong>small','.footer-bottom'])await contrast(sel);
  await contrast('.small-search input','::placeholder');
  for(const [width,route,name] of [[360,'/','chart-index-360.png'],[390,'/?ma=FPT','chart-fpt-mobile.png']]){
    await page.setViewportSize({width,height:844});await page.goto(base+route,{waitUntil:'networkidle'});
    const plot=page.locator('.chart-plot');await plot.scrollIntoViewIfNeeded();const box=await plot.boundingBox();await page.mouse.move(box.x+box.width*.62,box.y+box.height*.45);
    assert.equal(await page.locator('.chart-tooltip').count(),1);
    assert.equal(await page.locator('.chart-y-axis').evaluate(el=>getComputedStyle(el).fontSize),'10px');
    const bounds=await page.locator('.chart-tooltip').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width);
    await page.locator('.chart-panel').screenshot({path:path.join(root,name)});
  }
  await page.goto(base+'/tin-tuc/dong-tien-ngan-hang/',{waitUntil:'networkidle'});
  for(const sel of ['.article-deck','.article-body figcaption','.prose .article-demo-note','.article-byline small'])await contrast(sel);
  for(const sel of ['.brand','.brand-small']){
    const m=await page.locator(sel).first().evaluate(el=>{const s=getComputedStyle(el);return {font:parseFloat(s.fontSize),tracking:parseFloat(s.letterSpacing)}});
    assert.ok(m.tracking/m.font>=-.04001);
  }
  await writeFile(path.join(root,'readability.json'),JSON.stringify({passed:true,results},null,2));
  console.log(JSON.stringify({passed:true,contrast:results},null,2));
}finally{await browser.close()}
