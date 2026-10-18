export const STAR_LEVEL_CAPS={1:10,2:20,3:30,4:40,5:50,6:60,7:70,8:80};

export function levelCap(character){return STAR_LEVEL_CAPS[character.currentStar]||80}

export function ascensionRequirement(character,state){
  const rank=character.currentStar;
  if(rank>=8)return {possible:false,reason:'★8 es el rango máximo.',rank,owned:0,needed:0};
  const owned=Number(state.progression?.ascensionStones?.[rank]||0);
  return {
    possible:character.level>=levelCap(character)&&owned>=1,
    rank,owned,needed:1,
    stoneName:`Piedra de Ascensión ★${rank}`,
    levelRequired:levelCap(character)
  };
}

export function ascendCharacter(character,state){
  const req=ascensionRequirement(character,state);
  if(!req.possible)return {ok:false,requirement:req};
  state.progression.ascensionStones[req.rank]-=1;
  character.currentStar+=1;
  character.level=1;
  return {ok:true,character};
}

export function craftAscensionStone(state,rank,characterIds){
  if(rank<1||rank>7)return {ok:false,reason:'Rango inválido.'};
  const ids=[...new Set(characterIds||[])];
  const candidates=(state.characters||[]).filter(c=>ids.includes(c.id)&&!c.dead&&c.currentStar===rank);
  if(candidates.length!==10)return {ok:false,reason:`Necesitas exactamente 10 personajes ★${rank}.`};
  if(candidates.some(c=>c.id===state.activeCharacterId))return {ok:false,reason:'No puedes consumir al personaje activo.'};
  const consumed=new Set(candidates.map(c=>c.id));
  state.characters=state.characters.filter(c=>!consumed.has(c.id));
  state.progression.ascensionStones[rank]=(state.progression.ascensionStones[rank]||0)+1;
  return {ok:true,stoneRank:rank};
}
