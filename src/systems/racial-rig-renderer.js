import {racialRigFor} from './racial-rig-profiles.js';
const NS='http://www.w3.org/2000/svg';
function el(tag,attrs,parent){
 const n=document.createElementNS(NS,tag);
 for(const [key,val] of Object.entries(attrs||{}))n.setAttribute(key,String(val));
 parent.appendChild(n);return n;
}
const path=(g,d,stroke,fill='none',w=1.4,extra={})=>el('path',{d,fill,stroke,'stroke-width':w,'stroke-linecap':'round','stroke-linejoin':'round',...extra},g);
function ornament(nodes,bone,id){
 const g=el('g',{'data-race-ornament':id},nodes[bone]);return g;
}
export function installRacialRig(nodes,character){
 const config=racialRigFor(character);
 if(!config)return {race:'neutral',animated:[]};
 const {tone,shadow,accent,id}=config;
 for(const [bone,node] of Object.entries(nodes)){
  node.setAttribute('data-racial-bone',id);
  // El cambio de morfología afecta a la silueta de la pieza pero NO mueve
  // su origen/pivote ni los sockets de armas, magia o efectos.
  const body=node.querySelector?.(':scope > path,:scope > ellipse,:scope > rect');
  if(body){
    const isSkin=!/foot/.test(bone);
    body.setAttribute('fill',isSkin?tone:shadow);
    // Escalamos ÚNICAMENTE la pieza gráfica, nunca el nodo-hueso:
    // los pivotes, hijos y sockets mantienen coordenadas idénticas.
    const width=bone==='head'?config.headScale:
      bone==='chest'||bone==='root'?config.build:
      /shoulder|hip/.test(bone)?(1+(config.build-1)*.7):
      /elbow|knee/.test(bone)?(1+(config.build-1)*.4):1;
    const height=bone==='head'?(id==='elfos'?.99:1.02):1;
    body.setAttribute('transform','scale('+width.toFixed(3)+' '+height.toFixed(3)+')');
    body.setAttribute('data-anatomy-shape',id);
  }
 }
 const face=ornament(nodes,'head','face');
 // Todos mantienen una cara animable: únicamente cambian sus rasgos.
 if(id==='kairakh'){
  path(face,'M 0 -25 L -5 -41 Q 0 -47 5 -41 Z','#784a5f',shadow,1.2,{'data-feature':'single_center_horn'});
  path(face,'M -11 -12 L -24 -17 L -13 -7 M 11 -12 L 24 -17 L 13 -7',shadow,tone,2,{'data-feature':'pointed_ears'});
  path(face,'M -10 -14 L -3 -13 M 3 -13 L 10 -14',accent,'none',2.2,{'data-feature':'war_eyes'});
  path(face,'M -5 2 l 2 4 2 -4 M 1 2 l 2 4 2 -4','#e8e7e7','none',1.3,{'data-feature':'fangs'});
  const veins=ornament(nodes,'chest','energy_veins');
  path(veins,'M -15 -11 L -9 -6 L -5 3 M 15 -11 L 9 -6 L 5 3 M -2 7 L 0 14 L 3 17',accent,'none',1.5,{'data-feature':'energy_veins'});
 }else if(id==='elfos'){
  path(face,'M -10 -15 L -32 -28 L -16 -6 Z M 10 -15 L 32 -28 L 16 -6 Z',shadow,tone,1.1,{'data-feature':'long_pointed_ears'});
  path(face,'M -8 -12 Q -5 -14 -2 -13 M 2 -13 Q 5 -14 8 -12',accent,'none',1.1,{'data-feature':'refined_eyes'});
 }else if(id==='kijins'){
  path(face,'M -11 -22 Q -22 -39 -16 -41 Q -9 -43 -5 -26 Z M 11 -22 Q 22 -39 16 -41 Q 9 -43 5 -26 Z',shadow,shadow,1.1,{'data-feature':'paired_horns'});
  path(face,'M -7 -10 L -9 -2 M 7 -10 L 9 -2',accent,'none',1.8,{'data-feature':'tear_marks'});
 }else if(id==='vampiros'){
  path(face,'M -8 -12 Q -5 -16 -1 -12 M 1 -12 Q 5 -16 8 -12',accent,'none',2,{'data-feature':'predator_eyes'});
  path(face,'M -5 1 L -3 6 L -1 1 M 1 1 L 3 6 L 5 1','#f8edf0','none',1.4,{'data-feature':'fangs'});
  path(face,'M -8 -18 L -17 -18 M 8 -18 L 17 -18',shadow,'none',.7);
 }else if(id==='insectoides'){
  path(face,'M -8 -24 Q -20 -43 -13 -46 M 8 -24 Q 20 -43 13 -46',accent,'none',1.9,{'data-feature':'antennae'});
  path(face,'M -9 -15 L -2 -19 L -2 -10 Z M 9 -15 L 2 -19 L 2 -10 Z',shadow,accent,1,{'data-feature':'compound_eyes'});
  path(face,'M -10 -1 L -2 5 M 10 -1 L 2 5',shadow,'none',2,{'data-feature':'mandibles'});
  for(const bone of ['chest','spine','shoulderL','shoulderR','hipL','hipR']){
   const g=ornament(nodes,bone,'chitin');
   path(g,'M -9 -6 Q 0 -13 9 -6 M -9 2 Q 0 8 9 2',shadow,'none',2,{'data-feature':'chitin'});
  }
 }else if(id==='goblin'){
  path(face,'M -11 -14 L -30 -24 L -14 -4 Z M 11 -14 L 30 -24 L 14 -4 Z',shadow,tone,1.2,{'data-feature':'long_ears'});
  path(face,'M -9 -13 L -3 -11 M 3 -11 L 9 -13','#2b1d12','none',2.2,{'data-feature':'angry_brows'});
  el('circle',{cx:-6,cy:-9,r:1.7,fill:accent},face);el('circle',{cx:6,cy:-9,r:1.7,fill:accent},face);
  path(face,'M 0 -9 Q 5 -3 1 0',shadow,'none',1.6,{'data-feature':'hooked_nose'});
  path(face,'M -6 3 L -4 6 L -2 3 L 0 6 L 2 3 L 4 6 L 6 3','#efe3c0','none',1,{'data-feature':'teeth'});
  const cloth=ornament(nodes,'root','loincloth');
  path(cloth,'M -16 -4 L 16 -4 L 11 22 L 2 16 L -6 24 L -12 14 Z','#3b2a1c','#6b4a2c',1.2,{'data-feature':'loincloth'});
  const club=ornament(nodes,'wristR','club');
  path(club,'M -2 6 L 3 6 L 6 46 L -5 46 Z','#3b2a1c','#7a5a36',1.2,{'data-feature':'club'});
  path(club,'M -8 40 Q 0 30 9 40 L 10 58 Q 0 66 -9 58 Z','#3b2a1c','#8b6a42',1.2);
  for(const [x,y] of [[-6,46],[7,48],[0,58]])el('circle',{cx:x,cy:y,r:1.8,fill:'#bdbdb0'},club);
 }else if(id==='reptro'){
  path(face,'M -10 -17 Q -6 -21 -1 -15 Q -6 -10 -10 -17 Z M 10 -17 Q 6 -21 1 -15 Q 6 -10 10 -17 Z',shadow,accent,1,{'data-feature':'reptilian_eyes'});
  path(face,'M -12 -12 L -15 -12 M 12 -12 L 15 -12',shadow,'none',2,{'data-feature':'ear_openings'});
  path(face,'M -9 -3 Q 0 7 9 -3',shadow,'none',1,{'data-feature':'serpentine_mouth'});
  for(const bone of ['chest','spine','hipL','hipR']){
   const g=ornament(nodes,bone,'scales');
   for(let i=-1;i<=1;i++)path(g,'M '+(i*7-3)+' -6 l 3 3 l 3 -3',shadow,'none',.9,{'data-feature':'scales'});
  }
  const lightning=ornament(nodes,'head','electric_hair');
  path(lightning,'M -11 -29 L -19 -43 L -9 -40 L -6 -51 L 0 -39 L 7 -47 L 11 -32 L 20 -38 L 13 -23',accent,'none',2.3,{'data-feature':'electric_hair'});
  const tail=ornament(nodes,'root','electric_tail');
  path(tail,'M 13 2 L 26 7 L 20 17 L 42 22 L 31 31 L 53 38',accent,'none',2.4,{'data-feature':'electric_tail'});
  for(const bone of ['wristL','wristR']){
   const g=ornament(nodes,bone,'retractile_claws');
   path(g,'M -5 9 l -4 6 M 1 11 l 1 6 M 5 8 l 5 6',shadow,'none',1.3,{'data-feature':'retractile_claws'});
  }
 }
 const accents=[...Object.values(nodes)].flatMap(n=>[...n.querySelectorAll('[data-feature="electric_hair"],[data-feature="electric_tail"],[data-feature="energy_veins"]')]);
 return {race:id,animated:accents};
}
export function tickRacialRig(layer,clock){
 if(!layer?.animated?.length)return;
 const pulse=.58+.42*Math.sin(clock*9);
 for(const node of layer.animated){
  node.style.opacity=String(pulse);
  node.setAttribute('stroke-width',String(1.4+pulse*1.2));
 }
}
