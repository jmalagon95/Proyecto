const RACE_PHONEMES={
  kairakh:{
    onset:['k','v','r','th','z','kh','n','s'],
    vowel:['a','e','i','o'],
    endings:['r','k','th','n','s','m','l','x']
  },
  elfos:{
    onset:['a','e','l','s','th','v','n','r'],
    vowel:['ae','ei','ia','y'],
    endings:['el','iel','ion','ir','is','ael','eth','yn']
  },
  kijins:{
    onset:['ka','ra','shi','yo','ku','zan','rei','to'],
    vowel:['a','i','o','u'],
    endings:['maru','jin','ra','to','zen','ki','do','shi']
  },
  vampiros:{
    onset:['va','ka','se','no','ri','ve','dra','lu'],
    vowel:['a','e','i','o'],
    endings:['r','n','s','l','th','v','en','is']
  },
  insectoides:{
    onset:['ki','xi','tri','ve','za','shi','kra','ni'],
    vowel:['a','i','o','u'],
    endings:['x','th','k','r','n','s','q','z']
  },
  reptro:{
    onset:['r','s','th','k','z','vr','sk','kr'],
    vowel:['a','e','i','o'],
    endings:['k','ss','r','th','x','n','z','q']
  }
};

export const NAMES_PER_RACE=1048576;
export const TOTAL_NAME_SPACE=NAMES_PER_RACE*6;

function segmentSet(raceId){
  const p=RACE_PHONEMES[raceId]||RACE_PHONEMES.kairakh;
  const segments=[];
  for(const o of p.onset)for(const v of p.vowel)segments.push(o+v);
  return {segments,endings:p.endings};
}

function capitalize(v){return v.charAt(0).toUpperCase()+v.slice(1)}

export function nameFromIndex(raceId,index){
  const {segments,endings}=segmentSet(raceId);
  let n=((Number(index)||0)%NAMES_PER_RACE+NAMES_PER_RACE)%NAMES_PER_RACE;
  const a=n&31;n>>=5;
  const b=n&31;n>>=5;
  const c=n&31;n>>=5;
  const d=n&31;
  // Four base-32 choices = 1,048,576 deterministic combinations per race.
  const end=endings[d%endings.length]+(RACE_PHONEMES[raceId]?.vowel||RACE_PHONEMES.kairakh.vowel)[Math.floor(d/endings.length)%4];
  const raw=segments[a]+segments[b]+segments[c]+end;
  return capitalize(raw.replace(/(.)\1{2,}/g,'$1$1'));
}

function randomIndex(){
  if(globalThis.crypto?.getRandomValues){
    const buf=new Uint32Array(1);crypto.getRandomValues(buf);return buf[0]%NAMES_PER_RACE;
  }
  return Math.floor(Math.random()*NAMES_PER_RACE);
}

export function generateUniqueName(raceId,existingNames=[]){
  const used=new Set((existingNames||[]).map(x=>String(x).toLocaleLowerCase('es')));
  for(let tries=0;tries<256;tries++){
    const name=nameFromIndex(raceId,randomIndex());
    if(!used.has(name.toLocaleLowerCase('es')))return name;
  }
  const start=randomIndex();
  for(let i=0;i<NAMES_PER_RACE;i++){
    const name=nameFromIndex(raceId,(start+i)%NAMES_PER_RACE);
    if(!used.has(name.toLocaleLowerCase('es')))return name;
  }
  return 'Aspirante';
}
