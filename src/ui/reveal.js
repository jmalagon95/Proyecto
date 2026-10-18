import { emptyEquipment } from '../systems/equipment.js';
import { el, button } from './components.js';

const RANGES={1:[1,5],2:[2,8],3:[4,13],4:[8,25],5:[18,40],6:[30,65],7:[50,95],8:[80,140]};
const RATES={1:70,2:26,3:3.5,4:.45,5:.045,6:.0045,7:.0005,8:.0000005};
const RARITY_COLORS={1:'#b9c0ca',2:'#69d173',3:'#62aaff',4:'#a875ff',5:'#f2ca65',6:'#ff8056',7:'#ff57cf',8:'#ffffff'};
const HAIR=['negro','blanco ceniza','plateado','castaño oscuro','rojo profundo','azul noche','rubio pálido'];
const EYES=['ámbar','azul hielo','verde esmeralda','gris acero','rojo profundo','violeta'];
const TRAITS=['una cicatriz fina y discreta','marcas de batalla antiguas','un pequeño lunar distintivo','una expresión serena e intimidante','rasgos juveniles pero firmes','una mirada especialmente intensa'];

function weightedStar(){
  const entries=Object.entries(RATES).map(([s,w])=>[Number(s),w]);
  const total=entries.reduce((a,[,w])=>a+w,0);
  let x=Math.random()*total;
  for(const [s,w] of entries){x-=w;if(x<=0)return s}
  return 1;
}
function stat(star){const[a,b]=RANGES[star];return Math.floor(a+Math.random()*(b-a+1))}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function buildAppearance(race,cls){
  const sex=Math.random()<.5?'masculino':'femenino';
  const physique=/Defensor|pesado|Bastión/i.test(cls.role+' '+cls.name)?'atlético y robusto':/móvil|Asesino|Ranger|cazador/i.test(cls.role+' '+cls.name)?'atlético, esbelto y ágil':'atlético y proporcionado';
  return{
    sex,apparentAge:Math.floor(20+Math.random()*15),physique,
    hair:race.id==='reptro'?'NO existe pelo físico; filamentos de electricidad moderados forman visualmente el cabello':pick(HAIR),
    eyes:race.id==='reptro'?'ojos reptilianos/camaleónicos adaptados a luz intensa y oscuridad':pick(EYES),
    detail:pick(TRAITS)
  };
}
function buildPrompt(hero,race,cls){
  const a=hero.appearance;
  return `KAMI NO CHALLENGE — WALLPAPER OFICIAL DEL PERSONAJE

IDENTIDAD
Nombre: ${hero.name}
Sexo/presentación: ${a.sex}
Edad aparente adulta: ${a.apparentAge} años
Raza: ${race.name}
Clase: ${cls.name} (${cls.source||'Clase seleccionada'})
Rol de combate: ${cls.role}
Rareza de nacimiento: ${'★'.repeat(hero.birthStar)}
Nivel: 1

ANATOMÍA RACIAL OBLIGATORIA
${race.visualRules}
No sustituir, suavizar ni mezclar estos rasgos con los de otra raza.

FÍSICO E INDIVIDUALIDAD
Constitución: ${a.physique}.
Cabello o equivalente racial: ${a.hair}.
Ojos: ${a.eyes}.
Rasgo individual: ${a.detail}.
El personaje debe parecer un individuo único de su especie, no una copia exacta del wallpaper racial.

CLASE Y EQUIPO INICIAL
Clase: ${cls.name}.
Descripción de la clase: ${cls.description}
Arma principal obligatoria: ${hero.weapon}.
Familias de armas compatibles: ${cls.weapons.join(', ')}.
El arma debe leerse claramente y ser coherente con la clase. Equipo inicial de aventurero, funcional, de baja categoría, sin convertirlo visualmente en un héroe legendario por su rareza.

ATRIBUTOS INICIALES
FUE ${hero.stats.FUE} · AGI ${hero.stats.AGI} · CON ${hero.stats.CON} · DEF ${hero.stats.DEF} · INT ${hero.stats.INT} · VOL ${hero.stats.VOL}.
Estos valores deben influir sutilmente en la presencia física y actitud, sin escribir números dentro de la imagen.

DIRECCIÓN ARTÍSTICA
Wallpaper vertical de personaje, cuerpo completo claramente visible, ilustración 2D anime/manga oscuro de alta gama. Lineart limpio y deliberado, cel shading refinado, detalles dibujados con intención, silueta legible y anatomía coherente. Acabado de ilustrador profesional, evitando al máximo el aspecto típico de imagen generada por IA: nada de exceso de microdetalle aleatorio, texturas derretidas, accesorios incoherentes, extremidades duplicadas, dedos deformes, patrones que cambian sin lógica ni fondos confusos. Manos, pies, rostro, arma y ropa anatómicamente correctos.

COMPOSICIÓN
Pose de héroe natural y creíble, con personalidad acorde a ${cls.name}. Escenario coherente con el origen racial: ${race.origin}. Iluminación cinematográfica que separe al personaje del fondo. Colores intensos pero controlados. No añadir texto, logos, marcos, UI, estrellas escritas ni otros personajes. Un único personaje completo.

ESTILO FINAL
Debe sentirse como arte oficial de un RPG anime/manga oscuro premium, no como concept art sin terminar, render 3D ni pintura fotorealista.`;
}

