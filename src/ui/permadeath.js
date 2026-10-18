import { el } from './components.js';

export function renderPermadeath({app,state,save,onBack,onAccept}){
  app.innerHTML='';
  const screen=el('section','screen permadeath-screen');
  screen.innerHTML=`
    <div class="death-bg"></div>
    <div class="death-vignette"></div>
    <div class="death-frame">
      <button class="death-back" type="button">←</button>
      <div class="death-symbol"><span>!</span></div>
      <small class="death-kicker">REGLA FUNDAMENTAL DEL MUNDO</small>
      <h1>MUERTE PERMANENTE</h1>
      <div class="death-divider"><i></i><b>◆</b><i></i></div>
      <p class="death-lead">Toda vida que cruza el umbral de tu expedición puede perderse para siempre.</p>
      <div class="death-rules">
        <article><b>01</b><div><strong>La muerte es definitiva</strong><p>Si un personaje muere durante una expedición, dejará de estar disponible permanentemente.</p></div></article>
        <article><b>02</b><div><strong>Tu protagonista no es una excepción</strong><p>El primer personaje que crearás está sujeto exactamente a las mismas reglas que cualquier otro.</p></div></article>
        <article><b>03</b><div><strong>Las decisiones importan</strong><p>Formación, posición, retirada y riesgo pueden determinar quién regresa con vida.</p></div></article>
      </div>
      <label class="death-accept"><input id="deathCheck" type="checkbox"><span></span><div><b>Entiendo las consecuencias</b><small>Acepto que la muerte de los personajes es irreversible.</small></div></label>
      <button class="death-confirm" id="deathConfirm" type="button" disabled><span>ACEPTAR Y CONTINUAR</span><i>›</i></button>
      <p class="death-world">Mundo actual: <b>${state.world?.name||'—'}</b> · ${state.world?.population?.toLocaleString('es-ES')||'—'} habitantes</p>
    </div>`;
  app.append(screen);
  const check=screen.querySelector('#deathCheck'),confirm=screen.querySelector('#deathConfirm');
  check.onchange=()=>confirm.disabled=!check.checked;
  confirm.onclick=()=>{state.permadeathAccepted=true;save();onAccept()};
  screen.querySelector('.death-back').onclick=onBack;
}
