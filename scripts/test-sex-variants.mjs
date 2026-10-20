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
assert.equal(count,38,'No deben desaparecer clases al añadir los sexos');
console.log('✅ '+races.length+' razas × 2 sexos y '+count+' clases × 2 sexos');
