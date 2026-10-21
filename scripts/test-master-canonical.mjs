import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8');
const classes=JSON.parse(fs.readFileSync('data/classes.json','utf8'));
const races=JSON.parse(fs.readFileSync('data/races.json','utf8'));
function lookup(name){
 const marker='const '+name+'=';
 const start=html.indexOf(marker);
 assert.ok(start>=0,'Falta '+name);
 const begin=start+marker.length;
 let nested=0,quote=false,escape=false;
 for(let i=begin;i<html.length;i++){
  const c=html[i];
  if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quote=false;}
  else if(c==='"')quote=true;
  else if(c==='{')nested++;
  else if(c==='}'&&!--nested)return JSON.parse(html.slice(begin,i+1));
 }
 throw Error('No es posible leer '+name);
}
const actualRaces=lookup('RACES'),actualClasses=lookup('CLASSES');
assert.deepEqual(Object.keys(actualRaces),races.map(r=>r.name));
assert.deepEqual(Object.keys(actualClasses),races.map(r=>r.name));
for(const r of races)assert.deepEqual(actualClasses[r.name].map(c=>c.name),classes[r.id].map(c=>c.name),r.id);
assert.equal(Object.values(actualClasses).flat().length,31);
for(const unwanted of ['Humanos','Hombres Bestia','Huecos']){
 assert.equal(actualRaces[unwanted],undefined);
 assert.equal(actualClasses[unwanted],undefined);
 assert.equal(lookup('ASSETS')[unwanted],undefined);
}
assert.ok(html.includes('/* KAMI_CANONICAL_RACES_V5 */'));
assert.ok(html.includes('migrateCanonicalRacesV5(s)'));
assert.ok(!html.includes('Math.random()*8)'));
const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(Boolean);
assert.ok(inline.length>=1);
for(const script of inline)new vm.Script(script);
console.log('✅ Prototipo maestro: 6 razas, 31 clases, migración y JavaScript válido');
