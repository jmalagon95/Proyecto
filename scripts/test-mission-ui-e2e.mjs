import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const chrome=process.env.CHROME_BIN||'/usr/bin/google-chrome';
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:430,height:920},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5173',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(1200);
 console.log('STARTUP',JSON.stringify(await page.evaluate(()=>({title:document.title,modal:!!document.querySelector('#expeditionLayout'),editor:!!document.querySelector('#kamiFormationPicker'),scripts:document.scripts.length,body:document.body?.innerText?.slice(0,150)}))));
 console.log('PAGE_ERRORS',JSON.stringify(errors));
 await page.waitForFunction(()=>Boolean(document.querySelector('#expeditionLayout')&&document.querySelector('#kamiFormationPicker')),null,{timeout:4000});
 const before=await page.evaluate(()=>{
  const nodes=['kamiFormationPicker','kamiFormationGrid','kamiFormationHeroes','kamiPresetBox','kamiPresetRows','startMission','teamRoster'];
  return Object.fromEntries(nodes.map(id=>[id,!!document.getElementById(id)]));
 });
 for(const [id,exists] of Object.entries(before))assert.ok(exists,'Falta '+id);
 await page.evaluate(()=>{
  const hero=(id,name,role)=>({id,name,level:1,star:1,currentStar:1,race:'Kairakh',className:'Monarca de la Espada Indómita',role,
    stats:{FUE:4,AGI:4,CON:4,DEF:4,INT:4,VOL:4},hp:32,dead:false,equipment:{},skills:[]});
  window.eval(`state.characters=[${JSON.stringify(hero('test01','Zarek','Tanque'))},${JSON.stringify(hero('test02','Kael','DPS'))}];state.team=['test01','test02'];renderTeam();openModal('portalModal');`);
 });
 await page.locator('[data-formation-hero="test02"]').click();
 await page.locator('[data-formation-lane="0"][data-formation-slot="4"]').click();
 let position=await page.evaluate(()=>window.eval('state.missionPositions.test02'));
 assert.deepEqual(position,{lane:0,slot:4});
 page.once('dialog',dialog=>dialog.accept('Equipo de prueba'));
 await page.locator('[data-save="0"]').click();
 // If prompt already appeared before handler registration, test will timeout; handle dialogs globally.
 const saved=await page.evaluate(()=>window.eval('state.missionPresets[0]'));
 assert.ok(saved?.positions?.test02?.slot===4,'La formación no guarda posiciones');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.evaluate(()=>window.eval('load();renderTeam();openModal("portalModal")'));
 await page.locator('[data-load="0"]').click();
 assert.deepEqual(await page.evaluate(()=>window.eval('state.missionPositions.test02')),{lane:0,slot:4});
 await page.locator('#startMission').click();
 await page.waitForTimeout(2600);
 const battleState=await page.evaluate(()=>{
  const screen=document.querySelector('#battle');
  const slots=[...document.querySelectorAll('#battleField .fighter:not(.enemy)')]
   .map(el=>({lane:el.dataset.lane,unit:el.dataset.unit,top:el.style.top,left:el.style.left}));
  return {active:screen?.classList.contains('on'),heroes:slots.length,slots,
    entries:document.querySelectorAll('#kamiChronicleEntries .entry').length,
    time:document.querySelector('#timer')?.textContent,
    chronicle:document.querySelector('#kamiChronicle')?.textContent?.slice(0,120)};
 });
 console.log('BATTLE_CHECK',JSON.stringify(battleState));
 assert.ok(battleState.active,'No se abrió la pantalla de combate');
 assert.equal(battleState.heroes,2,'No aparecen los dos héroes seleccionados');
 assert.ok(battleState.slots.some(x=>x.lane==='0'),'La posición trasera no se aplicó al combate');
 assert.ok(battleState.entries>=1,'La crónica no avanza segundo a segundo');
 await page.waitForFunction(()=>Boolean(window.KamiBattleFocus&&document.querySelector('#battleField .fighter.enemy')));
 const focusStatus=await page.evaluate(()=>{
   document.querySelector('#battleField .fighter:not(.enemy)')?.click();
   document.querySelector('#battleField .fighter.enemy')?.click();
   return {
     selected:window.KamiBattleFocus?.selected,
     assignments:[...window.KamiBattleFocus.assigned.entries()],
     marked:document.querySelectorAll('#battleField .fighter.kami-focus-marked').length,
     label:document.getElementById('kamiFocusLabel')?.textContent
   };
 });
 console.log('FOCUS_CHECK',JSON.stringify(focusStatus));
 assert.equal(focusStatus.selected,'test01');
 assert.equal(focusStatus.assignments.length,1);
 assert.equal(focusStatus.marked,1);
 await page.locator('#kamiClearFocus').click();
 assert.equal(await page.evaluate(()=>window.KamiBattleFocus.assigned.size),0);

 assert.ok(await page.locator('#kamiResultSummary').count(),'Falta el panel de resultados de daño y MVP');
 assert.ok(await page.locator('#resultRows').count(),'Falta la clasificación de resultado');
 assert.ok(!errors.length,'Errores de ejecución '+errors.join(' | '));
 console.log('✅ E2E Android: menú, dos héroes, ubicación manual, guardado y recuperación de formación');
}finally{await browser.close()}
