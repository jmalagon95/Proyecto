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
 await page.waitForFunction(()=>Boolean(window.KamiBattleFocus&&document.getElementById('kamiFocusPanel')&&document.querySelector('#battleField .fighter.enemy:not(.ko)')));
 const focusStatus=await page.evaluate(()=>{
   document.querySelector('#battleField .fighter:not(.enemy)')?.click();
   document.querySelector('#battleField .fighter.enemy:not(.ko)')?.click();
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
 await page.evaluate(()=>document.querySelector('#kamiClearFocus')?.click());
 assert.equal(await page.evaluate(()=>window.KamiBattleFocus.assigned.size),0);

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
 const rigCheck=await page.evaluate(()=>{
  const heroes=[...document.querySelectorAll('#battleField .fighter:not(.enemy)')];
  const opponents=[...document.querySelectorAll('#battleField .fighter.enemy')];
  const all=[...heroes,...opponents];
  return {heroRigs:heroes.filter(u=>u.querySelector('.kami-rig-svg')).length,
    enemyRigs:opponents.filter(u=>u.querySelector('.kami-rig-svg')).length,
    bones:heroes[0]?.querySelectorAll('[data-bone]').length||0,
    allSkeletal:all.every(u=>u.dataset.combatRenderer==='skeletal'),
    skeletonVisible:heroes.every(u=>getComputedStyle(u.querySelector('.kami-rig-svg')).display!=='none'),
    backgroundsHidden:heroes.every(u=>getComputedStyle(u.querySelector('.unit-body')).backgroundImage==='none'),
    spritesHidden:opponents.every(u=>{
      const legacy=u.querySelector('.unit-body > svg:not(.kami-rig-svg)');
      return !legacy||getComputedStyle(legacy).display==='none'
    })};
 });
 console.log('RIG_CHECK',JSON.stringify(rigCheck));
 assert.equal(rigCheck.heroRigs,2,'Los héroes no usan rigs');
 assert.ok(rigCheck.enemyRigs>0,'Los enemigos no usan rigs');
 assert.equal(rigCheck.bones,19);
 const woodSwordCheck=await page.evaluate(()=>{
  const heroes=[...document.querySelectorAll('#battleField .fighter:not(.enemy)')];
  return heroes.map(hero=>({
   skin:hero.querySelector('.kami-rig-svg')?.getAttribute('data-combat-skin'),
   weapons:hero.querySelectorAll('[data-equipped-item="wooden-training-sword"]').length,
   slash:hero.querySelectorAll('[data-wood-strike-arc]').length,
   bones:hero.querySelectorAll('[data-bone]').length
  }));
 });
 console.log('WOOD_SWORD_CHECK',JSON.stringify(woodSwordCheck));
 assert.ok(woodSwordCheck.every(v=>v.skin==='kairakh-star1-wood-sword'&&v.weapons===1&&v.slash===1&&v.bones===19),
   'El sprite Kairakh ★1 o el arma de madera no están unidos al esqueleto');
 assert.ok(rigCheck.allSkeletal&&rigCheck.skeletonVisible&&rigCheck.backgroundsHidden&&rigCheck.spritesHidden,
   'Quedan imágenes estáticas visibles en la batalla');
 const races=await page.evaluate(async()=>{
   const {createRigSvg}=await import('/src/systems/mannequin-rig.js');
   return ['Kairakh','Elfos','Kijins','Vampiros','Insectoides','Reptro'].map(race=>{
     const rig=createRigSvg({character:{race}}).svg;
     return {race,bones:rig.querySelectorAll('[data-bone]').length,features:rig.querySelectorAll('[data-feature]').length}
   })
 });
 assert.ok(races.every(r=>r.bones===19&&r.features>0),'Anatomías raciales incompletas');
 assert.ok(await page.locator('#kamiResultSummary').count(),'Falta el panel de resultados de daño y MVP');
 assert.ok(await page.locator('#resultRows').count(),'Falta la clasificación de resultado');
 assert.ok(!errors.length,'Errores de ejecución '+errors.join(' | '));
 console.log('✅ E2E Android: menú, dos héroes, ubicación manual, guardado y recuperación de formación');
}finally{await browser.close()}
