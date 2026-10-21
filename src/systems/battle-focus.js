// Kami No Challenge: selección táctica manual de objetivo, sin movimiento manual.
// Solo la IA decide posicionamiento, habilidades y desplazamiento.
const assigned=new Map();
let battle=null;
let selected=null;
let hud=null;
const alive=u=>u&&u.hp>0;
const key=u=>String(u?.id??'');
function byId(list,id){return list.find(u=>key(u)===id&&alive(u))||null}
function ensureHud(){
 const field=document.getElementById('battleField');
 if(!field)return null;
 if(!hud||!hud.isConnected){
  hud=document.createElement('div');hud.id='kamiFocusPanel';hud.className='kami-focus-panel';
  const label=document.createElement('span');label.id='kamiFocusLabel';
  label.textContent='FOCUS: toca un héroe y luego un enemigo';
  const clear=document.createElement('button');clear.type='button';clear.id='kamiClearFocus';
  clear.textContent='Cancelar Focus';
  clear.addEventListener('click',event=>{
   event.stopPropagation();
   if(selected){assigned.delete(selected);refresh()}
  });
  hud.append(label,clear);
  field.parentElement?.append(hud);
 }
 return hud;
}
function refresh(){
 ensureHud();
 const allies=battle?.allies||[],enemies=battle?.enemies||[];
 if(selected&&!byId(allies,selected))selected=null;
 for(const [hero,foe] of [...assigned]){
  if(!byId(allies,hero)||!byId(enemies,foe))assigned.delete(hero);
 }
 for(const unit of [...allies,...enemies]){
  if(!unit.node)continue;
  const id=key(unit);
  unit.node.classList.toggle('kami-focus-selected',!unit.enemy&&id===selected);
  unit.node.classList.toggle('kami-focus-marked',unit.enemy&&selected&&assigned.get(selected)===id);
  unit.node.classList.toggle('kami-focus-assigned',unit.enemy&&[...assigned.values()].includes(id));
  if(!unit.enemy){unit.node.dataset.focusTarget=assigned.get(id)||''}
 }
 const hero=byId(allies,selected),enemy=hero&&byId(enemies,assigned.get(selected));
 const label=document.getElementById('kamiFocusLabel'),clear=document.getElementById('kamiClearFocus');
 if(label)label.textContent=hero?(hero.name+' → '+(enemy?.name||'Selecciona un enemigo')):'FOCUS: toca un héroe y luego un enemigo';
 if(clear)clear.disabled=!hero||!enemy;
}
function tick(b){
 if(!b||!Array.isArray(b.allies)||!Array.isArray(b.enemies))return;
 if(b!==battle){assigned.clear();selected=null;battle=b}
 refresh();
}
function targetFor(hero,candidates){
 if(!hero||hero.enemy)return null;
 const id=assigned.get(key(hero));
 if(!id)return null;
 const target=byId(candidates,id);
 if(!target){assigned.delete(key(hero));refresh();return null}
 return target;
}
function targetForCharacter(character,candidates){
 if(!battle)return null;
 const unit=battle.allies.find(u=>u.character===character||u.character?.id===character?.id);
 return targetFor(unit,candidates);
}
function select(hero,enemy){
 if(!battle)return false;
 const ally=byId(battle.allies,key(hero)),foe=byId(battle.enemies,key(enemy));
 if(!ally||!foe)return false;
 selected=key(ally);assigned.set(selected,key(foe));refresh();return true;
}
function onFieldClick(event){
 const node=event.target?.closest?.('#battleField .fighter[data-unit]');
 if(!node||!battle)return;
 const id=node.dataset.unit;
 const ally=byId(battle.allies,id),foe=byId(battle.enemies,id);
 if(ally){selected=id;refresh();return}
 if(foe&&selected){assigned.set(selected,id);refresh()}
}
const css=document.createElement('style');css.textContent=`
#battleField .fighter.kami-focus-selected{outline:2px solid #8de4ff!important;outline-offset:4px;filter:drop-shadow(0 0 14px #32adfb)!important}
#battleField .fighter.kami-focus-marked{outline:3px solid #ffbd5e!important;outline-offset:5px;filter:drop-shadow(0 0 18px #e74c46)!important}
#battleField .fighter.kami-focus-assigned:not(.kami-focus-marked)::after{content:'◎';position:absolute;top:-22px;right:0;font-size:19px;color:#ffcc7b;text-shadow:0 0 6px #ff3d37;pointer-events:none}
#battleField .fighter.kami-focus-marked::after{content:'⊕ FOCUS';position:absolute;top:-27px;left:50%;transform:translateX(-50%);color:#ffdb8a;font:bold 10px/1 sans-serif;text-shadow:0 0 6px #ed4335;pointer-events:none}
#battleField .fighter{cursor:pointer;touch-action:manipulation}
.kami-focus-panel{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;padding:9px 12px;margin:7px 0;background:#111e31;border:1px solid #c5a36c85;border-radius:10px;color:#eee0c5;font:11px/1.4 sans-serif}
.kami-focus-panel button{border:1px solid #d4b077;border-radius:7px;background:#29253a;color:#f3d49f;padding:7px 10px;cursor:pointer}
.kami-focus-panel button:disabled{opacity:.35}
`;
document.head.append(css);
document.addEventListener('click',onFieldClick);
window.KamiBattleFocus={tick,targetFor,targetForCharacter,select,get selected(){return selected},get assigned(){return new Map(assigned)},version:1};
