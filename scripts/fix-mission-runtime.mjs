import fs from 'node:fs';
import vm from 'node:vm';
let html=fs.readFileSync('index.html','utf8');
const old="$('battleLog').after(chronicle);";
const next="const logHost=$('battleLog');if(logHost)logHost.after(chronicle);else $('battleField').after(chronicle);";
if(html.includes(old))html=html.replace(old,next);
if(!html.includes(next))throw Error('Chronicle host was not fixed');
for(const part of html.split('<script').slice(1)){
 const open=part.indexOf('>'),head=part.slice(0,open);
 if(head.includes('src='))continue;
 const code=part.slice(open+1).split('</script>')[0];
 if(code.trim())new vm.Script(code);
}
if(process.argv.includes('--write'))fs.writeFileSync('index.html',html);
console.log('✅ Crónica inicializada sin depender de elementos montados posteriormente.');
