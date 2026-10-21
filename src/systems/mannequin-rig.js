import {installRacialRig,tickRacialRig} from './racial-rig-renderer.js';
import {installWoodSwordKairakh,tickWoodSwordKairakh} from './kairakh-wood-sword-skin.js';
// Universal 2D skeletal mannequin. Race-independent anatomy and sockets.
// Visual only; combat engine remains authoritative for hits and damage.
export const SKELETON=Object.freeze({
 root:[null,0,0],spine:['root',0,-28],chest:['spine',0,-28],
 neck:['chest',0,-22],head:['neck',0,-13],
 shoulderL:['chest',-18,-10],elbowL:['shoulderL',-3,29],wristL:['elbowL',0,28],
 shoulderR:['chest',18,-10],elbowR:['shoulderR',3,29],wristR:['elbowR',0,28],
 hipL:['root',-12,10],kneeL:['hipL',-2,43],ankleL:['kneeL',0,42],footL:['ankleL',0,8],
 hipR:['root',12,10],kneeR:['hipR',2,43],ankleR:['kneeR',0,42],footR:['ankleR',0,8]
});
export const SOCKETS=Object.freeze({weaponL:'wristL',weaponR:'wristR',shield:'wristL',projectile:'wristR',
 spell:'wristR',headVfx:'head',chestVfx:'chest',rootVfx:'root',footstepL:'footL',footstepR:'footR'});