export function createHero(race,cls,name=''){
  const starLevel=weightedStar();
  const stats=Object.fromEntries(['FUE','AGI','CON','DEF','INT','VOL'].map(k=>[k,stat(starLevel)]));
  const hero={
    id:crypto.randomUUID(),name:name.trim()||'Aspirante',raceId:race.id,raceName:race.name,
    className:cls.name,classDescription:cls.description,role:cls.role,weapons:cls.weapons,weapon:cls.weapons[0],
    birthStar:starLevel,currentStar:starLevel,level:1,stats,skills:[],passives:[],dead:false,
    equipment:emptyEquipment(),
    wallpaper:race.image,renameRemaining:1,appearance:buildAppearance(race,cls)
  };
  hero.artPrompt=buildPrompt(hero,race,cls);
  return hero;
}

export function renderReveal({app,race,hero,onEnter}){
  app.innerHTML='';
  const color=RARITY_COLORS[hero.currentStar];
  const screen=el('section','screen reveal-screen');
  screen.style.setProperty('--rarity',color);
  screen.innerHTML=`
    <div class="reveal-bg" style="background-image:url('${race.image}')"></div>
    <div class="reveal-shell">
      <header class="reveal-header"><small>DESTINO MANIFESTADO</small><div class="reveal-stars">${'★'.repeat(hero.currentStar)}</div><h1>${hero.name}</h1><p>${hero.raceName} · ${hero.className} · Nv.1</p></header>
      <div class="reveal-layout">
        <div class="reveal-art" style="background-image:url('${race.image}')"><div><small>WALLPAPER RACIAL PROVISIONAL</small><b>Genera el personaje definitivo con el mensaje de la derecha.</b></div></div>
        <div class="reveal-data">
          <section class="reveal-stats"><h2>Atributos iniciales</h2><div class="stat-grid">${Object.entries(hero.stats).map(([k,v])=>`<div><small>${k}</small><b>${v}</b></div>`).join('')}</div></section>
          <section class="reveal-summary"><div><small>RAREZA DE NACIMIENTO</small><b style="color:var(--rarity)">${'★'.repeat(hero.birthStar)}</b></div><div><small>ARMA INICIAL</small><b>${hero.weapon}</b></div></section>
          <section class="prompt-box"><div><small>MENSAJE DETALLADO PARA GENERAR SU WALLPAPER</small><button id="copyPrompt" type="button">Copiar</button></div><textarea id="artPrompt" readonly></textarea></section>
          <button id="enterLobby" class="reveal-continue" type="button"><span>CONTINUAR AL LOBBY</span><i>›</i></button>
        </div>
      </div>
    </div>`;
  app.append(screen);
  screen.querySelector('#artPrompt').value=hero.artPrompt;
  screen.querySelector('#copyPrompt').onclick=async()=>{
    const btn=screen.querySelector('#copyPrompt');
    try{await navigator.clipboard.writeText(hero.artPrompt);btn.textContent='Copiado ✓'}catch{screen.querySelector('#artPrompt').select()}
  };
  screen.querySelector('#enterLobby').onclick=onEnter;
}
