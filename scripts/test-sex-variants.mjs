import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const races=JSON.parse(readFileSync(new URL('../data/races.json',import.meta.url),'utf8'));
const classes=JSON.parse(readFileSync(new URL('../data/classes.json',import.meta.url),'utf8'));
const SEXES=['masculino','femenino'];
assert.equal(races.length,6,'Se esperaban seis razas existentes');
for(const race of races){
  assert.deepEqual(race.availableSexes,SEXES,race.id);
  for(const sex of SEXES)assert.ok(race.portraits[sex],race.id+': '+sex);
  assert.ok(Array.isArray(classes[race.id]),'Clases raciales inexistentes para '+race.id);
}
let count=0;
for(const pool of Object.values(classes)){
  for(const cls of pool){
    count++;
    assert.deepEqual(cls.availableSexes,SEXES,cls.name);
  }
}
assert.equal(count,39,'Se esperan 8 genéricas y 31 raciales');
for(const id of ['humanos','hombres_bestia'])assert.equal(classes[id],undefined,'La raza retirada sigue en el catálogo: '+id);
assert.equal(classes.kairakh.length,6,'Los Kairakh necesitan 6 clases raciales');
const names=Object.values(classes).flat().map(c=>c.name);
assert.equal(new Set(names).size,39,'Las 39 clases deben tener nombres únicos');
const compatibility=JSON.parse(readFileSync(new URL('../data/equipment/weapon_class_compatibility.json',import.meta.url),'utf8'));
for(const cls of Object.values(classes).flat())if(cls.weaponFamilyIds){
  for(const family of cls.weaponFamilyIds)assert.ok(compatibility.families[family]?.includes(cls.name),'Arma no compatible '+cls.name+' / '+family);
}
console.log('✅ '+races.length+' razas disponibles y '+count+' clases catalogadas para ambos sexos');
