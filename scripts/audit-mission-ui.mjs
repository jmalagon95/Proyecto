import fs from 'node:fs';
const html=fs.readFileSync('index.html','utf8');
const lookups=['function renderTeam()','function renderFormation()','function drawSquads()','function missionSquads()','function normalizeFormation()',"$('startMission').onclick=","$('portalBtn').onclick=","openModal('portalModal')","id=\"portalModal\"","id=\"kamiFormationPicker\"","id=\"battleField\"","id=\"teamRoster\"","id=\"teamSlots\"","id=\"kamiPresetBox\"","function renderBattle()","function startBattle()","function selectTeam","function save(){","function load()","const battle=","let battle=","function finishBattle(",'function unitDom(', 'function stepLogic('];
for(const term of lookups){
 let pos=0,found=[];
 while((pos=html.indexOf(term,pos))>=0){found.push(pos);pos+=term.length;if(found.length>=8)break;}
 console.log('\n### '+term+' hits='+found.length);
 for(const at of found.slice(0,3))console.log(html.slice(Math.max(0,at-140),Math.min(html.length,at+850)).replace(/\n/g,' ').slice(0,1020));
}


for(const t of ["portalBody.innerHTML","portalBody","$('portalModal').querySelector","/* KAMI_MISSION_EXPERIENCE_V1 */","/* KAMI_MANUAL_FORMATIONS_V1 */","const renderManualTeam=renderTeam","const oldTeamRender=renderTeam","renderTeam=function","function renderTeam(){","function openModal(","openModal=function","portalModal.querySelector",".innerHTML=`<div class="mission"]){
 console.log('@@@ '+t+' position='+html.indexOf(t)+' count='+html.split(t).length);
 const pos=html.indexOf(t);if(pos>=0)console.log(html.slice(Math.max(0,pos-420),pos+1400).replace(/\n/g,' ').slice(0,1800));
}