export const RIG_STATES=Object.freeze(['idle','walk','run','attack','cast','hit','block','dodge','death']);
const NS='http://www.w3.org/2000/svg';
const rigs=new WeakMap();
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const ease=n=>{n=clamp(n,0,1);return n*n*(3-2*n)};
function tag(name,props,parent){
 const el=document.createElementNS(NS,name);
 for(const [key,value] of Object.entries(props||{}))el.setAttribute(key,value);
 if(parent)parent.appendChild(el);
 return el;
}
function piece(id,group){
 const ink='#61748d',pale='#e1e7f0',shadow='#bdcadb';
 const shape=(name,attr)=>tag(name,{...attr,stroke:ink,'stroke-width':1.2},group);
 if(id==='head'){shape('ellipse',{cx:0,cy:-10,rx:12,ry:17,fill:'#eef2f6'});
   tag('path',{d:'M 0 -25 V 4 M -8 -8 H 8',stroke:'#8ca4bf',fill:'none','stroke-width':.8},group);return}
 if(id==='root'){shape('ellipse',{cx:0,cy:0,rx:17,ry:12,fill:shadow});return}
 if(id==='chest'){shape('path',{d:'M -22 -16 Q 0 -23 22 -16 L 14 17 L -14 17 Z',fill:pale});return}
 if(id==='spine'){shape('path',{d:'M -12 -2 L 12 -2 L 13 -28 L -13 -28 Z',fill:shadow});return}
 if(id==='neck'){shape('rect',{x:-5,y:-14,width:10,height:16,rx:3,fill:shadow});return}
 if(id.startsWith('foot')){shape('path',{d:'M -6 -2 L 6 -2 L 13 7 L 10 10 L -7 8 Z',fill:shadow});return}
 if(id.startsWith('wrist')){shape('ellipse',{cx:0,cy:6,rx:5,ry:10,fill:pale});return}
 const length=id.startsWith('hip')||id.startsWith('knee')?42:id.startsWith('shoulder')||id.startsWith('elbow')?29:7;
 const w=id.startsWith('hip')?11:id.startsWith('knee')?8:id.startsWith('shoulder')?8:6;
 shape('path',{d:'M '+(-w)+' -4 Q '+(-w-2)+' '+(length/2)+' '+(-w*.7)+' '+length+
    ' Q 0 '+(length+4)+' '+(w*.7)+' '+length+' Q '+(w+2)+' '+(length/2)+' '+w+' -4 Z',fill:pale});
 tag('circle',{cx:0,cy:0,r:3,fill:'#78bcff',stroke:'#275196','stroke-width':1.2},group);
}
export function createRigSvg({debug=false,character=null}={}){
 const svg=tag('svg',{viewBox:'0 0 140 224',width:'100%',height:'100%',role:'img','aria-label':'Maniquí articulado 2D'});
 svg.classList.add('kami-rig-svg');svg.style.overflow='visible';
 const root=tag('g',{transform:'translate(70 107)'},svg);
 const nodes={};
 function make(id){
   const spec=SKELETON[id],parent=spec[0]?nodes[spec[0]]:root;
   const g=tag('g',{'data-bone':id,transform:'translate('+spec[1]+' '+spec[2]+')'},parent);
   nodes[id]=g;piece(id,g);
   for(const [socket,bone] of Object.entries(SOCKETS))if(bone===id)
     tag('circle',{'data-socket':socket,cx:0,cy:0,r:debug?4:0,fill:'#ffb95d'},g);
   for(const [child,info] of Object.entries(SKELETON))if(info[0]===id)make(child);
 }
 make('root');const racial=installRacialRig(nodes,character);
 installWoodSwordKairakh({nodes,svg},character);
 svg.setAttribute('data-rig-race',racial.race);
 return {svg,nodes,root,racial};
}
export function sampleRigPose(mode='idle',t=0,progress=0,variant=0){
 const p=clamp(progress,0,1),a={},movement={x:0,y:0};
 const wave=Math.sin(t*10);
 if(mode==='walk'||mode==='run'){
   const strength=mode==='run'?34:20;
   a.hipL=wave*strength;a.hipR=-wave*strength;
   a.kneeL=Math.max(0,-wave)*31;a.kneeR=Math.max(0,wave)*31;
   a.shoulderL=-wave*strength*.7;a.shoulderR=wave*strength*.7;
   a.elbowL=-12;a.elbowR=-12;a.chest=mode==='run'?8:3;
   movement.y=Math.abs(wave)*(mode==='run'?3:1.5);
 }else if(mode==='attack'){
   const wind=p<.35?ease(p/.35):p<.65?1-ease((p-.35)/.30):0;
   const swing=p<.35?0:p<.65?ease((p-.35)/.30):1-ease((p-.65)/.35);
   a.chest=-18*wind+22*swing;a.shoulderR=-85*wind+102*swing;
   a.elbowR=-30*wind+15*swing;a.shoulderL=20*wind-10*swing;
   a.hipL=-20*swing;a.hipR=13*swing;movement.x=12*swing;
   if(variant===1){ // Segundo golpe: corte diagonal, más torsión del torso.
     a.chest+=12*swing;a.shoulderR+=-24*wind+18*swing;
     a.elbowR+=15*wind-20*swing;a.head=-8*swing;
     a.hipL-=8*swing;movement.x+=4*swing;
   }
 }else if(mode==='cast'){
   const rise=ease(Math.min(1,p*2));
   a.shoulderL=-64*rise;a.shoulderR=64*rise;
   a.elbowL=-22*rise;a.elbowR=22*rise;movement.y=-4*Math.sin(p*Math.PI);
 }else if(mode==='hit'){
   const k=(1-p)*(1-p);a.chest=-23*k;a.head=-10*k;a.shoulderL=18*k;a.shoulderR=-20*k;movement.x=-8*k;
 }else if(mode==='block'){
   a.shoulderL=-68;a.elbowL=-40;a.shoulderR=26;a.chest=-8;
 }else if(mode==='dodge'){
   const k=Math.sin(p*Math.PI);movement.x=-17*k;movement.y=-7*k;
   a.chest=22*k;a.hipL=-42*k;a.hipR=30*k;
 }else if(mode==='death'){
   const k=ease(p);a.chest=-72*k;a.head=-19*k;a.hipL=38*k;a.hipR=-18*k;movement.y=28*k;
 }else{
   const breathe=Math.sin(t*2.5);a.chest=breathe*1.5;a.head=-breathe*.8;
   a.shoulderL=-2+breathe*1.5;a.shoulderR=2-breathe*1.5;movement.y=breathe*1.2;
 }
 return {angles:a,movement};
}
const times={attack:.5,cast:.8,hit:.34,block:.5,dodge:.55,death:1.3};
export function attachRig(unit,{debug=false}={}){
 if(!unit?.node)return null;
 const host=unit.node.querySelector('.unit-body')||unit.node;
 const existing=rigs.get(unit);if(existing)return existing;
 const parts=createRigSvg({debug,character:unit.character||unit.ref||null});host.append(parts.svg);host.classList.add('kami-rig-host');
 const state={...parts,mode:'idle',clock:0,time:0,duration:0,rotations:{},previousHp:unit.hp,attackCount:0,attackVariant:0};
 rigs.set(unit,state);return state;
}
export function playRig(unit,mode,{duration}={}){
 const s=rigs.get(unit);if(!s||!RIG_STATES.includes(mode))return false;
 if(s.mode==='death')return false;
 const rank={death:10,hit:7,dodge:7,block:6,cast:5,attack:4,run:2,walk:1,idle:0};
 if((rank[mode]||0)<(rank[s.mode]||0)&&s.time<s.duration*.65)return false;
 if(mode==='attack'){s.attackCount++;s.attackVariant=s.attackCount%2}
 s.mode=mode;s.time=0;s.duration=duration||times[mode]||.6;return true;
}
export function tickRig(unit,dt){
 const s=rigs.get(unit);if(!s||dt<=0)return;
 s.clock+=dt;s.time+=dt;
 tickRacialRig(s.racial,s.clock);
 if(unit.hp<=0&&s.mode!=='death')playRig(unit,'death');
 else if(unit.hp>0&&unit.hp<s.previousHp&&s.mode!=='hit')playRig(unit,'hit');
 s.previousHp=unit.hp;
 if(s.mode!=='death'&&s.mode!=='idle'&&s.time>=s.duration){s.mode='idle';s.time=0;s.duration=0}
 const pose=sampleRigPose(s.mode,s.clock,s.duration?s.time/s.duration:0,s.attackVariant);
 s.root.setAttribute('transform','translate('+(70+pose.movement.x)+' '+(107+pose.movement.y)+')');
 const blend=1-Math.exp(-dt*24);
 for(const [id,node] of Object.entries(s.nodes)){
   const data=SKELETON[id],target=pose.angles[id]||0;
   s.rotations[id]=(s.rotations[id]||0)+(target-(s.rotations[id]||0))*blend;
   node.setAttribute('transform','translate('+data[1]+' '+data[2]+') rotate('+s.rotations[id].toFixed(2)+')');
 }
 tickWoodSwordKairakh(s);
}
export function rigState(unit){return rigs.get(unit)?.mode||null}
export function rigSocket(unit,id){return rigs.get(unit)?.nodes[SOCKETS[id]]||null}
