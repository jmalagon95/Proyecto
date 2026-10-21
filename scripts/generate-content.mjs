import fs from 'node:fs';
import path from 'node:path';
import {buildRacialSkills,RACIAL_SKILL_DESIGN_VERSION} from './racial-skill-design.mjs';

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

// Skills use exactly one supported primary operation. No ally-targeted damage,
// no enemy-targeted heals and no periodic damage in the 2D/2.5D combat catalogue.
const roleProfiles={
  'Taumaturgo Bélico':['magic','impact','pulse'],'Invocador de Avatares':['summon','command','impact'],
  'Hierofante de Guerra':['heal','guard','impact'],'Quebrantador de Asedios':['impact','guard','pierce'],
  'Exterminador Primordial':['projectile','pierce','mark'],'Monarca de la Espada Indómita':['slash','aura','impact'],
  'Relojero de Luciérnagas':['guard','light','precision'],'Bailarín de las Siete Hojas':['slash','chain','precision'],
  'Custodio del Último Brote':['heal','guard','nature'],'Arconte de los Gemelos Astrales':['summon','magic','guard'],
  'Tirador de la Quietud':['projectile','precision','pierce'],'Deudor de Cien Golpes':['guard','counter','impact'],
  'Demonio del Séptimo Impacto':['impact','combo','pierce'],'Censor de Juramentos Rotos':['counter','mark','magic'],
  'Portador de Dos Veredictos':['slash','impact','combo'],'Monje de las Marcas Gemelas':['guard','impact','support'],
  'Coleccionista de Últimos Suspiros':['precision','pierce','execute'],'Mayordomo del Trono Vacío':['guard','heal','support'],
  'Confesor de Sangre Fría':['magic','counter','precision'],'Caballero del Ataúd Abierto':['guard','counter','slash'],
  'Esgrimista de la Rosa Negra':['precision','pierce','counter'],'Matriarca de la Segunda Crisálida':['heal','guard','nature'],
  'Martillo de Élitra':['guard','impact','counter'],'Aguijón de la Cuenta Regresiva':['pierce','combo','impact'],
  'Obrero de las Cien Pinzas':['multi','slash','impact'],'Coronel de Antenas Partidas':['support','guard','precision'],
  'Trenzador de Rayos Gemelos':['lightning','chain','magic'],'Latigador de Cola de Plasma':['lightning','counter','impact'],
  'Calibrador de Frecuencia':['support','lightning','precision'],'Pararrayos Errante':['lightning','impact','counter'],
  'Gemelo de Chispa':['summon','lightning','magic']
};
const racialWords={kairakh:['Guerra Ancestral','Cuerno Primordial','Furia Honorable','Mirada Divina'],
elfos:['Luna Ancestral','Luciérnaga','Espíritu Verde','Alba Silvana'],
kijins:['Calamidad','Dos Cuernos','Juicio Carmesí','Mandato Oni'],
vampiros:['Rosa Negra','Nocthera','Eclipse Carmesí','Sangre Fría'],
insectoides:['Élitro','Crisálida','Antena','Colmena'],
reptro:['Relámpago','Escama','Cola de Plasma','Frecuencia'],
generic:['Disciplina','Dominio','Arte','Voluntad']};
function mainTags(cls){
  return roleProfiles[cls.name]||(/sanación|curación|apoyo|support/i.test(cls.role)?['heal','guard','support']:
    /invoc/i.test(cls.role)?['summon','magic','guard']:
    /tanque|defensor/i.test(cls.role)?['guard','counter','impact']:
    /mágico|magia|mago/i.test(cls.role)?['magic','impact','pulse']:
    /ranger|distancia|arquero/i.test(cls.role)?['projectile','pierce','precision']:
    ['slash','impact','pierce']);
}
function skillMechanics(cls,rank,r,i){
  const tier=rankIndex[rank],tags=mainTags(cls);
  const tag=tags[i%tags.length];
  const role=String(cls.role||'').toLowerCase();
  const healer=/sanador|healer|curación|sanación|apoyo|support/i.test(role);
  const guard=/tanque|defensor|protección/i.test(role);
  // Actives may heal or shield only if the class is able to support or defend.
  const op=healer&&i%4===0?'heal':guard&&i%5===0?'shield':'damage';
  const target=op==='heal'?'ally':op==='shield'?'self':i%6===0?'area':'single';
  const main=cls.primaryStats?.[0]||statForRole(role);
  const scale=op==='shield'?'DEF':op==='heal'?(cls.primaryStats?.[0]||'VOL'):main;
  const multiplier=Math.round((0.65+tier*.11+r()*.22)*100)/100;
  const effects=[{op,scalingStat:scale,multiplier,target}];
  if(op==='damage'&&i%13===0)effects.push({op:'penetration_pct',value:Math.round((2+tier*.8)*10)/10});
  return {target,tags:[tag],cooldownSeconds:Math.max(2,Math.round((9-tier*.35+r()*3)*10)/10),
    timeCostSeconds:Math.round((2+tier*.16+r())*10)/10,effects};
}
function buildSkillsForClass(cls){
  const total=targets.skills.minimumPerClass;
  const items=[];
  const cslug=slug(cls.name).toUpperCase().replace(/-/g,'_');
  const terms=racialWords[cls.group]||racialWords.generic;
  const tags=mainTags(cls);
  for(let i=0;i<total;i++){
    const r=rng('SKILL-V3-'+cls.name+'-'+i);
    const rank=rankForIndex(i,targets.skills.rankCountsPerClass);
    const mech=skillMechanics(cls,rank,r,i);
    const weapon=pick(cls.weapons||['Sin arma'],r);
    const name=`${pick(skillVerbs,r)} de ${terms[(i+Math.floor(i/11))%terms.length]} · ${pick(skillEpithets,r)} · ${String(i+1).padStart(4,'0')}`;
    items.push({
      id:`SK-${cslug}-${String(i+1).padStart(4,'0')}`,name,className:cls.name,classGroup:cls.group,rank,
      type:'active',weaponRequirement:weapon,mechanics:mech,designTags:tags,
      resolverCompatible:true,implementedInAutoCombat:false,functional:true,
      learnCondition:{type:'class_mastery',className:cls.name,threshold:clamp((rankIndex[rank]+1)*10+Math.floor(r()*12),1,100)},
      description:`Técnica activa de ${cls.name} (${rank}). ${cls.description} Requiere ${weapon}.`
    });
  }
  return items;
}

