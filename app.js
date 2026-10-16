/* ═══════════════════════════════════════════════════════════
   Constelación · La aplicación
   Equipo de Diseño y Medios · IBERO Tijuana

   Lo que une las piezas: la puerta con la clave del equipo, la
   lectura de la tabla personas, el formulario de alta, el enlace
   personal para corregir o borrar, y el sondeo que hace aparecer
   a quien se acaba de registrar.

   La base se usa SÓLO a través de funciones (rpc): la tabla no se
   lee ni se escribe directo. ver_personas pide la clave; registrar
   pide la clave y devuelve el código personal; mi_registro, editar
   y borrar piden sólo el código.
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';
const M = window.Motor, Mapa = window.Mapa;
const $ = s=>document.querySelector(s);
const LS = {clave:'constelacion.clave', codigo:'constelacion.codigo', id:'constelacion.id'};
const guardar=(k,v)=>{ try{ v==null?localStorage.removeItem(k):localStorage.setItem(k,v); }catch(e){} };
const leer=k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } };

const configurada = !!(CONFIG.supabase.url && CONFIG.supabase.llave);

/* ---------- base ---------- */
async function rpc(fn, args){
  const K=CONFIG.supabase.llave;
  let r;
  try{
    r = await fetch(CONFIG.supabase.url+'/rest/v1/rpc/'+fn,{method:'POST',headers:{apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(args||{})});
  }catch(e){ throw new Error('No hubo forma de llegar a la base. ¿Sin red?'); }
  const texto = await r.text(); let j=null; try{ j=texto?JSON.parse(texto):null; }catch(e){}
  if(!r.ok){ const m=(j&&(j.message||j.hint))||('error '+r.status); const e=new Error(m); e.codigo=j&&j.code; throw e; }
  return j;
}
const esClaveMala = e => /clave/i.test(e.message||'');

/* ---------- estado ---------- */
let clave = leer(LS.clave)||'';
let miCodigo = leer(LS.codigo)||'';
let miId = leer(LS.id)||'';
let filas = null;        // último resultado de ver_personas
let cartas = new Map();  // id → persona con carta, por fila.actualizado
let modo = 'alta';       // 'alta' | 'mia' | 'editar'
let miRegistro = null;   // fila propia (cuando hay código)
let sondeo = null;

/* ---------- puerta ---------- */
const puerta=$('#puerta');
function pedirClave(msg){
  puerta.hidden=false; $('#mapa-wrap').hidden=true;
  $('#puerta-msg').textContent=msg||'';
  setTimeout(()=>$('#clave').focus(),50);
}
$('#puerta-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const c=$('#clave').value.trim(); if(!c) return;
  $('#puerta-ok').disabled=true; $('#puerta-msg').textContent='Abriendo…';
  try{
    await rpc('ver_personas',{clave:c});
    clave=c; guardar(LS.clave,c); $('#clave').value='';
    entrar();
  }catch(err){
    $('#puerta-msg').textContent = esClaveMala(err) ? 'Esa no es la clave del equipo.' : err.message;
  }
  $('#puerta-ok').disabled=false;
});

/* ---------- entrar ---------- */
let mapaListo=false;
async function entrar(){
  puerta.hidden=true; $('#mapa-wrap').hidden=false;
  if(!mapaListo){ Mapa.arrancar(); mapaListo=true; }
  // ¿viene con enlace personal?
  const c=new URLSearchParams(location.search).get('c');
  if(c){ miCodigo=c.trim().toUpperCase(); guardar(LS.codigo,miCodigo); history.replaceState(null,'',location.pathname); }
  await cargar(true);
  if(miCodigo) await cargarMio();
  pintarPanel();
  if(sondeo) clearInterval(sondeo);
  sondeo=setInterval(()=>cargar(false), CONFIG.sondeo||15000);
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) cargar(false); });
}

async function cargar(primera){
  if(!configurada){ filas=[]; refrescarMapa(); return; }
  try{
    const r=await rpc('ver_personas',{clave});
    if(JSON.stringify(r)===JSON.stringify(filas)) return;
    filas=r; refrescarMapa();
  }catch(err){
    if(esClaveMala(err)){ clave=''; guardar(LS.clave,null); if(sondeo) clearInterval(sondeo); pedirClave('La clave cambió. Pide la nueva al equipo.'); return; }
    if(primera) aviso('No se pudo leer el mapa: '+err.message);
  }
}

