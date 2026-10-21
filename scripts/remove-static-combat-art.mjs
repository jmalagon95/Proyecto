import fs from 'node:fs';
import vm from 'node:vm';
let html=fs.readFileSync('index.html','utf8');
const marker='/* KAMI_RIG_ONLY_BATTLE_V1 */';
if(!html.includes(marker)){
 const from=`node.innerHTML=\`<div class="unit-life"><i style="width:100%"></i></div><div class="unit-body" \${u.enemy?'':\`style="background-image:url('\${ASSETS[u.character.race]}')"\`}>\${u.enemy?goblinSprite:''}</div><div class="unit-name">\${esc(u.name)}</div>\`;`;
 const to=`/* KAMI_RIG_ONLY_BATTLE_V1 */
     node.innerHTML=\`<div class="unit-life"><i style="width:100%"></i></div><div class="unit-body"></div><div class="unit-name">\${esc(u.name)}</div>\`;`;
 const count=html.split(from).length-1;
 if(count!==1)throw Error('No se encuentra el constructor visual original: '+count);
 html=html.replace(from,to);
}
if(!html.includes(marker))throw Error('No se aplicó la sustitución de ilustraciones');
for(const part of html.split('<script').slice(1)){
 const header=part.slice(0,part.indexOf('>'));if(header.includes('src='))continue;
 const code=part.slice(part.indexOf('>')+1).split('</script>')[0];
 if(code.trim())new vm.Script(code);
}
if(process.argv.includes('--write'))fs.writeFileSync('index.html',html);
console.log('✅ Héroes y enemigos sin ilustración estática en el marcado del combate.');
