let manifestCache=null;
const classCache=new Map();
let passiveCache=null;

export async function loadGeneratedManifest(){
  if(manifestCache)return manifestCache;
  manifestCache=await fetch('/data/generated/manifest.json').then(r=>{if(!r.ok)throw new Error('Generated content missing');return r.json()});
  return manifestCache;
}

export async function loadGeneratedPassives(){
  if(passiveCache)return passiveCache;
  passiveCache=await fetch('/data/generated/passives.json').then(r=>r.json());
  return passiveCache.items;
}

export async function loadSkillsForClass(className){
  if(classCache.has(className))return classCache.get(className);
  const manifest=await loadGeneratedManifest();
  const entry=manifest.classes[className];
  if(!entry)throw new Error('No generated skills for '+className);
  const data=await fetch('/data/generated/'+entry.file).then(r=>r.json());
  classCache.set(className,data.items);
  return data.items;
}

export async function verifyContentTargets(){
  const manifest=await loadGeneratedManifest();
  return {
    passiveTarget:9000,
    passiveActual:manifest.passives,
    skillsTotal:manifest.totalSkills,
    classCount:Object.keys(manifest.classes).length,
    perClass:Object.fromEntries(Object.entries(manifest.classes).map(([k,v])=>[k,v.total]))
  };
}
