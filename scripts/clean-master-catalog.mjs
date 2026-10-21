import fs from 'node:fs';
import path from 'node:path';
import {runInNewContext} from 'node:vm';

// El maestro es monolítico: reescribir las declaraciones reales evita que
// queden razas/clases antiguas activas bajo los parches de compatibilidad.
const root=process.cwd();
const filepath=path.join(root,'index.html');
let html=fs.readFileSync(filepath,'utf8');
const canonical=JSON.parse(fs.readFileSync(path.join(root,'data/races.json'),'utf8'));
const classes=JSON.parse(fs.readFileSync(path.join(root,'data/classes.json'),'utf8'));
const allowedNames=new Set(canonical.map(x=>x.name));
if(canonical.length!==6 || Object.values(classes).slice(1).flat().length!==31)
  throw new Error('Catálogo canónico inesperado: operación cancelada.');

function declaration(key) {
  const start=html.indexOf('const '+key+'=');
  if(start<0)throw new Error('No existe la declaración '+key);
  const from=start+('const '+key+'=').length;
  if(html[from]!=='{')throw new Error(key+' no es un objeto JSON');
  let depth=0, quoted=false,escaped=false, end=-1;
  for(let i=from;i<html.length;i++){
    const ch=html[i];
    if(quoted){
      if(escaped)escaped=false;
      else if(ch==='\\')escaped=true;
      else if(ch==='"')quoted=false;
    }else if(ch==='"')quoted=true;
    else if(ch==='{')depth++;
    else if(ch==='}'){
      depth--;
      if(!depth){end=i+1;break}
    }
  }
  if(end<0||html[end]!==';')throw new Error('No se ha podido delimitar '+key);
  const literal=html.slice(from,end);
  const value=key==='names'?runInNewContext('('+literal+')'):JSON.parse(literal);
  return {start,end:end+1,value};
}
function updateObject(key,value) {
  const d=declaration(key);
  html=html.slice(0,d.start)+'const '+key+'='+JSON.stringify(value)+';'+html.slice(d.end);
}
function replaceExactly(oldText,replacement,label){
  const count=html.split(oldText).length-1;
  if(count===0&&html.includes(replacement))return; // Ejecutable más de una vez sin cambiar el maestro.
  if(count!==1)throw new Error(label+': esperaba 1 coincidencia, encontradas '+count);
  html=html.replace(oldText,replacement);
}
const currentAssets=declaration('ASSETS').value;
const assets=Object.fromEntries(Object.entries(currentAssets).filter(([name])=>
  !['Humanos','Hombres Bestia','Huecos'].includes(name)));
for(const race of canonical)if(!assets[race.name])assets[race.name]=race.image;
updateObject('ASSETS',assets);
const masterRaces=Object.fromEntries(canonical.map(r=>[r.name,{
  tag:r.tag,desc:r.description,history:r.history,origin:r.origin
}]));
updateObject('RACES',masterRaces);
const masterClasses=Object.fromEntries(canonical.map(r=>[r.name,
  classes[r.id].map(c=>({name:c.name,weapons:c.weapons||[],desc:c.description||'',role:c.role||'Guerrero'}))
]));
updateObject('CLASSES',masterClasses);

const currentNames=declaration('names').value;
const names=Object.fromEntries(canonical.map(r=>[r.name,
  currentNames[r.name]||({
    Reptro:['Zeryx','Rathen','Veska','Khaelis']
  }[r.name]||['Aren','Seris','Varek','Niria'])]));
updateObject('names',names);

replaceExactly(
 "let civs=[['Kairakh','Varkh','Rhaz’Kel'],['Humanos','Kergelian','Hoflip'],['Elfos','Elenor','Sylvaris'],['Kijins','Hokuren','Kozan'],['Hombres Bestia','Vaelra','Garoum'],['Vampiros','Valdrenn','Nocthera'],['Insectoides','Colmena de Irix','Thryx'],['Huecos','Ruinas del Eco','Abyr']];",
 "let civs="+JSON.stringify([
 ['Kairakh','Varkh','Rhaz’Kel'],['Elfos','Elenor','Sylvaris'],
 ['Kijins','Hokuren','Kozan'],['Vampiros','Valdrenn','Nocthera'],
 ['Insectoides','Colmena de Irix','Thryx'],['Reptro','Voltrax','Akrion']
 ])+";",
 'Civilizaciones del mundo');
replaceExactly(
 "const emblems={Kairakh:'✦',Humanos:'✠',Elfos:'❋',Kijins:'☠',\"Hombres Bestia\":'♞',Vampiros:'🦇',Insectoides:'🜲',Huecos:'◉'};",
 "const emblems={Kairakh:'✦',Elfos:'❋',Kijins:'☠',Vampiros:'🦇',Insectoides:'🜲',Reptro:'⚡'};",
 'Emblemas de las razas');
html=html.replace("['✦','◆','◈','✧','✥'][i]","['✦','◆','◈','✧','✥','⚔'][i%6]");
// Invocación debe sortear entre las clases disponibles de cada raza.
html=html.replace(/Object\.keys\(RACES\)\[Math\.floor\(Math\.random\(\)\*8\)\]/g,
  'Object.keys(RACES)[Math.floor(Math.random()*Object.keys(RACES).length)]');
html=html.replace(/CLASSES\[r\]\[Math\.floor\(Math\.random\(\)\*5\)\]/g,
  'CLASSES[r][Math.floor(Math.random()*CLASSES[r].length)]');