const passives=buildPassives();
fs.writeFileSync(path.join(outDir,'passives.json'),JSON.stringify({schemaVersion:targets.schemaVersion,total:passives.length,items:passives}));

const manifest={schemaVersion:targets.schemaVersion,generatedAt:new Date().toISOString(),passives:passives.length,classes:{},skillType:'active',racialSkillDesignVersion:RACIAL_SKILL_DESIGN_VERSION,combatEngineIntegration:'modular'};
for(const cls of classEntries){
  const items=cls.group==='generic'?buildSkillsForClass(cls):buildRacialSkills(cls,targets);
  const file=slug(cls.name)+'.json';
  fs.writeFileSync(path.join(skillsDir,file),JSON.stringify({schemaVersion:targets.schemaVersion,className:cls.name,total:items.length,items}));
  manifest.classes[cls.name]={file:'skills/'+file,total:items.length,group:cls.group,rankCounts:targets.skills.rankCountsPerClass,designVersion:cls.group==='generic'?3:RACIAL_SKILL_DESIGN_VERSION};
}
manifest.totalSkills=Object.values(manifest.classes).reduce((a,b)=>a+b.total,0);
if(manifest.totalSkills!==classEntries.length*targets.skills.minimumPerClass)throw new Error('Mismatch skill count');
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2));
console.log(`Generated ${manifest.passives} passives and ${manifest.totalSkills} skills across ${Object.keys(manifest.classes).length} classes.`);
