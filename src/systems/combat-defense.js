// Shared defensive reaction system for basic attacks and skill damage.
// The mitigation layer for armour/DEF remains in the caller: this module
// resolves dodge, parry and active shield blocks exactly once per hit.
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const states=new WeakMap();
const number=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
function equipmentText(unit){
 const c=unit?.character||unit?.ref||{},e=c.equipment||{};
 return [c.weapon,...Object.values(e)].filter(Boolean).map(v=>
  typeof v==='string'?v:[v?.name,v?.type,v?.family].filter(Boolean).join(' ')).join(' ').toLowerCase();
}
export function defenseProfile(unit){
 const c=unit?.character||unit?.ref||{},stats=c.stats||unit?.stats||{};
 const agility=number(stats.AGI??stats.agi??stats.agility,8);
 const dexterity=number(stats.DES??stats.DEX??stats.dexterity,agility);
 const defense=number(stats.DEF??stats.defense??unit?.defense,8);
 const text=equipmentText(unit);
 const shield=/escudo|shield|broquel|buckler/.test(text);
 const blade=/espada|sword|estoque|rapier|daga|dagger|katana/.test(text);
 const heavy=/placas|plate|pesada|heavy/.test(text);
 const explicit=c.defenseChances||{};
 return {
  dodge:clamp(number(explicit.dodge,4+agility*.19+(heavy?-3:0)),1,25)/100,
  parry:clamp(number(explicit.parry,blade?4+dexterity*.14:0),0,18)/100,
  block:clamp(number(explicit.block,shield?12+defense*.22:0),0,38)/100,
  blockReduction:clamp(number(explicit.blockReduction,shield?.62:.35),.1,.85)
 };
}
export function resolveDefense(attacker,target,amount,{rng=Math.random,unavoidable=false,unblockable=false,unparryable=false}={}){
 const incoming=Math.max(0,number(amount));
 if(!target||incoming===0)return {kind:'none',damage:incoming,prevented:0};
 if(unavoidable)return {kind:'hit',damage:incoming,prevented:0};
 const profile=defenseProfile(target);
 const roll=clamp(number(rng(),1),0,1);
 let threshold=profile.dodge;
 if(roll<threshold)return {kind:'dodge',damage:0,prevented:incoming};
 if(!unparryable){threshold+=profile.parry;
  if(roll<threshold)return {kind:'parry',damage:0,prevented:incoming};}
 if(!unblockable){threshold+=profile.block;
  if(roll<threshold){const reduced=incoming*(1-profile.blockReduction);
   return {kind:'block',damage:reduced,prevented:incoming-reduced};}}
 return {kind:'hit',damage:incoming,prevented:0};
}
export function showDefense(target,result){
 const kind=result?.kind;
 if(!target?.node||!['dodge','parry','block'].includes(kind))return;
 const node=target.node;
 const old=states.get(node);if(old)clearTimeout(old);
 node.classList.remove('kami-def-dodge','kami-def-parry','kami-def-block');
 void node.offsetWidth;
 node.classList.add('kami-def-'+kind);
 const label=document.createElement('span');
 label.className='kami-defense-label';label.textContent=
  kind==='dodge'?'ESQUIVA':kind==='parry'?'PARADA':'BLOQUEO';
 node.appendChild(label);
 const timer=setTimeout(()=>{node.classList.remove('kami-def-dodge','kami-def-parry','kami-def-block');label.remove();states.delete(node)},560);
 states.set(node,timer);
}
if(typeof document!=='undefined'){
 const css=document.createElement('style');
 css.id='kami-defense-visuals';
 css.textContent=`
 #battleField .kami-defense-label{position:absolute;z-index:120;left:50%;top:-34px;transform:translateX(-50%);white-space:nowrap;color:#b7e8ff;text-shadow:0 2px 5px #000;font:bold 10px/1.2 sans-serif;pointer-events:none;animation:kami-defense-label .55s ease-out forwards}
 #battleField .kami-def-dodge .kami-rig-svg{animation:kami-def-dodge .45s ease-out}
 #battleField .kami-def-parry .kami-rig-svg{animation:kami-def-parry .4s ease-out;filter:drop-shadow(0 0 9px #cce4ff)}
 #battleField .kami-def-block .kami-rig-svg{animation:kami-def-block .45s ease-out;filter:drop-shadow(0 0 9px #efc778)}
 @keyframes kami-def-dodge{0%,100%{translate:0 0}45%{translate:-13px -4px}}
 @keyframes kami-def-parry{50%{rotate:-9deg;translate:0 -3px}}
 @keyframes kami-def-block{45%{translate:-5px 1px;filter:brightness(1.35)}}
 @keyframes kami-defense-label{0%{opacity:0;translate:0 6px}25%,65%{opacity:1}100%{opacity:0;translate:0 -13px}}
 @media(prefers-reduced-motion:reduce){#battleField .kami-def-dodge .kami-rig-svg,#battleField .kami-def-parry .kami-rig-svg,#battleField .kami-def-block .kami-rig-svg{animation:none}}
 `;
 document.head.appendChild(css);
}
window.KamiDefense={defenseProfile,resolveDefense,showDefense,version:1};
