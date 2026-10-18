export const EQUIPMENT_SLOTS = [
  { id:'armor', label:'Armadura', accepts:['armor'] },
  { id:'helmet', label:'Casco', accepts:['helmet'] },
  { id:'leftHand', label:'Mano izquierda', accepts:['weapon','shield','focus'] },
  { id:'rightHand', label:'Mano derecha', accepts:['weapon','shield','focus'] },
  { id:'legs', label:'Piernas', accepts:['legs'] },
  { id:'hands', label:'Manos', accepts:['hands'] },
  { id:'feet', label:'Pies', accepts:['feet'] },
  { id:'neck', label:'Cuello', accepts:['neck'] },
  { id:'ring1', label:'Anillo I', accepts:['ring'] },
  { id:'ring2', label:'Anillo II', accepts:['ring'] }
];

export function emptyEquipment(){
  return Object.fromEntries(EQUIPMENT_SLOTS.map(slot=>[slot.id,null]));
}

export function normalizeEquipment(character){
  character.equipment={...emptyEquipment(),...(character.equipment||{})};
  return character.equipment;
}

export function canEquip(item,slotId,character=null){
  if(!item||!slotId)return false;
  const slot=EQUIPMENT_SLOTS.find(s=>s.id===slotId);
  if(!slot)return false;
  if(item.equipSlot && item.equipSlot!==slotId && !(item.equipSlot==='hand'&&['leftHand','rightHand'].includes(slotId)))return false;
  if(!slot.accepts.includes(item.category))return false;
  if(item.category==='weapon'&&character&&Array.isArray(item.allowedClasses)&&item.allowedClasses.length){
    const className=character.className||character.classId||'';
    const allowed=item.allowedClasses.some(x=>(typeof x==='string'?x:x?.name)===className);
    if(!allowed)return false;
  }
  return true;
}

export function equipItem(character,item,slotId){
  const equipment=normalizeEquipment(character);
  if(!canEquip(item,slotId,character)){
    if(item?.category==='weapon'&&Array.isArray(item.allowedClasses)&&item.allowedClasses.length){
      return {ok:false,reason:'La clase de este personaje no puede usar esta arma.'};
    }
    return {ok:false,reason:'Ese objeto no pertenece a este hueco de equipo.'};
  }

  if(item.category==='weapon'&&item.hands===2){
    if(!['leftHand','rightHand'].includes(slotId))return {ok:false,reason:'Un arma a dos manos debe equiparse en las manos.'};
    equipment.leftHand=item;
    equipment.rightHand={linkedTo:item.id||item.name,twoHandedMirror:true};
    return {ok:true};
  }

  if(['leftHand','rightHand'].includes(slotId)){
    const other=slotId==='leftHand'?'rightHand':'leftHand';
    const otherItem=equipment[other];
    if(otherItem?.twoHandedMirror || equipment[slotId]?.twoHandedMirror){
      equipment.leftHand=null; equipment.rightHand=null;
    }
    if(equipment[other]?.category==='weapon'&&equipment[other]?.hands===2){
      equipment.leftHand=null; equipment.rightHand=null;
    }
  }

  equipment[slotId]=item;
  return {ok:true};
}

export function unequipSlot(character,slotId){
  const equipment=normalizeEquipment(character);
  const item=equipment[slotId];
  if(item?.category==='weapon'&&item.hands===2 || item?.twoHandedMirror){
    equipment.leftHand=null; equipment.rightHand=null;
  } else equipment[slotId]=null;
}
