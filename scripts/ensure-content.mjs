import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd();
const classes=JSON.parse(fs.readFileSync(path.join(root,'data/classes.json'),'utf8'));
const targets=JSON.parse(fs.readFileSync(path.join(root,'data/content_targets.json'),'utf8'));
const expected=Object.values(classes).flat().length*targets.skills.minimumPerClass;
const manifestPath=path.join(root,'data/generated/manifest.json');
let regenerate=true;
if(fs.existsSync(manifestPath)){
  try{
    const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
    regenerate=manifest.totalSkills!==expected||
      Object.keys(manifest.classes||{}).length!==Object.values(classes).flat().length||
      Object.values(classes).flat().some(c=>!manifest.classes?.[c.name]||
        !fs.existsSync(path.join(root,'data/generated',manifest.classes[c.name].file))||
        manifest.classes[c.name].total!==targets.skills.minimumPerClass);
  }catch{regenerate=true;}
}
if(regenerate){
  console.log('⚔️ Generando '+expected+' habilidades activas y catálogo de pasivas...');
  const result=spawnSync(process.execPath,['scripts/generate-content.mjs'],{cwd:root,stdio:'inherit'});
  if(result.status!==0)process.exit(result.status||1);
}else{
  console.log('✅ Catálogo de '+expected+' habilidades listo.');
}
