// Rediseño del lobby y menús de Kami No Challenge sin sustituir las pantallas
// ni inventar datos: los botones delegan siempre en la navegación existente.
const targets=[
 {label:'Personajes',detail:'Héroes · Equipo · Habilidades',icon:'♟',modal:'dormModal',match:/personajes|dormitorios|habitaciones/i},
 {label:'Habitaciones',detail:'Descanso y vínculos',icon:'♜',modal:'dormModal',match:/dormitorios|habitaciones/i},
 {label:'Invocación',detail:'Santuario de los seis',icon:'✧',modal:'sanctModal',match:/invoca|santuario/i},
 {label:'Almacén',detail:'Objetos y materiales',icon:'▣',modal:'storeModal',match:/almac[eé]n/i},
 {label:'Misiones',detail:'Portal de supervivencia',icon:'⚔',modal:'portalModal',match:/mision|portal/i},
 {label:'Formación',detail:'Tres carriles · Cinco héroes',icon:'⛨',modal:'portalModal',match:/mision|portal/i}
];
function goTo(modal,matcher){
 const links=[...document.querySelectorAll('#lobby [data-open]')];
 const byData=links.find(el=>el.dataset.open===modal);
 if(byData){byData.click();return true}
 const nav=[...document.querySelectorAll('#lobby .nav, #lobby nav button')];
 const found=nav.find(el=>matcher.test(el.textContent||''));
 if(found){found.click();return true}
 // Función definida por el maestro clásico como binding de la página.
 try{window.eval('openModal('+JSON.stringify(modal)+')');return true}catch(error){
  console.warn('[Kami] Menú no disponible:',modal,error);return false
 }
}
function enhance(){
 const lobby=document.getElementById('lobby');
 const scene=lobby?.querySelector('.lobby-scene');
 if(!scene||scene.querySelector('.kami-lobby-shortcuts'))return;
 const heading=document.createElement('div');heading.className='kami-menu-banner';
 const title=document.createElement('strong');title.textContent='KAMI NO CHALLENGE';
 const subtitle=document.createElement('small');subtitle.textContent='El santuario de los seis linajes';
 heading.append(title,subtitle);scene.prepend(heading);
 const races=document.createElement('div');races.className='kami-race-standards';
 // Únicamente las seis razas aprobadas.
 for(const race of ['Kairakh','Elfos','Kijins','Vampiros','Insectoides','Reptro']){
  const label=document.createElement('span');label.textContent=race;races.append(label);
 }
 scene.prepend(races);
 const access=document.createElement('nav');
 access.className='kami-lobby-shortcuts';access.setAttribute('aria-label','Accesos del lobby');
 for(const item of targets){
  const btn=document.createElement('button');btn.type='button';
  btn.className='kami-shortcut';btn.dataset.kamiModal=item.modal;
  const icon=document.createElement('span');icon.className='kami-shortcut-icon';
  icon.setAttribute('aria-hidden','true');icon.textContent=item.icon;
  const name=document.createElement('b');name.textContent=item.label;
  const detail=document.createElement('small');detail.textContent=item.detail;
  btn.append(icon,name,detail);
  btn.addEventListener('click',()=>goTo(item.modal,item.match));
  access.append(btn);
 }
 scene.append(access);
 lobby.dataset.kamiPremium='1';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});
else enhance();
