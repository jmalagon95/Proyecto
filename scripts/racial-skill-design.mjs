// Diseño procedural de habilidades raciales v4.
// 31 disciplinas únicas; 1000 registros por clase; 11 rangos. Sin DoT.
// Una familia evolutiva se representa mediante ID estable y predecesores;
// las técnicas nativas superiores no inventan versiones inferiores.
export const RACIAL_SKILL_DESIGN_VERSION=4;
const profiles={
'Taumaturgo Bélico':['Arcanismo de Guerra','Explosión del Asedio','Runas del Combate','Fulgor de Conquista','spell','INT'],
'Invocador de Avatares':['Ancestro de las Mil Batallas','Estandarte Viviente','Golpe del Avatar','Consejo de los Caídos','summon','VOL'],
'Hierofante de Guerra':['Juramento de los Vivos','Santuario de Combate','Resurgir del Guerrero','Última Promesa','heal','VOL'],
'Quebrantador de Asedios':['Muralla Quebrada','Puño de Fortaleza','Asalto Irresistible','Vanguardia del Coloso','breaker','DEF'],
'Exterminador Primordial':['Presa Indigna','Flecha de la Sentencia','Cacería de Gigantes','Ojo del Horizonte','hunter','AGI'],
'Monarca de la Espada Indómita':['Voluntad de Acero','Corte de la Guerra Absoluta','Dominio del Rey Marcial','Última Espada del Monarca','monarch','FUE'],
'Relojero de Luciérnagas':['Instante Prestado','Péndulo del Alba','Segundo de la Luna','Tiempo Suspendido','tempo','VOL'],
'Bailarín de las Siete Hojas':['Séptima Hoja','Danza del Brote','Arista del Viento','Espiral de Siete Filos','multi','AGI'],
'Custodio del Último Brote':['Raíz que Resiste','Último Jardín','Brote Renacido','Savias de Vida','heal','VOL'],
'Arconte de los Gemelos Astrales':['Órbita del Gemelo','Llamada del Segundo Sol','Constelación Doble','Ecos Estelares','summon','INT'],
'Tirador de la Quietud':['Flecha Silenciosa','Horizonte Quieto','Ojo Inmóvil','Disparo sin Eco','hunter','AGI'],
'Deudor de Cien Golpes':['Centésima Deuda','Contabilidad del Dolor','Diezmos del Impacto','Deuda de Sangre','counter','DEF'],
'Demonio del Séptimo Impacto':['Séptima Campanada','Golpe del Oni','Impacto Prohibido','Martillo de la Calamidad','breaker','FUE'],
'Censor de Juramentos Rotos':['Sanción del Pacto','Tinta de la Condena','Veredicto Carmesí','Palabra Quebrada','mark','VOL'],
'Portador de Dos Veredictos':['Doble Juicio','Sentencia Paralela','Dos Destinos','Balanza de Acero','multi','FUE'],
'Monje de las Marcas Gemelas':['Marca de Intercambio','Sello del Equilibrio','Puños de los Dos Cuernos','Mantra del Oni','ward','VOL'],
'Coleccionista de Últimos Suspiros':['Último Aliento','Cosecha del Silencio','Punto Final','Banquete de los Caídos','execute','AGI'],
'Mayordomo del Trono Vacío':['Etiqueta de la Noche','Guardia del Trono','Juramento al Amo Ausente','Último Servicio','ward','VOL'],
'Confesor de Sangre Fría':['Confesión Obligada','Espejo de Culpa','Verdad del Abismo','Pecado Inmóvil','mark','INT'],
'Caballero del Ataúd Abierto':['Puerta de la Cripta','Rechazo de la Muerte','Ataúd de Hierro','Juramento Nocturno','counter','CON'],
'Esgrimista de la Rosa Negra':['Rosa de Mil Espinas','Duelo Carmesí','Estocada de Medianoche','Pétalo Final','duelist','AGI'],
'Matriarca de la Segunda Crisálida':['Capullo Regenerador','Orden de la Reina','Crisálida Protectora','Eclosión de Élite','heal','VOL'],
'Martillo de Élitra':['Armadura de Élitros','Choque de Caparazón','Tenaza de la Colmena','Muralla Quitinosa','ward','DEF'],
'Aguijón de la Cuenta Regresiva':['Segundo Aguijón','Punción del Instante','Cuenta del Cazador','Aguja de la Colmena','hunter','AGI'],
'Obrero de las Cien Pinzas':['Cien Mandíbulas','Cadena de Pinzas','Mandato Obrero','Enjambre de Cuchillas','multi','FUE'],
'Coronel de Antenas Partidas':['Orden sin Voz','Marcha de la Colmena','Enlace de Antenas','Comando Quirúrgico','tempo','VOL'],
'Trenzador de Rayos Gemelos':['Doble Arco','Trenza del Trueno','Relámpagos Gemelos','Tormenta Reunida','chain','INT'],
'Latigador de Cola de Plasma':['Estela de Plasma','Cola de Tormenta','Látigo del Relámpago','Reverso de Descarga','counter','AGI'],
'Calibrador de Frecuencia':['Pulso Sincrónico','Frecuencia Absoluta','Cadencia del Rayo','Compás Eléctrico','tempo','VOL'],
'Pararrayos Errante':['Carga Absorbida','Contrafulgor','Golpe del Pararrayos','Descarga Errante','breaker','CON'],
'Gemelo de Chispa':['Chispa Reflejada','Réplica del Rayo','Segundo Relámpago','Eco Electrizante','summon','INT']
};
export const RACIAL_SKILL_PROFILES=profiles;
const scales={F:[0.7,1.5],E:[1.1,2.7],D:[2,4.4],C:[3.4,7],B:[5,14],A:[11,35],S:[35,170],SS:[130,800],SSS:[500,3200],'SSS+':[1700,8500],U:[4000,16000]};
const stages=['Inicio','Despertar','Ruptura','Ascenso','Dominio','Trascendencia','Cataclismo','Apoteosis','Absoluto','Fin de Era','Origen'];
const methods=['Asalto','Contraflujo','Desgarro','Reflejo','Espiral','Convergencia','Desafío','Condena','Proclamación','Singularidad'];
const round=n=>Math.round(n*100)/100;
const safe=(s)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');
function effectsFor(style,stat,rank,seed){
 const tier=['F','E','D','C','B','A','S','SS','SSS','SSS+','U'].indexOf(rank);
 const [lo,hi]=scales[rank];
 const mult=round(lo+(hi-lo)*((seed*17%97)/96));
 const giant=tier>=6;
 const hits=giant?Math.min(18,1+Math.floor((seed%7)*(tier-4)/2)):1+(seed%3===0?1:0);
 const area=seed%7===0||style==='chain'&&seed%3===0;
 const target=area?'area':'single';
 const damage=(factor=1)=>({op:'damage',scalingStat:stat,multiplier:round(mult*factor),hits,target,ignoreDefensePct:giant?Math.min(100,10+(tier-6)*16+(seed%21)):seed%11,critMultiplier:giant&&seed%3===0?round(1.5+(tier-5)*.8):1});
 const percent=(pct)=>({op:'bonus_damage_pct_max_hp',value:pct,target}); // por objetivo, daño inmediato
 const ward=()=>({op:'shield',scalingStat:stat,multiplier:round(mult*.65),target:'ally'});
 const heal=()=>({op:'heal',scalingStat:stat,multiplier:round(mult*.60),target:'ally'});
 const accel=()=>({op:'haste',value:round((tier+1)*.08),target:'ally'});
 const mark=()=>({op:'vulnerability',value:round(2+(tier+1)*1.8),durationSeconds:Math.min(5,1+Math.floor(tier/3)),target});
 const effects=[];
 switch(style){
 case 'heal':effects.push(seed%3===0?ward():heal());if(seed%2===0)effects.push(damage(.35));break;
 case 'ward':effects.push(ward());if(seed%2===0)effects.push(damage(.43));break;
 case 'tempo':effects.push(accel());effects.push(seed%3===0?ward():damage(.52));break;
 case 'summon':effects.push({op:'summon_strike',scalingStat:stat,multiplier:round(mult*.72),hits:Math.min(8,Math.max(2,hits)),target});break;
 case 'mark':effects.push(mark(),damage(.65));break;
 case 'counter':effects.push(ward(),damage(.70));break;
 case 'execute':effects.push({...damage(.85),executeBelowHpPct:giant?50:30,executeBonusMultiplier:giant?2+(tier-6)*.9:1.3});break;
 case 'duelist':effects.push({...damage(),critMultiplier:giant?3+(tier-6)*1.4:1.5});break;
 case 'hunter':effects.push({...damage(),ignoreDefensePct:Math.min(100,giant?30+(tier-6)*18:8+tier*3)});break;
 case 'multi':effects.push({...damage(.6),hits:Math.min(25,hits+(tier+1)*2)});break;
 case 'chain':effects.push({...damage(.8),hits:Math.max(2,hits),target:'area'});break;
 case 'breaker':effects.push(damage(),mark());break;
 case 'monarch':effects.push({...damage(),critMultiplier:giant?5+(tier-6)*1.5:1.7});break;
 default:effects.push(damage());
 }
 // Extra instantáneo: las técnicas altas mezclan multiplicadores, porcentaje
 // de vida máxima y potencia bruta. Nunca daño periódico.
 if(giant&&['spell','breaker','hunter','execute','duelist','multi','chain','monarch','summon'].includes(style)&&seed%3===0)
   effects.push(percent(round((tier-5)*.7+(seed%9)*.35)));
 return {effects,target:effects.find(e=>e.op==='damage'||e.op==='summon_strike')?.target||'ally',hits};
}
export function buildRacialSkills(cls,targets){
 const profile=profiles[cls.name];
 if(!profile)throw new Error('Falta identidad racial de '+cls.name);
 const [,, , ,style,stat]=profile;
 const ranks=targets.ranks,counts=targets.skills.rankCountsPerClass;
 const total=targets.skills.minimumPerClass,slug=safe(cls.name);
 const items=[],familyLast=new Map(),rankCounts={};
 const offsets=new Map();
 let sum=0;
 for(const rank of ranks){offsets.set(rank,sum);sum+=counts[rank];}
 if(sum!==total)throw new Error('Recuento de rangos inválido');
 for(let i=0;i<total;i++){
   const rank=ranks.find(r=>i<offsets.get(r)+counts[r]);
   const tier=ranks.indexOf(rank);
   const within=i-offsets.get(rank);
   // 10 familias evolutivas cruzan todos los rangos; el resto nace en su propio rango.
   const isEvolution=within<10;
   const family=isEvolution?within:10+Math.floor(i/5);
   const origin=isEvolution?'evolutiva':'nativa';
   const last=isEvolution?familyLast.get(family):null;
   const motif=profile[family%4];
   const form=methods[Math.floor(i/4+family)%methods.length];
   const name=isEvolution?motif+' — '+stages[tier]+' '+form:motif+' — '+form+' de '+stages[tier]+' '+String(within+1).padStart(3,'0');
   const id='SK-'+slug+'-'+String(i+1).padStart(4,'0');
   const mechanics=effectsFor(style,stat,rank,i+family*37);
   const weapon=cls.weapons[(i+family)%cls.weapons.length];
   const next={
     id,name,className:cls.name,classGroup:cls.group,rank,type:'active',
     origin,familyId:'RF-'+slug+'-'+String(family).padStart(4,'0'),
     evolvesFrom:last||null,
     weaponRequirement:weapon,
     mechanics:{target:mechanics.target,tags:[style,cls.group],cooldownSeconds:Math.max(2,round(11-tier*.35+(i%5))),timeCostSeconds:round(1.6+tier*.18),effects:mechanics.effects},
     functional:true,resolverCompatible:true,implementedInAutoCombat:true,
     learnCondition:origin==='evolutiva'&&last?{type:'master_previous',skillId:last}:{type:'combat_discovery',rank,rareEncounter:tier>=6},
     description:cls.name+': '+(origin==='evolutiva'?'evolución de una senda consolidada. ':'técnica nativa de rango '+rank+'. ')+
       'Familia '+motif+'. '+mechanics.effects.map(e=>e.op==='damage'?e.hits+' impactos ×'+e.multiplier+(e.ignoreDefensePct?' con '+e.ignoreDefensePct+'% de penetración':''):e.op==='bonus_damage_pct_max_hp'?e.value+'% de vida máxima del objetivo':e.op==='summon_strike'?'avatar ejecuta '+e.hits+' impactos ×'+e.multiplier:e.op==='heal'?'curación ×'+e.multiplier:e.op==='shield'?'barrera ×'+e.multiplier:e.op==='haste'?'avance de acción +'+e.value:e.op==='vulnerability'?'vulnerabilidad '+e.value+'%':e.op).join('; ')+'.'
   };
   items.push(next);if(isEvolution)familyLast.set(family,id);
   rankCounts[rank]=(rankCounts[rank]||0)+1;
 }
 if(items.length!==total||ranks.some(r=>rankCounts[r]!==counts[r]))throw new Error('Distribución incorrecta '+cls.name);
 return items;
}
