// Kami No Challenge — Kairakh ★1, espada de madera.
// Piezas SVG independientes adheridas al rig de 19 articulaciones.
// Arte provisional de producción; las piezas pintadas se podrán sustituir
// individualmente por sprites RGBA manteniendo huesos y sockets.
const NS='http://www.w3.org/2000/svg';
const palette={skin:'#c59b8e',highlight:'#e0b4a3',ink:'#342c34',linen:'#d1c8b8',cloth:'#383139',
 red:'#75414b',wrap:'#a79b8e',wood:'#97734c',woodLight:'#bc9870',hair:'#e2e7f1',hairShadow:'#a8afc6'};
const defs={
 root:[['path','M -20 -7 L 20 -7 L 17 12 L -17 12 Z','cloth'],['path','M -22 -3 L 22 -3 L 10 6 L -8 6 Z','red'],['path','M 0 5 L 9 39 L 1 45 L -9 13 Z','red']],
 spine:[['path','M -13 -1 L 13 -1 L 11 -26 L -11 -26 Z','skin'],['path','M -13 -15 Q -3 -12 8 -24 L 13 -19 L -10 -5 Z','linen']],
 chest:[['path','M -23 -12 Q 0 -20 24 -10 L 16 17 L -15 17 Z','skin'],['path','M -22 -15 L 1 -6 L 16 18 L 9 20 L -23 -8 Z','linen'],['path','M -11 4 L -5 9 L -1 7 M 6 0 L 12 6 L 15 2','red','none']],
 neck:[['path','M -6 -13 L 6 -13 L 5 3 L -5 3 Z','skin']],
 head:[['path','M -12 -22 L -18 -8 L -14 5 L -9 -1 L 12 -8 L 13 -22 Z','hairShadow'],['ellipse',[-12,-27,24,34],'skin'],['path','M -13 -22 Q -17 -41 -1 -40 Q 13 -43 17 -30 L 9 -15 L 6 -33 L -1 -26 L -10 -30 Z','hair'],['path','M 2 -34 Q 8 -55 12 -53 Q 13 -45 7 -31 Z','red'],['path','M -9 -11 L -2 -13 M 3 -13 L 10 -11','ink','none'],['path','M -6 1 Q 0 4 6 1','ink','none']],
 shoulderL:[['path','M -9 -3 Q -14 10 -7 29 L 5 29 Q 12 10 8 -3 Z','skin'],['path','M -8 -1 Q 0 -9 9 1 L 10 7 L -10 7 Z','linen']],
 elbowL:[['path','M -7 -3 Q -11 9 -5 30 L 6 30 Q 9 11 7 -3 Z','skin'],['path','M -8 13 L 7 9 M -7 20 L 7 16 M -7 28 L 5 24','wrap','none']],
 wristL:[['ellipse',[-7,-2,14,17],'skin'],['path','M -7 1 L 6 -1 M -6 8 L 6 6','wrap','none']],
 shoulderR:[['path','M -9 -3 Q -14 10 -7 29 L 5 29 Q 12 10 8 -3 Z','skin'],['path','M -8 -1 Q 0 -7 8 0 L 9 8 L -9 8 Z','linen']],
 elbowR:[['path','M -7 -3 Q -11 9 -5 30 L 6 30 Q 9 11 7 -3 Z','skin'],['path','M -8 13 L 7 9 M -7 20 L 7 16 M -7 28 L 5 24','wrap','none']],
 wristR:[['ellipse',[-7,-2,14,18],'skin'],['path','M -7 2 L 6 -1 M -6 9 L 6 7','wrap','none']],
 hipL:[['path','M -14 -2 L 11 -2 L 13 43 Q -5 48 -13 41 Z','cloth'],['path','M -13 25 L 8 28 L 5 33 L -9 31','red']],
 kneeL:[['path','M -10 -5 L 8 -5 L 7 42 L -6 42 Z','cloth'],['path','M -7 11 L 7 6 M -8 20 L 7 14 M -6 32 L 7 25','wrap','none']],
 ankleL:[['path','M -8 -5 L 8 -5 L 7 17 L -8 17 Z','wrap']],
 footL:[['path','M -6 -2 L 7 -2 L 15 7 Q 11 12 -7 8 Z','wood']],
 hipR:[['path','M -13 -2 L 13 -2 L 12 44 Q -6 47 -12 40 Z','cloth'],['path','M -10 28 L 11 26 L 6 32 L -7 34','red']],
 kneeR:[['path','M -9 -5 L 10 -5 L 6 42 L -7 42 Z','cloth'],['path','M -8 11 L 8 8 M -7 19 L 7 17 M -6 30 L 7 25','wrap','none']],
 ankleR:[['path','M -8 -5 L 8 -5 L 7 17 L -8 17 Z','wrap']],
 footR:[['path','M -6 -2 L 7 -2 L 15 7 Q 11 12 -7 8 Z','wood']]
};
function svg(name,attrs,parent){
 const n=document.createElementNS(NS,name);
 for(const [key,value] of Object.entries(attrs))n.setAttribute(key,String(value));
 parent.appendChild(n);return n;
}
function insert(node,tag,attributes){
 // Keep skeleton children underneath the illustrated limb artwork.
 const firstBone=[...node.children].find(n=>n.hasAttribute?.('data-bone')||n.attrs?.['data-bone']);
 const a=document.createElementNS(NS,tag);
 for(const [k,v] of Object.entries(attributes))a.setAttribute(k,String(v));
 if(node.insertBefore)node.insertBefore(a,firstBone||null);else node.appendChild(a);
 return a;
}
function paint(node,id){
 for(const item of defs[id]||[]){
  const [type,geometry,color,fill]=item;
  let attrs={fill:fill||palette[color],stroke:palette.ink,'stroke-width':1.15,'stroke-linecap':'round','stroke-linejoin':'round'};
  if(type==='path')attrs.d=geometry;
  if(type==='ellipse'){const [x,y,w,h]=geometry;Object.assign(attrs,{cx:x+w/2,cy:y+h/2,rx:w/2,ry:h/2})}
  insert(node,type,attrs);
 }
}
export function isWoodSwordKairakh(character){
 if(!character||String(character.race||'').toLowerCase()!=='kairakh')return false;
 const rarity=Number(character.currentStar??character.star??0);
 if(rarity!==1)return false;
 const explicit=JSON.stringify(character.equipment||character.weapon||{}).toLowerCase();
 // Primer combatiente Kairakh ★1 sin equipamiento especial: espada pobre de entrenamiento.
 return !/lanza|hacha|maza|báculo|arco|escudo|guantelete|martillo/.test(explicit);
}
export function installWoodSwordKairakh({nodes,svg:root},character){
 if(!isWoodSwordKairakh(character))return false;
 for(const [bone,node] of Object.entries(nodes)){
  // Retain nested bone groups, sockets and anatomical pivots, but replace
  // mannequin silhouette; avoid painting the default mannequin over cloth.
  [...node.children].filter(n=>['path','ellipse','rect','circle'].includes(n.tagName.toLowerCase())).forEach(n=>{if(n.remove)n.remove();else node.children.splice(node.children.indexOf(n),1)});
  paint(node,bone);
 }
 const arm=nodes.wristR;
 const weapon=svg('g',{'data-equipped-item':'wooden-training-sword'},arm);
 svg('path',{d:'M -4 1 L 4 1 L 4 -29 L -4 -29 Z',fill:palette.wood,stroke:palette.ink,'stroke-width':1.4},weapon);
 svg('path',{d:'M -5 -29 L -6 -88 L 0 -98 L 6 -88 L 5 -29 Z',fill:palette.wood,stroke:palette.ink,'stroke-width':1.5},weapon);
 svg('path',{d:'M -2 -34 L -2 -83',stroke:palette.woodLight,'stroke-width':1.2},weapon);
 svg('path',{d:'M -14 -29 L 14 -29',stroke:palette.ink,'stroke-width':4.5,'stroke-linecap':'round'},weapon);
 const arc=svg('path',{'data-wood-strike-arc':'1',d:'M -30 -95 Q 14 -117 37 -65',fill:'none',stroke:'#e7e4d4','stroke-width':3.2,'stroke-linecap':'round',opacity:0},arm);
 const ribbon=svg('g',{'data-rig-hair':'white'},nodes.head);
 for(const d of ['M -9 -30 Q -34 -21 -26 10 Q -38 2 -31 -20','M 7 -32 Q 26 -24 21 17 Q 33 3 17 -25']){
  svg('path',{d,fill:'none',stroke:palette.hair,'stroke-width':5,'stroke-linecap':'round'},ribbon);
 }
 root.setAttribute('data-combat-skin','kairakh-star1-wood-sword');
 return true;
}

// Visual keyframes, never changing actual combat damage or cooldowns.
export function tickWoodSwordKairakh(rig){
 if((rig?.svg?.getAttribute?.('data-combat-skin')||rig?.svg?.attrs?.['data-combat-skin'])!=='kairakh-star1-wood-sword')return;
 const arc=rig.svg.querySelector?.('[data-wood-strike-arc]');if(!arc)return;
 const progress=rig.duration>0?Math.max(0,Math.min(1,rig.time/rig.duration)):0;
 const visible=rig.mode==='attack'&&progress>.31&&progress<.72;
 arc.setAttribute('opacity',visible?String(Math.sin((progress-.31)/.41*Math.PI)*.9):'0');
}
