import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const classes=JSON.parse(fs.readFileSync(path.join(ROOT,'data/classes.json'),'utf8'));
const targets=JSON.parse(fs.readFileSync(path.join(ROOT,'data/content_targets.json'),'utf8'));
const outDir=path.join(ROOT,'data/generated');
const skillsDir=path.join(outDir,'skills');
fs.mkdirSync(skillsDir,{recursive:true});

const ranks=targets.ranks;
const rankIndex=Object.fromEntries(ranks.map((r,i)=>[r,i]));
const classEntries=[];
for(const [group,list] of Object.entries(classes)){
  for(const c of list) classEntries.push({...c,group});
}

function slug(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function hash32(str){
  let h=2166136261>>>0;
  for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}
  return h>>>0;
}
function rng(seed){let x=hash32(seed)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}}
function pick(arr,r){return arr[Math.floor(r()*arr.length)]}
function rankForIndex(i,counts){
  let acc=0;
  for(const rank of ranks){acc+=counts[rank]||0;if(i<acc)return rank}
  return ranks[ranks.length-1];
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function statForRole(role){
  const s=role.toLowerCase();
  if(/mago|mágico|magico|invoc|apoyo|sanación|sanacion/.test(s)) return 'INT';
  if(/ranger|móvil|movil|asesino|duelista|cazador/.test(s)) return 'AGI';
  if(/defensor|tanque|bastión|bastion/.test(s)) return 'DEF';
  return 'FUE';
}

const prefixes=['Pulso','Marca','Instinto','Juramento','Eco','Disciplina','Dominio','Ritmo','Sello','Vínculo','Filo','Temple','Paso','Nexo','Aura','Mirada','Corazón','Trama','Runa','Legado','Vigilia','Manto','Pacto','Voz'];
const nouns=['Aurora','Abismo','Coloso','Cometa','Corona','Tormenta','Bastión','Eclipse','Horizonte','Marea','Dragón','Cazador','Reino','Ceniza','Luna','Sol','Titán','Cuervo','Runa Viva','Colmena','Vacío','Trueno','Bosque','Sangre','Acero','Cristal','Tempestad','Estrella'];
const suffixes=['Ascendente','Quebrado','Imperial','Ancestral','Silente','Primordial','Errante','Soberano','Umbrío','Radiante','Tenaz','Velado','Eterno','Fugaz','Marcial','Indomable'];

const skillVerbs=['Corte','Estocada','Embate','Descarga','Ráfaga','Lanza','Paso','Golpe','Sello','Pulso','Marea','Vínculo','Danza','Clamor','Impacto','Disparo','Ruptura','Barrido','Guardia','Invocación'];
const skillForms=['del Alba','del Eclipse','de la Tempestad','del Bastión','del Vacío','de la Corona','del Coloso','de la Luna','del Sol','del Abismo','de la Marea Roja','del Reino Perdido','del Cometa','de la Colmena','del Trueno','del Horizonte'];
const skillEpithets=['I','II','III','IV','V','VI','VII','VIII','IX','X','Soberano','Ancestral','Primordial','Supremo','Imperial','Eterno'];

function passiveScope(i){
  const c=targets.passives.scopeCounts;
  if(i<c.universal)return 'universal';
  if(i<c.universal+c.weapon)return 'weapon';
  if(i<c.universal+c.weapon+c.class)return 'class';
  if(i<c.universal+c.weapon+c.class+c.racial)return 'racial';
  return 'skillSynergy';
}

function passiveMechanics(scope,rank,r,i){
  const power=rankIndex[rank];
  const pct=Math.round((2+power*1.7+r()*2.5)*10)/10;
  const stats=['FUE','AGI','CON','DEF','INT','VOL'];
  const triggers=['always','hp_below_50','hp_above_80','on_hit','on_crit','on_dodge','on_kill','after_skill','near_ally','when_outnumbered'];
  const trigger=pick(triggers,r);
  if(scope==='universal'){
    return {trigger,effects:[{op:'stat_pct',stat:pick(stats,r),value:pct}]};
  }
  if(scope==='weapon'){
    return {trigger,effects:[{op:'weapon_damage_pct',value:pct+2},{op:'accuracy_pct',value:Math.max(1,Math.round(pct/3*10)/10)}]};
  }
  if(scope==='class'){
    return {trigger,effects:[{op:'class_damage_pct',value:pct+1},{op:'cooldown_pct',value:-Math.max(1,Math.round(pct/4*10)/10)}]};
  }
  if(scope==='racial'){
    return {trigger,effects:[{op:'stat_pct',stat:pick(stats,r),value:pct},{op:'resistance_pct',element:pick(['physical','fire','water','ice','wind','earth','lightning','light','dark'],r),value:Math.max(1,Math.round(pct/2*10)/10)}]};
  }
  return {trigger,effects:[{op:'skill_tag_damage_pct',tag:pick(['slash','pierce','impact','projectile','magic','summon','heal','guard','mobility'],r),value:pct+2}]};
}

function passiveCompatibility(scope,i,r){
  if(scope==='universal')return {type:'universal'};
  if(scope==='weapon'){
    const cls=classEntries[i%classEntries.length];
    return {type:'weapon',weapons:[pick(cls.weapons||['Cualquier arma'],r)]};
  }
  if(scope==='class'){
    const cls=classEntries[i%classEntries.length];
    return {type:'class',classes:[cls.name]};
  }
  if(scope==='racial'){
    const races=['kairakh','elfos','kijins','vampiros','insectoides','reptro'];
    return {type:'race',races:[races[i%races.length]]};
  }
  const cls=classEntries[i%classEntries.length];
  return {type:'skillTag',classes:[cls.name]};
}

function buildPassives(){
  const items=[];
  for(let i=0;i<targets.passives.total;i++){
    const r=rng('PASSIVE-'+i);
    const rank=rankForIndex(i,targets.passives.rankCounts);
    const scope=passiveScope(i);
    const compatibility=passiveCompatibility(scope,i,r);
    const mechanics=passiveMechanics(scope,rank,r,i);
    const name=`${pick(prefixes,r)} ${pick(suffixes,r)} de ${pick(nouns,r)} ${String(i+1).padStart(4,'0')}`;
    items.push({
      id:`PAS-${String(i+1).padStart(4,'0')}`,
      name,rank,scope,
      category: scope==='racial'?'Racial':scope==='weapon'?'Arma':scope==='class'?'Clase':scope==='skillSynergy'?'Sinergia de habilidad':'Estadística',
      compatibility,mechanics,
      functional:true,
      description:`Pasiva funcional de rango ${rank}. Se aplica mediante el intérprete de efectos del combate.`
    });
  }
  return items;
}

function skillMechanics(cls,rank,r,i){
  const p=rankIndex[rank];
  const main=statForRole(cls.role||'');
  const archetypes=['single','line','cone','area','self','ally','summon'];
  const target=pick(archetypes,r);
  const tags=[];
  if(/Ranger|distancia|Artillero|Arquero|proyect/i.test(cls.name+' '+cls.role))tags.push('projectile');
  else if(/Mago|Tejedor|Resonador|Conductor|Hemom/i.test(cls.name+' '+cls.role))tags.push('magic');
  else if(/Invoc|Señor de los Cien Demonios|Colmena/i.test(cls.name+' '+cls.role))tags.push('summon');
  else if(/Defensor|Guardián|Bastión/i.test(cls.name+' '+cls.role))tags.push('guard');
  else tags.push(pick(['slash','pierce','impact','mobility'],r));
  const power=Math.round((.75+p*.16+r()*.18)*100)/100;
  const cooldown=Math.max(1,Math.round((7-p*.35+r()*2)*10)/10);
  const effects=[{op:'damage',scalingStat:main,multiplier:power,target}];
  if(/Apoyo|sanación|Cantor|Resonador/i.test(cls.name+' '+cls.role)&&i%4===0){
    effects[0]={op:'heal',scalingStat:main,multiplier:Math.round((.55+p*.1)*100)/100,target:'ally'};
    tags.push('heal');
  } else if(/Defensor|Guardián|Bastión/i.test(cls.name+' '+cls.role)&&i%5===0){
    effects.push({op:'shield',scalingStat:'DEF',multiplier:Math.round((.35+p*.07)*100)/100,target:'self'});
  } else if(/Invoc|Señor de los Cien Demonios|Colmena/i.test(cls.name+' '+cls.role)&&i%6===0){
    effects.push({op:'summon_boost_pct',value:3+p*2});
  } else if(i%7===0){
    effects.push({op:'penetration_pct',value:2+p*1.2});
  }
  return {target,tags:[...new Set(tags)],cooldownSeconds:cooldown,timeCostSeconds:Math.max(1,Math.round((2.5+p*.45+r())*10)/10),effects};
}

function buildSkillsForClass(cls){
  const total=targets.skills.minimumPerClass;
  const items=[];
  const cslug=slug(cls.name).slice(0,20).toUpperCase().replace(/-/g,'_');
  for(let i=0;i<total;i++){
    const r=rng('SKILL-'+cls.name+'-'+i);
    const rank=rankForIndex(i,targets.skills.rankCountsPerClass);
    const mech=skillMechanics(cls,rank,r,i);
    const weapon=pick(cls.weapons||['Sin arma'],r);
    const name=`${pick(skillVerbs,r)} ${pick(skillForms,r)} · ${pick(skillEpithets,r)} · ${String(i+1).padStart(4,'0')}`;
    items.push({
      id:`SK-${cslug}-${String(i+1).padStart(4,'0')}`,
      name,className:cls.name,classGroup:cls.group,rank,
      type:'active',
      weaponRequirement:weapon,
      mechanics:mech,
      functional:true,
      learnCondition:{type:'class_mastery',className:cls.name,threshold:clamp((rankIndex[rank]+1)*10+Math.floor(r()*12),1,100)},
      description:`Habilidad funcional exclusiva de ${cls.name}, rango ${rank}, compatible con ${weapon}.`
    });
  }
  return items;
}

const passives=buildPassives();
fs.writeFileSync(path.join(outDir,'passives.json'),JSON.stringify({schemaVersion:targets.schemaVersion,total:passives.length,items:passives}));

const manifest={schemaVersion:targets.schemaVersion,generatedAt:new Date().toISOString(),passives:passives.length,classes:{}};
for(const cls of classEntries){
  const items=buildSkillsForClass(cls);
  const file=slug(cls.name)+'.json';
  fs.writeFileSync(path.join(skillsDir,file),JSON.stringify({schemaVersion:targets.schemaVersion,className:cls.name,total:items.length,items}));
  manifest.classes[cls.name]={file:'skills/'+file,total:items.length};
}
manifest.totalSkills=Object.values(manifest.classes).reduce((a,b)=>a+b.total,0);
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2));
console.log(`Generated ${manifest.passives} passives and ${manifest.totalSkills} skills across ${Object.keys(manifest.classes).length} classes.`);
