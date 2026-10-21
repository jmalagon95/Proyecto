// Gacha único de atributos de nacimiento: la misma tirada para héroes y enemigos.
// Las estrellas del enemigo están fijadas por su plantilla (★1 en fase 1),
// pero cada aparición vuelve a tirar los seis atributos exactamente como un PJ.
export const STAR_STAT_RANGES=Object.freeze({1:[1,5],2:[2,8],3:[4,13],4:[8,25],5:[18,40],6:[30,65],7:[50,95],8:[80,140]});
export const PRIMARY_STATS=Object.freeze(['FUE','AGI','CON','DEF','INT','VOL']);
export function rollStatsForStar(star=1,random=Math.random){
 const range=STAR_STAT_RANGES[star];
 if(!range)throw new Error('Rareza de atributos inexistente: '+star);
 const [min,max]=range;
 const stats={};
 for(const stat of PRIMARY_STATS)stats[stat]=min+Math.floor(Math.min(.999999999999,Math.max(0,random()))*(max-min+1));
 return stats;
}
export function createEnemyCharacter({name='Goblin',star=1,level=1,role='Guerrero'}={},random=Math.random){
 return {id:null,name,enemy:true,star,level,currentStar:star,role,
  stats:rollStatsForStar(star,random),equipment:{},skills:[]};
}
