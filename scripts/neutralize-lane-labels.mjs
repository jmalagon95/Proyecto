import fs from 'node:fs';
import vm from 'node:vm';
let html=fs.readFileSync('index.html','utf8');
const legacy="const labels=['TRASERO','MEDIO','FRONTAL'];";
const fresh="const labels=['CARRIL 1','CARRIL 2','CARRIL 3'];";
if(html.includes(legacy))html=html.replace(legacy,fresh);
if(!html.includes(fresh))throw Error('No se encuentra editor de formaciones');
html=html.replace("const lane=window.KamiBattleLanes?.laneFor(char,index)??index%3;","const lane=index%3;");
html=html.replace("['Línea norte','Línea media','Línea sur']","['Carril 1','Carril 2','Carril 3']");
html=html.replace("Campo de 3 carriles invisibles","Campo de tres carriles");
if(!html.includes("const labels=['CARRIL 1','CARRIL 2','CARRIL 3'];"))throw Error('Carriles sin neutralizar');
for(const chunk of html.split('<script').slice(1)){
 const header=chunk.slice(0,chunk.indexOf('>'));
 if(header.includes('src='))continue;
 const js=chunk.slice(chunk.indexOf('>')+1).split('</script>')[0];
 if(js.trim())new vm.Script(js);
}
if(process.argv.includes('--write'))fs.writeFileSync('index.html',html);
console.log('✅ Menú y batalla: tres carriles numerados, sin jerarquía frontal/media/trasera.');
