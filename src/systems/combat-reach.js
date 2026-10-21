// Alcance espacial canónico del combate 2.5D.
// Arena lógica de 30 x 16 metros: x e y son porcentajes de esa arena.
export const ARENA_METERS=Object.freeze({width:30,height:16});
export const WEAPON_RANGE_METERS=Object.freeze({
 fists:1.1,dagger:1.35,claws:1.45,sword:1.9,rapier:2.1,axe:2,hammer:2.1,
 greatsword:2.5,halberd:3,spear:3.2,staff:2.2,whip:3.8,
 bow:24,crossbow:25,firearm:26,wand:21,focus:23,tome:22
});
const match=(text,re)=>re.test(text);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function identityOf(item){return [item?.name,item?.type,item?.family,item?.weaponFamilyId,item?.slot,
 typeof item==='string'?item:''].filter(Boolean).join(' ').toLowerCase()}
export function weaponType(unit){
 const c=unit?.character||unit?.ref||unit||{},e=c.equipment||{};
 const weapon=c.weapon||e.weapon||e.mainHand||e.mainhand||e.arma||
  Object.entries(e).find(([k])=>/weapon|arma|main.?hand|mano.?principal/i.test(k))?.[1]||null;
 const t=[identityOf(weapon),String(c.className||''),String(c.role||'')].join(' ').toLowerCase();
 if(match(t,/alabarda|halberd/))return 'halberd';
 if(match(t,/lanza|spear|pica/))return 'spear';
 if(match(t,/mandoble|espadón|espadon|great.?sword/))return 'greatsword';
 if(match(t,/estoque|rapier/))return 'rapier';
 if(match(t,/daga|dagger|cuchillo/))return 'dagger';
 if(match(t,/garra|claw/))return 'claws';
 if(match(t,/látigo|latigo|whip/))return 'whip';
 if(match(t,/ballesta|crossbow/))return 'crossbow';
 if(match(t,/arco|bow|arquero|tirador/))return 'bow';
 if(match(t,/rifle|pistola|firearm/))return 'firearm';
 if(match(t,/martillo|maza|hammer|mace/))return 'hammer';
 if(match(t,/hacha|axe/))return 'axe';
 if(match(t,/espada|sword|blade/))return 'sword';
 if(match(t,/cetro|vara|wand/))return 'wand';
 if(match(t,/catalizador|focus/))return 'focus';
 if(match(t,/tomo|grimoire|libro mágico/))return 'tome';
 if(match(t,/bastón|baston|staff/))return match(t,/mag|taumaturgo|hechic|invoc|arconte/)?'focus':'staff';
 if(match(t,/mag|taumaturgo|hechic|invoc|arconte|chispa|rayo/))return 'focus';
 return 'fists';
}
export function weaponRangeMeters(unit){
 const c=unit?.character||unit?.ref||unit||{},e=c.equipment||{};
 const w=c.weapon||e.weapon||e.mainHand||e.mainhand||e.arma||null;
 const value=w?.rangeMeters??w?.alcanceMetros??w?.reachMeters??c.rangeMeters;
 // A named metre property overrides the weapon archetype. Old percentage-based
 // values 'reach', 'range', 'alcance' are intentionally NOT interpreted as metres.
 if(value!=null&&Number.isFinite(Number(value))&&Number(value)>0)return clamp(Number(value),.5,30);
 return WEAPON_RANGE_METERS[weaponType(unit)];
}
export function isMelee(unit){return weaponRangeMeters(unit)<=4}
export function distanceMeters(a,b){
 const dx=(Number(a.x)-Number(b.x))*ARENA_METERS.width/100;
 const dy=(Number(a.y)-Number(b.y))*ARENA_METERS.height/100;
 return Math.hypot(dx,dy);
}
export function skillRangeMeters(skill,actor){
 const m=skill?.mechanics||{},name=String(skill?.name||'').toLowerCase();
 const raw=skill?.rangeMeters??skill?.alcanceMetros??m.rangeMeters??m.alcanceMetros;
 if(raw!=null&&Number.isFinite(Number(raw))&&Number(raw)>0)return clamp(Number(raw),.5,30);
 const effects=m.effects||[];
 const ops=effects.map(x=>x.op);
 const targets=effects.map(x=>x.target);
 const kind=String(skill?.kind||'').toLowerCase();
 if(ops.length&&ops.every(op=>['heal','shield','haste','cleanse','buff'].includes(op)))return 20;
 if(targets.length&&targets.every(t=>t==='self'))return 0;
 if(/escudo|guardia|protecci[oó]n|cura|sanaci[oó]n|brote|juramento de supervivencia/.test(name))return 20;
 if(/rayo|chispa|rel[aá]mpago|fuego|explosi[oó]n|astral|arcano|avatar|descarga|hechizo|proyectil|flecha|disparo|arquero/.test(name))return 23;
 if(/embestida|carga|salto|arremetida/.test(name))return 9;
 if(/onda|barrido|giro|rugido|torbellino|area|área/.test(name))return 4.5;
 if(['blast','chain','echo'].includes(kind))return 23;
 if(['heal','shield','guard','evade','haste'].includes(kind))return 20;
 if(kind==='pierce'&&weaponType(actor)==='bow')return 24;
 if(['multi','colossus','counter','execute','guardbreak'].includes(kind))return weaponRangeMeters(actor);
 return weaponRangeMeters(actor);
}
export function withinReach(a,b,radius){return distanceMeters(a,b)<=radius+0.25}
