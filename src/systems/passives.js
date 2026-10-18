export const PASSIVE_RANKS=['F','E','D','C','B','A','S','SS','SSS','SSS+','U'];
export function normalizePassive(raw){return {id:raw.ID,name:raw.Pasiva,rank:raw.Rango,grade:raw.Grado,category:raw['Categoría'],archetype:raw['Arquetipo'],positive:raw['Efecto positivo'],drawback:raw['Contrapartida / Debuff'],condition:raw['Condición / Activación'],compatibility:raw['Compatibilidad'],naturalRarity:raw['Rareza natural'],origin:raw['Origen sugerido']}}
export function characterPassives(character){return Array.isArray(character.passives)?character.passives:[]}
export function passiveIsImplemented(passive){
  const text=[passive.category,passive.positive,passive.condition].join(' ').toLowerCase();
  const futureTerms=['estado alterado','debuff','tambaleo','sangrado','quemadura','recurso','bloqueo'];
  return !futureTerms.some(term=>text.includes(term));
}