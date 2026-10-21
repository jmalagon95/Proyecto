import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd();
const classes=Object.values(JSON.parse(fs.readFileSync('data/classes.json','utf8'))).flat();
const target=JSON.parse(fs.readFileSync('data/content_targets.json','utf8'));
const expected=target.skills.minimumPerClass;
assert.equal(expected,1000);
assert.equal(Object.values(target.skills.rankCountsPerClass).reduce((a,b)=>a+b,0),1000);
const generated=spawnSync(process.execPath,['scripts/ensure-content.mjs'],{cwd:root,stdio:'inherit'});
assert.equal(generated.status,0,'El generador ha fallado');
const manifest=JSON.parse(fs.readFileSync('data/generated/manifest.json','utf8'));
assert.equal(Object.keys(manifest.classes).length,classes.length);
assert.equal(manifest.totalSkills,classes.length*1000);
const allIds=new Set();
for(const cls of classes){
  const entry=manifest.classes[cls.name];
  assert.ok(entry,'Falta '+cls.name);
  const content=JSON.parse(fs.readFileSync(path.join('data/generated',entry.file),'utf8'));
  assert.equal(content.items.length,1000,cls.name);
  const rankCounts={};
  for(const skill of content.items){
    assert.equal(skill.className,cls.name);
    assert.equal(skill.type,'active');
    assert.equal(skill.resolverCompatible,true);
    assert.equal(skill.implementedInAutoCombat,entry.group!=='generic');
    assert.ok(!allIds.has(skill.id),'Identificador duplicado '+skill.id);
    allIds.add(skill.id);
    rankCounts[skill.rank]=(rankCounts[skill.rank]||0)+1;
    assert.ok(cls.weapons.includes(skill.weaponRequirement),'Arma ajena: '+cls.name);
    assert.ok(skill.mechanics.cooldownSeconds>0);
    assert.ok(skill.mechanics.timeCostSeconds>0);
    for(const e of skill.mechanics.effects){
      assert.ok(['damage','heal','shield','penetration_pct','bonus_damage_pct_max_hp','summon_strike','vulnerability','haste'].includes(e.op),'Efecto no compatible: '+e.op);
      if(['damage','summon_strike','bonus_damage_pct_max_hp'].includes(e.op))assert.ok(['single','area'].includes(e.target));
      if(e.op==='heal')assert.equal(e.target,'ally');
      if(e.op==='shield')assert.ok(['self','ally'].includes(e.target));
    }
  }
  assert.deepEqual(rankCounts,target.skills.rankCountsPerClass,'Reparto incorrecto '+cls.name);
}
console.log('✅ '+allIds.size+' habilidades activas únicas verificadas, '+classes.length+' clases y 11 rangos');
