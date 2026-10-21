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
 const migration=String.raw