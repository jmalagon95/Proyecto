// Kami No Challenge · Flujo de inicio (v0.18)
// 1) Pantalla del mundo en tres fases (intro → forjando → resultado) en lugar de
//    una sola página larga con todo a la vez.
// 2) Retrato del Kairakh: la ilustración antigua (recorte con fondo blanco) se
//    sustituye por un retrato de silueta de la raza hasta que exista el arte nuevo.
//    Se cambia solo ASSETS.Kairakh, así que todas las pantallas que lo usan
//    (raza, especialización, revelación, invocación, avatar, dormitorios) se actualizan.

// ── Retrato provisional del Kairakh ───────────────────────────
const KAIRAKH_PORTRAIT=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 1040">
<defs>
<radialGradient id="bg" cx=".5" cy=".36" r=".75"><stop offset="0" stop-color="#5a1621"/><stop offset=".45" stop-color="#2a0d18"/><stop offset="1" stop-color="#0b0710"/></radialGradient>
<radialGradient id="halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff5a5f" stop-opacity=".55"/><stop offset=".6" stop-color="#b3243a" stop-opacity=".12"/><stop offset="1" stop-color="#b3243a" stop-opacity="0"/></radialGradient>
<linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1018"/><stop offset="1" stop-color="#08060b"/></linearGradient>
<linearGradient id="hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9e4ea"/><stop offset="1" stop-color="#7c7181"/></linearGradient>
<linearGradient id="horn" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#3a2a2c"/><stop offset="1" stop-color="#d9c3a5"/></linearGradient>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="smoke"><feTurbulence type="fractalNoise" baseFrequency=".008 .02" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .08  0 0 0 0 .14  0 0 0 .9 -.25"/></filter>
</defs>
<rect width="780" height="1040" fill="url(#bg)"/>
<rect width="780" height="1040" filter="url(#smoke)" opacity=".7"/>
<circle cx="390" cy="380" r="300" fill="url(#halo)"/>
<g fill="none" stroke="#e05a63" stroke-opacity=".38">
 <circle cx="390" cy="380" r="245" stroke-width="2"/><circle cx="390" cy="380" r="215" stroke-width="1" stroke-dasharray="4 10"/>
 <path d="M390 135 L602 503 L178 503 Z" stroke-width="1.5"/><path d="M390 625 L178 257 L602 257 Z" stroke-width="1.5"/>
</g>
<!-- melena trasera -->
<path d="M262 330 Q236 520 180 700 Q250 640 286 600 Q262 760 230 880 Q330 760 352 620 L428 620 Q450 760 550 880 Q518 760 494 600 Q530 640 600 700 Q544 520 518 330 Z" fill="url(#hair)" opacity=".9"/>
<!-- torso y hombros -->
<path d="M120 1040 Q132 820 236 742 Q300 700 334 652 L446 652 Q480 700 544 742 Q648 820 660 1040 Z" fill="url(#body)"/>
<path d="M334 652 Q390 690 446 652 L452 700 Q390 742 328 700 Z" fill="#140b12"/>
<!-- cuello y cabeza -->
<path d="M344 560 L436 560 L446 660 Q390 690 334 660 Z" fill="#160d14"/>
<path d="M300 380 Q300 270 390 262 Q480 270 480 380 Q480 470 446 532 Q420 580 390 584 Q360 580 334 532 Q300 470 300 380 Z" fill="#1a0f17"/>
<!-- orejas cortas puntiagudas -->
<path d="M302 392 L262 360 L300 436 Z M478 392 L518 360 L480 436 Z" fill="#1a0f17"/>
<!-- cuerno frontal único -->
<path d="M372 276 Q380 190 390 120 Q402 190 408 276 Q390 286 372 276 Z" fill="url(#horn)"/>
<path d="M390 132 Q394 200 398 270" stroke="#fff1d6" stroke-opacity=".5" stroke-width="2" fill="none"/>
<!-- flequillo -->
<path d="M300 380 Q300 280 390 262 Q480 280 480 380 Q462 330 440 322 L430 372 L404 316 L392 360 L372 316 L352 372 L340 322 Q318 330 300 380 Z" fill="url(#hair)"/>
<!-- ojos -->
<g filter="url(#glow)"><path d="M338 418 L374 410 L370 424 L340 428 Z M442 418 L406 410 L410 424 L440 428 Z" fill="#ff4b5c"/></g>
<!-- venas de energía -->
<g fill="none" stroke="#ff4f62" stroke-width="3" stroke-linecap="round" filter="url(#glow)" opacity=".9">
 <path d="M356 470 L346 500 L352 530"/><path d="M424 470 L434 500 L428 530"/>
 <path d="M300 760 L344 724 L360 770 L392 742 L420 772 L438 724 L480 760"/>
 <path d="M240 830 L278 810 L272 860 L304 880"/><path d="M540 830 L502 810 L508 860 L476 880"/>
 <path d="M390 742 L390 820 L370 860 M390 820 L410 860"/>
