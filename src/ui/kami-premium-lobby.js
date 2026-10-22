// Kami No Challenge · Lobby.
// El fondo del lobby es una ilustración que ya trae letreros pintados
// (Portal de Misiones, Habitaciones, Santuario, Almacén, Guía, Siguiente misión).
// En lugar de poner letreros nuevos encima en otra posición, los botones reales
// se colocan EXACTAMENTE sobre los letreros pintados (ver kami-premium-lobby.css),
// de modo que el dibujo y la interfaz coinciden y no hay duplicados.
// Los botones delegan siempre en la navegación existente del maestro.
const targets=[
 {label:'Personajes',detail:'Héroes · Equipo · Habilidades',icon:'♟',modal:'dormModal',match:/personajes|dormitorios|habitaciones/i},
 {label:'Invocación',detail:'Santuario de los seis',icon:'✧',modal:'sanctModal',match:/invoca|santuario/i},
 {label:'Misiones',detail:'Portal de supervivencia',icon:'⚔',modal:'portalModal',match:/mision|portal/i},
 {label:'Torre',detail:'30 pisos · Jefes',icon:'♖',action:'tower'},
 {label:'Almacén',detail:'Objetos y materiales',icon:'▣',modal:'storeModal',match:/almac[eé]n/i},
 {label:'Formación',detail:'Tres carriles · Cinco héroes',icon:'⛨',modal:'portalModal',match:/mision|portal/i}
];
// Subtítulos de los letreros del mapa (el título lo pone el propio maestro).
const hotDetails={dorm:'Héroes y descanso',sanct:'Invoca · Asciende',portal:'Explora · Sobrevive',store:'Objetos y materiales'};
function goTo(modal,matcher){
 const links=[...document.querySelectorAll('#lobby [data-open]')];
 const byData=links.find(el=>el.dataset.open===modal);
 if(byData){byData.click();return true}
 const nav=[...document.querySelectorAll('#lobby .nav, #lobby nav button')];
 const found=nav.find(el=>matcher.test(el.textContent||''));
 if(found){found.click();return true}
 try{window.eval('openModal('+JSON.stringify(modal)+')');return true}catch(error){
  console.warn('[Kami] Menú no disponible:',modal,error);return false
 }
}
function openTower(){
 if(window.KamiTower?.open){window.KamiTower.open();return}
 document.getElementById('ktOpen')?.click();
}
function storeDetail(){
 const n=document.getElementById('invCount')?.textContent;
 return n?'Objetos '+n+'/50':hotDetails.store;
}
function enhance(){
 const lobby=document.getElementById('lobby');
 const scene=lobby?.querySelector('.lobby-scene');
 if(!scene||lobby.querySelector('.kami-lobby-body'))return;
 // Cuerpo del lobby: mapa + panel de accesos, uno junto al otro en PC y apilados en móvil.
 const body=document.createElement('div');body.className='kami-lobby-body';
 scene.before(body);body.append(scene);
 scene.classList.add('kami-map');
 // Letreros del mapa: título + subtítulo.
 for(const hot of scene.querySelectorAll('.hot')){
  const kind=['dorm','sanct','portal','store'].find(k=>hot.classList.contains(k));
  if(!kind||hot.querySelector('small'))continue;
  const small=document.createElement('small');small.textContent=kind==='store'?storeDetail():hotDetails[kind];
  hot.querySelector('span')?.append(small);
  if(kind==='store'){
   const count=document.getElementById('invCount');
   if(count)new MutationObserver(()=>{small.textContent=storeDetail()}).observe(count,{childList:true,characterData:true,subtree:true});
  }
 }
 // El recuadro de la misión pintado arriba a la derecha abre el portal.
 const quest=scene.querySelector('.quest');
 if(quest){quest.setAttribute('role','button');quest.tabIndex=0;
  const go=()=>goTo('portalModal',/mision|portal/i);
  quest.addEventListener('click',go);
  quest.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}});
 }
 const access=document.createElement('nav');
 access.className='kami-lobby-shortcuts';access.setAttribute('aria-label','Accesos del lobby');
 for(const item of targets){
  const btn=document.createElement('button');btn.type='button';
  btn.className='kami-shortcut';if(item.modal)btn.dataset.kamiModal=item.modal;
  const icon=document.createElement('span');icon.className='kami-shortcut-icon';
  icon.setAttribute('aria-hidden','true');icon.textContent=item.icon;
  const name=document.createElement('b');name.textContent=item.label;
  const detail=document.createElement('small');detail.textContent=item.detail;
  btn.append(icon,name,detail);
  btn.addEventListener('click',()=>item.action==='tower'?openTower():goTo(item.modal,item.match));
  access.append(btn);
 }
 body.append(access);
 lobby.dataset.kamiPremium='2';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});
else enhance();
