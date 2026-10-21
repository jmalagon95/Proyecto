import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const file=process.argv.find(x=>x.endsWith('.html'))||path.join(root,'index.html');
const source=fs.readFileSync(file,'utf8');
const tag='<script type="module" src="/src/systems/master-racial-bridge.js"></script>';
const marker='/* KAMI_RACIAL_V4_MASTER_BRIDGE */';
let html=source,edits=0;
function once(oldValue,newValue,label){
 const hits=html.split(oldValue).length-1;
 if(hits!==1)throw Error(label+': se esperaban exactamente 1 ancla, encontradas '+hits+'. No se modifica el maestro.');
 html=html.replace(oldValue,newValue);edits++;
}
if(!html.includes('src="/src/systems/master-racial-bridge.js"')){
 once('</body>',tag+'</body>','Cargar módulo racial');
}
if(!html.includes(marker)){
 // Se inserta en el bucle de batalla existente, no se crea otro simulador paralelo.
 const head='  function stepLogic(dt,animate=true){';
 if(!html.includes(head))throw Error('No se localiza stepLogic original: integración cancelada.');
 const anchor='    battle.elapsed+=dt;battle.timeLeft=';
 once(anchor,`    ${marker}
    if(battle.auto&&window.KamiRacialSkills){
      window.KamiRacialSkills.tick(battle,dt,{
        animate,
        log:msg=>{if(animate)logBattle(msg)},
        announce:(a,target,name,value,kind)=>{
          if(!animate)return;
          if(target?.node){if(kind==='damage')swipe(a,target);
            if(value>0)flyingNumber(target,value,kind==='heal'?'heal':kind==='damage'?(target.enemy?'':'damage-ally'):'heal')}
          if(name)logBattle(a.name+' · '+name);
        }
      });
    }
`+anchor,'Conectar habilidades al bucle');
}
const shieldMarker='/* KAMI_RACIAL_V4_SHIELD */';
if(!html.includes(shieldMarker)){
 const strike='    target.hp=Math.max(0,target.hp-damage);a.damage+=damage;';
 once(strike,`    ${shieldMarker}
    if(!target.enemy&&window.KamiRacialSkills){
      const guard=window.KamiRacialSkills.absorb(target,damage);damage=guard.remaining;
    }
`+strike,'Absorber golpes mediante barreras');
}
// Sincroniza selección racial del HTML monolítico sin reescribir las pantallas.
const catalogMarker='/* KAMI_RACIAL_V4_CLASS_CATALOG */';
if(!html.includes(catalogMarker)){
 const races=JSON.parse(fs.readFileSync(path.join(root,'data/races.json'),'utf8'));
 const classes=JSON.parse(fs.readFileSync(path.join(root,'data/classes.json'),'utf8'));
 const payload=races.map(r=>({
   id:r.id,name:r.name,tag:r.tag,desc:r.description,history:r.history,origin:r.origin,image:r.image,
   classes:(classes[r.id]||[]).map(c=>({name:c.name,weapons:c.weapons,desc:c.description}))
 }));
 if(payload.length!==6||payload.some(r=>r.classes.length<5))throw Error('Catálogo racial inconsistente: maestro intacto.');
 const boot=\`\${catalogMarker}
const KAMI_RACIAL_V4_CATALOG=\${JSON.stringify(payload)};
for(const r of KAMI_RACIAL_V4_CATALOG){
 RACES[r.name]={tag:r.tag,desc:r.desc,history:r.history,origin:r.origin};
 CLASSES[r.name]=r.classes;
 if(!ASSETS[r.name]&&r.image)ASSETS[r.name]=r.image;
}
for(const name of Object.keys(RACES)){
 if(!KAMI_RACIAL_V4_CATALOG.some(r=>r.name===name))delete RACES[name];
}
for(const name of Object.keys(CLASSES)){
 if(!KAMI_RACIAL_V4_CATALOG.some(r=>r.name===name))delete CLASSES[name];
}
\`;
 once('let state=',boot+'let state=','Sincronizar las seis razas y 31 clases raciales');
}
if(html.includes('Math.floor(Math.random()*8)')){
 once('Math.floor(Math.random()*8)','Math.floor(Math.random()*Object.keys(RACES).length)','Gacha: seis razas');
}
if(html.includes('CLASSES[r][Math.floor(Math.random()*5)]')){
 once('CLASSES[r][Math.floor(Math.random()*5)]','CLASSES[r][Math.floor(Math.random()*CLASSES[r].length)]','Gacha: seis clases Kairakh');
}
if(edits&&process.argv.includes('--write')){
 fs.writeFileSync(file,html);
 console.log('✅ Prototipo maestro integrado ('+edits+' modificaciones): '+file);
}else if(edits)console.log('✅ Preparada integración (simulación, sin escritura): '+edits+' modificaciones');
else console.log('✅ El prototipo maestro ya está integrado.');
if(!html.includes(marker)||!html.includes(shieldMarker)||!html.includes(tag)||!html.includes(catalogMarker))throw Error('La integración ha quedado incompleta.');