</g>
<text x="390" y="985" text-anchor="middle" font-family="Georgia,serif" font-size="46" letter-spacing="14" fill="#f2d7a6" opacity=".85">KAIRAKH</text>
</svg>`;
try{
 if(typeof ASSETS==='object'&&ASSETS)ASSETS.Kairakh='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(KAIRAKH_PORTRAIT);
}catch(error){console.warn('[Kami] No se pudo sustituir el retrato Kairakh',error)}
// Actualiza retratos que ya se hubieran pintado antes de cargar este módulo.
function refreshPortraits(){
 try{if(typeof renderLobby==='function'&&document.getElementById('lobby')?.classList.contains('on'))renderLobby()}catch{}
}

// ── Mundo en tres fases ───────────────────────────────────────
function initWorld(){
 const world=document.getElementById('world');if(!world)return;
 const result=document.getElementById('worldResult');
 const setPhase=p=>{world.dataset.phase=p;const eb=world.querySelector('.kw-head .eyebrow');
  if(eb)eb.textContent='Génesis · Paso '+({intro:1,forging:2,result:3}[p]||1)+' de 3'};
 document.getElementById('forge')?.addEventListener('click',()=>setPhase('forging'));
 // El maestro añade .show al resultado al terminar la forja.
 if(result)new MutationObserver(()=>{if(result.classList.contains('show'))setPhase('result')}).observe(result,{attributes:true,attributeFilter:['class']});
 // Al volver a entrar en la pantalla sin mundo creado, se empieza por la introducción.
 new MutationObserver(()=>{
  if(!world.classList.contains('on'))return;
  let hasWorld=false;try{hasWorld=Boolean(state?.world)&&result?.classList.contains('show')}catch{}
  if(!hasWorld&&world.dataset.phase!=='forging'){setPhase('intro');document.getElementById('planet')?.classList.remove('ready')}
 }).observe(world,{attributes:true,attributeFilter:['class']});
 setPhase(result?.classList.contains('show')?'result':'intro');
}

// ── Reparación de partidas: rol de clase ──────────────────────
// Hasta v0.17 todos los personajes se guardaban con rol 'Guerrero' aunque fueran
// magos, sanadores o tiradores. Se recupera el rol real de su clase.
function repairRoles(){
 try{
  if(typeof state!=='object'||!Array.isArray(state?.characters)||typeof CLASSES!=='object')return;
  let changed=false;
  for(const c of state.characters){
   const role=(CLASSES[c.race]||[]).find(k=>k.name===c.className)?.role;
   if(role&&c.role!==role){c.role=role;changed=true}
  }
  if(changed&&typeof save==='function')save();
 }catch(error){console.warn('[Kami] No se pudo reparar el rol de clase',error)}
}
function init(){initWorld();refreshPortraits();repairRoles();
 // También tras «Continuar», que carga la partida guardada después de iniciar.
 document.getElementById('continueGame')?.addEventListener('click',()=>setTimeout(repairRoles,0));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