const oldRole="let role=c.name.toLowerCase().includes('guardián')||c.name.toLowerCase().includes('bastión')?'Defensor':c.name.toLowerCase().includes('arquero')||c.name.toLowerCase().includes('cazador')?'Ranger':c.name.toLowerCase().includes('tejedor')||c.name.toLowerCase().includes('resonador')?'Mago':'Guerrero';";
replaceExactly(oldRole,"let role=c.role||'Guerrero';",'Rol de la nueva clase');

// Partidas antiguas: los personajes de razas retiradas quedan archivados,
// nunca borrados sin copia. Los personajes de razas vigentes mantienen estadísticas,
// nivel, rareza, equipo y nombre, y obtienen una clase canónica compatible.
const marker='/* KAMI_CANONICAL_RACES_V5 */';
if(!html.includes(marker)){
 const migration="/* KAMI_CANONICAL_RACES_V5 */\nfunction migrateCanonicalRacesV5(s){\n if(!s||s._canonicalRacesVersion===5)return s;\n const all=Array.isArray(s.characters)?s.characters:[];\n const archived=Array.isArray(s.retiredRaceCharacters)?s.retiredRaceCharacters:[];\n const active=[];\n for(const ch of all){\n   if(!RACES[ch.race]){\n     if(!archived.some(x=>x.id===ch.id))archived.push(ch);\n     continue;\n   }\n   const options=CLASSES[ch.race];\n   if(!options.some(x=>x.name===ch.className)){\n     const role=String(ch.role||'').toLowerCase();\n     const selected=options.find(x=>/sanaci|apoyo|support|invoc/.test(role)&&/sanaci|apoyo|support|invoc/.test(String(x.role).toLowerCase()))\n       ||options.find(x=>/tanque|defens|prote/.test(role)&&/tanque|defens|prote/.test(String(x.role).toLowerCase()))\n       ||options.find(x=>/ranger|distancia|tirador/.test(role)&&/ranger|distancia|tirador/.test(String(x.role).toLowerCase()))\n       ||options.find(x=>/mag/.test(role)&&/mag/.test(String(x.role).toLowerCase()))\n       ||options.find(x=>/dps|guerrero/.test(role)&&/dps/.test(String(x.role).toLowerCase()))\n       ||options[0];\n     ch.previousClassName=ch.className;\n     ch.className=selected.name;\n     ch.weapons=selected.weapons;\n     ch.weapon=selected.weapons.includes(ch.weapon)?ch.weapon:selected.weapons[0];\n     ch.role=selected.role;\n     if(Array.isArray(ch.skills)){\n       ch.retiredLegacySkillNames=(ch.retiredLegacySkillNames||[]).concat(ch.skills.filter(x=>typeof x==='string'));\n       ch.skills=ch.skills.filter(x=>x&&typeof x==='object'&&x.mechanics?.effects);\n     }\n   }\n   active.push(ch);\n }\n s.characters=active;s.retiredRaceCharacters=archived;\n s.hero=active.find(x=>x.id===s.hero?.id)||active[0]||null;\n s.team=(Array.isArray(s.team)?s.team:[]).filter(id=>active.some(x=>x.id===id));\n if(!s.team.length&&s.hero)s.team=[s.hero.id];\n if(!RACES[s.race])s.race=s.hero?.race||'Kairakh';\n if(!CLASSES[s.race]?.some(x=>x.name===s.className))\n   s.className=s.hero?.race===s.race?s.hero.className:CLASSES[s.race][0].name;\n if(s.world?.civs){\n   const current=s.world.civs.filter(x=>RACES[x[0]]);\n   for(const entry of [['Kairakh','Varkh','Rhaz’Kel'],['Elfos','Elenor','Sylvaris'],\n     ['Kijins','Hokuren','Kozan'],['Vampiros','Valdrenn','Nocthera'],\n     ['Insectoides','Colmena de Irix','Thryx'],['Reptro','Voltrax','Akrion']])\n     if(!current.some(x=>x[0]===entry[0]))current.push(entry);\n   s.world.civs=current;\n }\n s._canonicalRacesVersion=5;\n return s;\n}\n";

 replaceExactly('function save(){',migration+'function save(){','Migración de partidas');
 replaceExactly('if(s){state=s;return true}',"if(s){state=migrateCanonicalRacesV5(s);save();return true}",'Carga de partidas antiguas');
}
for(const item of ['ASSETS','RACES','CLASSES','names']){
 const value=declaration(item).value;
 for(const gone of ['Humanos','Hombres Bestia','Huecos'])
   if(Object.prototype.hasOwnProperty.call(value,gone))throw new Error(item+': raza retirada '+gone);
}
const actualClasses=declaration('CLASSES').value;
for(const r of canonical){
 if(JSON.stringify(actualClasses[r.name].map(x=>x.name))!==JSON.stringify(classes[r.id].map(x=>x.name)))
   throw new Error('Clases obsoletas '+r.name);
}
if(!html.includes('migrateCanonicalRacesV5')||!html.includes(marker))
 throw new Error('Falta migración');
if(process.argv.includes('--write'))fs.writeFileSync(filepath,html);
console.log('✅ Maestro canónico: seis razas, 31 clases raciales. '+(process.argv.includes('--write')?'Guardado.':'Validado.'));
