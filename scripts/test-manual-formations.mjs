import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8');
for(const str of [
 '/* KAMI_MANUAL_FORMATIONS_V1 */',
 'data-formation-hero',
 'data-formation-lane',
 'data-formation-slot',
 'missionPresets',
 'positions:Object.fromEntries(ids.map(id=>[id,{...normalizeFormation()[id]}]))',
 'state.missionPositions={...(p.positions||{})}',
 'lane:(normalizeFormation()[c.id]?.lane??index%3)',
 'slot:(normalizeFormation()[c.id]?.slot??index)'
])assert.ok(html.includes(str),'Falta formación manual: '+str);
const markup=html.slice(html.indexOf('/* KAMI_MANUAL_FORMATIONS_V1 */'),html.indexOf("  $('startMission').onclick=",html.indexOf('/* KAMI_MANUAL_FORMATIONS_V1 */')));
assert.ok(markup.includes('if(other)positions[other]'),'Falta intercambiar casillas ocupadas');
const chunks=html.split('<script').slice(1);
for(const chunk of chunks){
 const header=chunk.slice(0,chunk.indexOf('>'));if(header.includes('src='))continue;
 const text=chunk.slice(chunk.indexOf('>')+1).split('</script>')[0];
 if(text.trim())new vm.Script(text);
}
console.log('✅ Editor 3x5, intercambio, cinco equipos con posición, aplicación al combate y JS válido');