function refrescarMapa(){
  let lista;
  const demo = !filas || filas.length===0;
  if(demo){ lista=M.DEMO.map(p=>Object.assign({},p,{carta:p.carta||(p.carta=M.carta(p))})); }
  else {
    lista=filas.map(f=>{
      const k=f.id+'|'+f.actualizado; let p=cartas.get(k);
      if(!p){ p=M.persona(f); cartas.set(k,p); }
      return Object.assign({}, p, {esTu: f.id===miId});
    });
  }
  $('#aviso-demo').hidden=!demo;
  $('#aviso-solo').hidden=!(filas&&filas.length===1);
  Mapa.poner(lista);
}

function aviso(txt){ const a=$('#aviso'); a.textContent=txt; a.hidden=!txt; }

/* ---------- panel «Tu estrella» ---------- */
async function cargarMio(){
  try{
    const r=await rpc('mi_registro',{codigo:miCodigo});
    miRegistro = Array.isArray(r)?r[0]:r;
    if(!miRegistro){ // el registro ya no existe (lo borraron)
      miCodigo=''; miId=''; guardar(LS.codigo,null); guardar(LS.id,null); modo='alta'; return;
    }
    miId=miRegistro.id; guardar(LS.id,miId); modo='mia';
    if(filas && !filas.some(f=>f.id===miId)) await cargar(false); else refrescarMapa();
  }catch(err){ aviso('No se pudo abrir tu registro: '+err.message); }
}

const F = {
  nombre:$('#f-nombre'), fecha:$('#f-fecha'), hora:$('#f-hora'), ciudad:$('#f-ciudad'), sug:$('#f-sug'),
  msg:$('#f-msg'), ok:$('#f-ok'), cancelar:$('#f-cancelar'), form:$('#f-form'), mia:$('#mia'), titulo:$('#f-titulo'), nota:$('#f-nota'),
};
let ciudadSel=null, timer=null;

function pintarPanel(){
  if(!configurada){ F.form.hidden=true; F.mia.hidden=true; $('#sin-base').hidden=false; return; }
  $('#sin-base').hidden=true;
  if(modo==='mia' && miRegistro){
    F.form.hidden=true; F.mia.hidden=false;
    const r=miRegistro; const faltas=[];
    if(!r.hora) faltas.push('sin hora: tu Luna es aproximada y no hay Ascendente');
    if(r.hora && r.lat==null) faltas.push('sin ciudad: se asumió Tijuana para el Ascendente');
    $('#mia-nombre').textContent=r.nombre;
    $('#mia-datos').textContent=[r.ciudad||'', faltas.join(' · ')].filter(Boolean).join(' · ');
    $('#mia-enlace').value=enlacePersonal();
    return;
  }
  F.mia.hidden=true; F.form.hidden=false;
  if(modo==='editar' && miRegistro){
    F.titulo.textContent='Corrige tus datos';
    F.nombre.value=miRegistro.nombre; F.fecha.value=String(miRegistro.fecha).slice(0,10);
    F.hora.value=miRegistro.hora?String(miRegistro.hora).slice(0,5):'';
    F.ciudad.value=miRegistro.ciudad||'';
    ciudadSel = miRegistro.lat!=null ? {lat:miRegistro.lat,lon:miRegistro.lon,tz:miRegistro.zona,nombre:miRegistro.ciudad} : null;
    F.ok.textContent='Guardar cambios'; F.cancelar.hidden=false;
  } else {
    F.titulo.textContent='Tu estrella';
    F.nombre.value=''; F.fecha.value=''; F.hora.value=''; F.ciudad.value=''; ciudadSel=null;
    F.ok.textContent='Poner mi estrella'; F.cancelar.hidden=true;
  }
  F.sug.innerHTML=''; F.msg.textContent=''; avisarFaltas();
}
function enlacePersonal(){ return location.origin+location.pathname+'?c='+miCodigo; }

/* Qué se pierde sin hora o sin ciudad, dicho antes de guardar. */
function avisarFaltas(){
  const h=F.hora.value, c=ciudadSel;
  const partes=[];
  if(!h) partes.push('Sin hora, tu Luna sale aproximada (al mediodía) y no hay Ascendente.');
  else if(!c) partes.push('Con hora pero sin ciudad se asume Tijuana; si naciste en otro huso horario el Ascendente cambia.');
  if(h && c) partes.push('Con hora y ciudad la carta sale completa.');
  F.nota.textContent=partes.join(' ');
}
F.hora.addEventListener('input',avisarFaltas);

