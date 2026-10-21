import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:430,height:920},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
try{
 await page.goto('http://127.0.0.1:5173',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#lobby .kami-lobby-shortcuts');
 await page.evaluate(()=>window.eval("show('lobby')"));
 const shortcuts=page.locator('#lobby .kami-shortcut');
 assert.equal(await shortcuts.count(),6);
 const races=await page.locator('#lobby .kami-race-standards span').allTextContents();
 assert.deepEqual(races,['Kairakh','Elfos','Kijins','Vampiros','Insectoides','Reptro']);
 const sheets=[['Personajes','dormModal'],['Invocación','sanctModal'],['Almacén','storeModal'],['Misiones','portalModal'],['Habitaciones','dormModal'],['Formación','portalModal']];
 for(const [name,modal] of sheets){
  const button=page.locator('#lobby .kami-shortcut').filter({hasText:name});
  await button.click();
  const visible=await page.locator('#'+modal).evaluate(el=>getComputedStyle(el).display!=='none'&&el.classList.contains('show'));
  assert.ok(visible,name+' no abre '+modal);
  await page.evaluate(key=>window.eval('closeModal('+JSON.stringify(key)+')'),modal);
 }
 const checks=await page.evaluate(()=>({
  premium:document.querySelector('#lobby')?.dataset.kamiPremium,
  stylesheet:[...document.styleSheets].some(x=>x.href?.includes('kami-premium-lobby.css')),
  style:getComputedStyle(document.querySelector('#lobby .kami-shortcut')).borderColor,
  missionPresets:!!document.getElementById('kamiPresetBox'),
  formation:!!document.getElementById('kamiFormationPicker')
 }));
 assert.equal(checks.premium,'1');assert.ok(checks.stylesheet);
 assert.ok(checks.missionPresets&&checks.formation,'Se ha perdido el menú de formaciones');
 assert.deepEqual(errors,[]);
 console.log('✅ E2E lobby premium: seis accesos, seis razas, menús navegables y formaciones conservadas');
}finally{await browser.close()}
