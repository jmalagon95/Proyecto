import fs from 'node:fs';
import vm from 'node:vm';
let html=fs.readFileSync('index.html','utf8');
const marker='<!-- KAMI_PREMIUM_LOBBY_V1 -->';
const style='<link rel="stylesheet" href="/src/ui/kami-premium-lobby.css">';
const app='<script type="module" src="/src/ui/kami-premium-lobby.js"></script>';
if(!html.includes(style)){
 if(!html.includes('</head>'))throw new Error('Cabecera del maestro no encontrada');
 html=html.replace('</head>',marker+'\n'+style+'\n</head>');
}
if(!html.includes(app)){
 if(!html.includes('</body>'))throw new Error('Cuerpo del maestro no encontrado');
 html=html.replace('</body>',app+'\n</body>');
}
for(const key of ['dormModal','sanctModal','portalModal','storeModal','menuModal','lobby'])
 if(!html.includes('id="'+key+'"'))throw new Error('Falta un menú existente: '+key);
for(const race of ['Humanos','Hombres Bestia'])
 if(html.includes('const RACES={"'+race+'"'))throw new Error('Raza retirada en catálogo');
for(const script of html.split('<script').slice(1)){
 const end=script.indexOf('>'),header=script.slice(0,end);
 if(header.includes('src='))continue;
 const code=script.slice(end+1).split('</script>')[0];
 if(code.trim())new vm.Script(code);
}
html=html.replace(/^[ \t]+$/gm,'');
if(process.argv.includes('--write'))fs.writeFileSync('index.html',html);
console.log('✅ Lobby premium, personajes, habitaciones, invocación, almacén, misiones y menú unidos al maestro.');