F.ciudad.addEventListener('input',e=>{ ciudadSel=null; avisarFaltas(); clearTimeout(timer); const q=e.target.value.trim(); if(q.length<3){ F.sug.innerHTML=''; return; } timer=setTimeout(()=>buscarCiudad(q),350); });
async function buscarCiudad(q){
  try{
    const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=es&format=json`);
    const j=await r.json(); const res=j.results||[];
    F.sug.innerHTML=res.map((c,i)=>`<button type="button" data-i="${i}">${c.name}${c.admin1?', '+c.admin1:''} · ${c.country||''} <span style="opacity:.5">(${c.timezone})</span></button>`).join('')||'<div class="small vacio">Sin resultados. Prueba con la ciudad grande más cercana.</div>';
    F.sug.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ const c=res[+b.dataset.i]; ciudadSel={lat:c.latitude,lon:c.longitude,tz:c.timezone,nombre:`${c.name}, ${c.country||''}`}; F.ciudad.value=ciudadSel.nombre; F.sug.innerHTML=''; avisarFaltas(); }));
  }catch(err){ F.sug.innerHTML='<div class="small vacio">No se pudo buscar la ciudad (¿sin red?). Puedes guardar sin ella.</div>'; }
}

F.form.addEventListener('submit',async e=>{
  e.preventDefault();
  const nombre=F.nombre.value.trim(), f=F.fecha.value, h=F.hora.value;
  if(!nombre){ F.msg.textContent='Falta tu nombre o apodo.'; F.nombre.focus(); return; }
  if(!f){ F.msg.textContent='Falta la fecha de nacimiento.'; F.fecha.focus(); return; }
  if(F.ciudad.value.trim() && !ciudadSel){ F.msg.textContent='Elige la ciudad de la lista (o bórrala para guardar sin ciudad).'; return; }
  const datos={nombre, fecha:f, hora:h?h+':00':null, ciudad:ciudadSel?ciudadSel.nombre:null, lat:ciudadSel?ciudadSel.lat:null, lon:ciudadSel?ciudadSel.lon:null, zona:ciudadSel?ciudadSel.tz:null};
  F.ok.disabled=true; F.msg.textContent='Guardando…';
  try{
    if(modo==='editar'){
      await rpc('editar',Object.assign({codigo:miCodigo},datos));
    } else {
      const r=await rpc('registrar',Object.assign({clave},datos));
      miCodigo=r.codigo; miId=r.id; guardar(LS.codigo,miCodigo); guardar(LS.id,miId);
    }
    filas=null; await cargar(false); await cargarMio(); pintarPanel();
    Mapa.fijar(miId);
    if(modo==='mia') $('#mia-msg').textContent = 'Listo. Guarda tu enlace: con él corriges o borras tu estrella desde cualquier dispositivo.';
  }catch(err){
    if(esClaveMala(err)){ clave=''; guardar(LS.clave,null); pedirClave('La clave cambió. Pide la nueva al equipo.'); }
    else F.msg.textContent='No se pudo guardar: '+err.message;
  }
  F.ok.disabled=false;
});
F.cancelar.addEventListener('click',()=>{ modo='mia'; pintarPanel(); });

$('#mia-editar').addEventListener('click',()=>{ modo='editar'; pintarPanel(); F.nombre.focus(); });
$('#mia-copiar').addEventListener('click',async()=>{
  const inp=$('#mia-enlace'); inp.select();
  try{ await navigator.clipboard.writeText(inp.value); $('#mia-msg').textContent='Enlace copiado.'; }
  catch(e){ document.execCommand('copy'); $('#mia-msg').textContent='Enlace seleccionado: cópialo con Ctrl+C.'; }
});
$('#mia-borrar').addEventListener('click',async()=>{
  if(!confirm('¿Borrar tu estrella del mapa? Se quitan tu nombre y tus datos de la base. Puedes volver a registrarte cuando quieras.')) return;
  try{
    await rpc('borrar',{codigo:miCodigo});
    miCodigo=''; miId=''; miRegistro=null; guardar(LS.codigo,null); guardar(LS.id,null); modo='alta';
    filas=null; await cargar(false); pintarPanel(); $('#mia-msg').textContent='';
  }catch(err){ $('#mia-msg').textContent='No se pudo borrar: '+err.message; }
});
$('#mia-ver').addEventListener('click',()=>{ Mapa.fijar(miId); $('#mapa').scrollIntoView({behavior:'smooth',block:'start'}); });

/* ---------- arranque ---------- */
if(!M.A){ document.body.insertAdjacentHTML('afterbegin','<p class="fallo">No cargó astronomy-engine (¿sin red?). Sin él no se puede calcular nada.</p>'); }
else if(!configurada || clave) entrar(); else pedirClave('');
})();
