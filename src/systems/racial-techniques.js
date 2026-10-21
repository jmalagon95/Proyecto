// Núcleo de técnicas raciales para combate automático 2D/2.5D.
// Solo efectos instantáneos: daño, curación, escudo, precisión y cadencia.
// Todas las clases reciben una técnica a partir del nivel 1, sin alterar el gacha.
export const RACIAL_TECHNIQUES={
  // Kairakh — atributos raciales compartidos, seis disciplinas distintas
  'Taumaturgo Bélico':['Explosión del Primer Combate','blast','INT',6],
  'Invocador de Avatares':['Golpe del Ancestro','echo','VOL',7],
  'Hierofante de Guerra':['Juramento de Supervivencia','heal','VOL',6],
  'Quebrantador de Asedios':['Guardia Quebrantadora','guardbreak','DEF',7],
  'Exterminador Primordial':['Flecha del Ojo Divino','pierce','AGI',6],
  'Monarca de la Espada Indómita':['Espada de Voluntad Indómita','colossus','FUE',8],
  // Elfos — precisión y asistencia
  'Relojero de Luciérnagas':['Segundo Robado','evade','VOL',7],
  'Bailarín de las Siete Hojas':['Danza de Siete Cortes','multi','AGI',6],
  'Custodio del Último Brote':['Brote de Emergencia','heal','VOL',6],
  'Arconte de los Gemelos Astrales':['Eco del Gemelo','echo','INT',7],
  'Tirador de la Quietud':['Silencio del Arquero','pierce','AGI',7],
  // Kijins — represalia y técnica
  'Deudor de Cien Golpes':['Deuda Devuelta','counter','DEF',7],
  'Demonio del Séptimo Impacto':['Séptimo Rugido','colossus','FUE',8],
  'Censor de Juramentos Rotos':['Sentencia Ritual','mark','VOL',7],
  'Portador de Dos Veredictos':['Doble Sentencia','multi','FUE',6],
  'Monje de las Marcas Gemelas':['Sello Protector','shield','VOL',6],
  // Vampiros — duelos, supervivencia
  'Coleccionista de Últimos Suspiros':['Último Suspiro','execute','AGI',7],
  'Mayordomo del Trono Vacío':['Protección del Señor','shield','VOL',6],
  'Confesor de Sangre Fría':['Confesión Oscura','mark','INT',7],
  'Caballero del Ataúd Abierto':['Puerta del Ataúd','guard','CON',7],
  'Esgrimista de la Rosa Negra':['Rosa Perforante','pierce','AGI',6],
  // Insectoides — quitina y combinaciones
  'Matriarca de la Segunda Crisálida':['Crisálida Reparadora','heal','VOL',6],
  'Martillo de Élitra':['Élitros Cerrados','guard','DEF',7],
  'Aguijón de la Cuenta Regresiva':['Aguijón Preciso','pierce','AGI',7],
  'Obrero de las Cien Pinzas':['Cien Pinzas','multi','FUE',6],
  'Coronel de Antenas Partidas':['Señal de la Colmena','haste','VOL',7],
  // Reptro — rayos reales, pelo y cola eléctricos, sin DoT
  'Trenzador de Rayos Gemelos':['Arco Encadenado','chain','INT',7],
  'Latigador de Cola de Plasma':['Latigazo de Plasma','counter','AGI',6],
  'Calibrador de Frecuencia':['Sincronía del Rayo','haste','VOL',7],
  'Pararrayos Errante':['Rayo Recibido','blast','CON',7],
  'Gemelo de Chispa':['Eco de Chispa','echo','INT',6]
};
export function racialTechniqueFor(character){
  const row=RACIAL_TECHNIQUES[character?.className];
  if(!row)return null;
  const [name,kind,stat,cooldownSeconds]=row;
  return {id:'RACIAL-'+character.className,name,kind,stat,cooldownSeconds};
}
export function executeRacialTechnique(actor,allies,enemies,sec){
  const skill=racialTechniqueFor(actor.ref);
  if(!skill||sec<(actor.nextRacialAt||0)||!actor.alive||!enemies.length)return null;
  const stat=Math.max(1,Number(actor.ref.stats?.[skill.stat]||1));
  const base=Math.max(1,Math.round(stat*.65+Number(actor.ref.level||1)*.45));
  const target=enemies[0];
  const ally=allies.filter(a=>a.alive&&a.hp<a.maxHp).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
  // La curación se reserva hasta que algún compañero esté herido.
  if(skill.kind==='heal'&&!ally)return null;
  actor.nextRacialAt=sec+skill.cooldownSeconds;
  const report={actorId:actor.id,skill:skill.name,kind:skill.kind,t:sec,targetId:null,damage:0,healing:0,shield:0,kills:0};
  const hit=(enemy,amount)=>{
    if(!enemy||enemy.hp<=0)return;
    const dealt=Math.min(enemy.hp,Math.max(1,Math.round(amount)));
    enemy.hp-=dealt;
    report.damage+=dealt;
    if(enemy.hp<=0){report.kills++;enemy.hp=0}
  };
  if(skill.kind==='heal'){
    const amount=Math.min(ally.maxHp-ally.hp,base*2);
    ally.hp+=amount;report.healing=amount;report.targetId=ally.id;
  }else if(['shield','guard','evade'].includes(skill.kind)){
    const friend=allies.filter(a=>a.alive).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
    if(friend){report.targetId=friend.id;report.shield=base*2;friend.shield=(friend.shield||0)+report.shield;}
  }else if(skill.kind==='haste'){
    const friend=allies.filter(a=>a.alive).sort((a,b)=>b.attack.dps-a.attack.dps)[0];
    if(friend){friend.attackAccumulator+=.65;report.targetId=friend.id;}
    hit(target,base);
  }else if(skill.kind==='chain'||skill.kind==='multi'){
    for(const enemy of enemies.filter(e=>e.hp>0).slice(0,3))hit(enemy,skill.kind==='chain'?base*.8:base*.55);
  }else if(skill.kind==='execute'){
    hit(target,base*(target.hp<target.maxHp*.45?2.3:1.2));
  }else if(skill.kind==='pierce'||skill.kind==='guardbreak'){
    hit(target,base*1.75);
  }else if(skill.kind==='colossus'){
    hit(target,base*2.15);
  }else if(skill.kind==='echo'){
    hit(target,base*1.3);
  }else if(skill.kind==='mark'){
    hit(target,base*.8);target.vulnerableUntil=sec+2;
  }else{
    hit(target,base*1.3);
  }
  return report;
}
