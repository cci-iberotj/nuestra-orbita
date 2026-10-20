/* ═══════════════════════════════════════════════════════════
   Nuestra Órbita · La aplicación
   Equipo de Diseño y Medios · IBERO Tijuana

   Une las piezas: la entrada con nombre + PIN (que el navegador
   recuerda), el alta por pasos que arma el perfil, el mapa 3D, los
   paneles en llano, el recorrido y el glosario, y el sondeo que
   hace aparecer a quien se acaba de registrar.

   La base se usa SÓLO a través de funciones (rpc) con el código de
   sesión; la tabla no se lee ni se escribe directo.
   ═══════════════════════════════════════════════════════════ */
import { crearMapa } from './mapa3d.js?v=2.15';
const M = window.Motor, T = window.Textos, L = window.Lecturas;
const $ = s=>document.querySelector(s);
const LS = {sesion:'orbita.sesion'};
const guardar=(k,v)=>{ try{ v==null?localStorage.removeItem(k):localStorage.setItem(k,v); }catch(e){} };
const leer=k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } };
const configurada = !!(CONFIG.supabase.url && CONFIG.supabase.llave);

/* ---------- base ---------- */
async function rpc(fn, args){
  const K=CONFIG.supabase.llave; let r;
  try{ r=await fetch(CONFIG.supabase.url+'/rest/v1/rpc/'+fn,{method:'POST',headers:{apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(args||{})}); }
  catch(e){ throw new Error('No hubo forma de llegar a la base. ¿Sin red?'); }
  const texto=await r.text(); let j=null; try{ j=texto?JSON.parse(texto):null; }catch(e){}
  if(!r.ok){ const e=new Error((j&&(j.message||j.hint))||('error '+r.status)); e.codigo=j&&j.code; throw e; }
  return j;
}
const sinSesion = e => e.codigo==='28000' && /sesión/.test(e.message);

/* ---------- estado ---------- */
let sesion=leer(LS.sesion)||leer('constelacion.sesion')||'';   // la segunda llave es la del nombre viejo
let yo=null;            // mi registro completo
let filas=null;         // ver_personas
let cartas=new Map();   // id|actualizado → persona
let lista=[];           // lo que está en el mapa
let mapa=null, sondeo=null, seleccion=null;
let trHoy=null;

/* ---------- pantallas ---------- */
function conSesion(){ return !!(yo&&sesion); }
function pintarLado(){
  $('#nav-nombre').textContent = yo ? yo.nombre : 'Mi perfil';
  ['#detalle','#mia','#clima'].forEach(s=>$(s).hidden=!conSesion());
  $('#nav').hidden=!conSesion();
  if(conSesion()){ $('#entrada-velo').hidden=true; if(!editando) $('#alta').hidden=true; }
}
/* Sin sesión, lo único que hay en pantalla es la puerta: el alta
   (primera vez) o la entrada con nombre y PIN (si ya hay estrella). */
function puerta(cual){
  if(cual==='alta'){ $('#entrada-velo').hidden=true; abrirAlta(false); }
  else { $('#alta').hidden=true; $('#entrada-velo').hidden=false; $('#e-msg').textContent=''; setTimeout(()=>$('#e-nombre').focus(),80); }
}
function aviso(txt){ const a=$('#aviso'); a.innerHTML=txt||''; a.hidden=!txt; }

/* ---------- cargar ---------- */
async function cargarMio(){
  if(!sesion) return;
  try{ const r=await rpc('mi_registro',{codigo:sesion}); yo=Array.isArray(r)?r[0]:r; if(!yo){ cerrarSesion(); } }
  catch(err){ if(sinSesion(err)) cerrarSesion(); else aviso('No se pudo abrir tu registro: '+err.message); }
}
async function cargar(primera){
  if(!configurada||!conSesion()){ filas=[]; refrescarMapa(); return; }
  try{
    const r=await rpc('ver_personas',{codigo:sesion});
    if(JSON.stringify(r)===JSON.stringify(filas)) return;
    filas=r; refrescarMapa();
  }catch(err){
    if(sinSesion(err)){ cerrarSesion(); return; }
    if(primera) aviso('No se pudo leer el mapa: '+err.message);
  }
}
function refrescarMapa(){
  const demo=!conSesion()||!filas||filas.length===0;
  if(demo) lista=M.DEMO.map(p=>Object.assign({},p,{carta:p.carta||(p.carta=M.carta(p)),etapa:M.etapa(p),pron:'elle'}));
  else lista=filas.map(f=>{ const k=f.id+'|'+f.actualizado; let p=cartas.get(k); if(!p){ p=M.persona(f); cartas.set(k,p); } return p; });
  $('#aviso-demo').hidden=!demo;
  $('#aviso-solo').hidden=!(conSesion()&&filas&&filas.length===1);
  mapa.poner(lista,{miId:conSesion()?yo.id:null, descubiertos:conSesion()?yo.descubiertos:[]});
  if(!document.body.classList.contains('listo')) setTimeout(()=>document.body.classList.add('listo'), 900);
  trHoy=mapa.cielo();
  pintarClima(); pintarMia(); pintarDetalle(seleccion);
}
function cerrarSesion(){ sesion=''; yo=null; filas=null; guardar(LS.sesion,null); if(sondeo){ clearInterval(sondeo); sondeo=null; } seleccion=null; document.body.classList.remove('listo'); pintarLado(); refrescarMapa(); puerta('entrar'); }
async function abrirSesion(codigo){
  sesion=codigo; guardar(LS.sesion,codigo);
  // lo mío y el mapa se piden al mismo tiempo, no uno tras otro
  filas=null; const [,r]=await Promise.all([cargarMio(), configurada?rpc('ver_personas',{codigo}).catch(()=>null):null]);
  if(!yo) return false;
  pintarLado(); if(r){ filas=r; refrescarMapa(); } else await cargar(true);
  if(sondeo) clearInterval(sondeo);
  sondeo=setInterval(()=>cargar(false), CONFIG.sondeo||15000);
  return true;
}

/* ---------- paneles ---------- */
const otros = () => lista.filter(p=>p.id!==(yo&&yo.id));
const descubiertos = () => new Set((yo&&yo.descubiertos)||[]);
const vinculoCon = id => mapa.vinculos.find(v=>(v.a.id===yo.id&&v.b.id===id)||(v.b.id===yo.id&&v.a.id===id));
const esYo = p => yo && p.id===yo.id;

function pintarClima(){
  if(!trHoy||!window.Dia) return;
  const D=window.Dia; const c=D.cielo(new Date());
  const yoP = conSesion() ? lista.find(x=>x.id===yo.id) : null;
  const fF=new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'long',timeZone:'America/Tijuana'});
  const cls = t => t==='A'?'arm':t==='T'?'ten':t==='C'?'conj':'neu';
  // titular
  let h=`<div class="k">El cielo de hoy · ${fF.format(c.fecha)}</div>
    <div class="titular">${c.titular}</div>
    <div class="subtitular">${c.subtitular}</div>
    <details class="lectura"><summary>¿Por qué?</summary><ul class="puntos">${c.porque.map(x=>`<li>${x}</li>`).join('')}</ul></details>
    <div class="tiles">
      <div class="tile"><div class="k">Luna</div><b>${c.luna.signo} · ${c.fase.nombre.replace('Luna ','')}</b><div class="small muted">${c.fase.verbo}${c.luna.cambia?` · entra en ${c.luna.cambia.signo} el ${D.fechaCorta(c.luna.cambia.fecha)}`:''}</div></div>
      <div class="tile ${c.planetas.Mercury.retro?'ten':''}"><div class="k">Mercurio</div><b>${c.planetas.Mercury.signo} · ${c.planetas.Mercury.retro?'retrógrado':'directo'}</b><div class="small muted">${c.planetas.Mercury.retro&&c.planetas.Mercury.estacion?`directo el ${D.fechaCorta(c.planetas.Mercury.estacion)}`:c.planetas.Mercury.estacion?`retrógrado el ${D.fechaCorta(c.planetas.Mercury.estacion)}`:''}${c.planetas.Mercury.cambia?` · entra en ${c.planetas.Mercury.cambia.signo} el ${D.fechaCorta(c.planetas.Mercury.cambia.fecha)}`:''}</div></div>
    </div>`;
  // aspectos de la Luna hoy
  if(c.aspectos.length) h+=`<div class="hoy-items" style="margin-top:4px">${c.aspectos.slice(0,2).map(x=>`<span class="hoy-item ${cls(x.tipo)}"><b>☽ ${x.a.s} ${M.PGL[x.planeta]||({Jupiter:'♃',Saturn:'♄'})[x.planeta]} Luna en ${x.a.n} con ${D.PLANETA[x.planeta]}</b><span>${x.txt}</span></span>`).join('')}</div>`;
  // para ti
  if(yoP){
    const pt=D.paraTi(yoP.carta,c);
    h+=`<div class="k" style="margin-top:14px">Para ti</div><div class="hoy-items">
      <span class="hoy-item neu"><b>☽ Luna por tu casa ${pt.casa.n}</b><span>${pt.casa.d}${pt.casa.desdeSol?' · contada desde tu signo solar':''}</span></span>
      ${pt.transitos.map(x=>`<span class="hoy-item ${cls(x.tipo)}"><b>${M.PGL[x.planeta]} ${x.a.s} ${T.PUNTO[x.punto].corto}</b><span>${x.frase}</span></span>`).join('')}</div>`;
    // con los demás
    const otros=lista.filter(p=>p.id!==yo.id&&!p.demo);
    if(otros.length){
      const lista3=D.conLosDemas(yoP,otros,c,p=>{ const v=vinculoCon(p.id); return v?T.tonoLlano(v.H):{t:'Neutral',c:'var(--azul)'}; });
      h+=`<div class="k" style="margin-top:14px">Con los demás</div><div class="hoy-items">${lista3.map(x=>`<span class="hoy-item ${cls(x.tipo)}"><b>Entre tú y ${x.p.n} <span class="etiqueta ${x.etiqueta.c.includes('oro')?'arm':x.etiqueta.c.includes('violeta')?'ten':'conj'}" style="margin-left:6px">${x.etiqueta.t}</span></b><span>${x.frase}</span></span>`).join('')}</div>`;
    }
  }
  // en el trabajo
  const P=c.planetas;
  h+=`<div class="k" style="margin-top:14px">En el trabajo</div><div class="trabajo">
    <div class="trabajo-fila"><span class="glifo-g">☿</span><div><b>Comunicación</b> · Mercurio en ${P.Mercury.signo}${P.Mercury.retro?', retrógrado':''}<div class="small muted">${P.Mercury.retro?D.RETRO+'. ':''}${P.Mercury.lectura}.${P.Mercury.cambia?` Cambia el ${D.fechaCorta(P.Mercury.cambia.fecha)}.`:''}</div></div></div>
    <div class="trabajo-fila"><span class="glifo-g">♂</span><div><b>Energía y roces</b> · Marte en ${P.Mars.signo}<div class="small muted">Energía ${P.Mars.lectura}.${P.Mars.cambia?` Cambia el ${D.fechaCorta(P.Mars.cambia.fecha)}.`:''}</div></div></div>
    <div class="trabajo-fila"><span class="glifo-g">♀</span><div><b>Colaboración</b> · Venus en ${P.Venus.signo}<div class="small muted">Colaboración ${P.Venus.lectura}.${P.Venus.cambia?` Cambia el ${D.fechaCorta(P.Venus.cambia.fecha)}.`:''}</div></div></div>
    <div class="trabajo-fila"><span class="glifo-g">☽</span><div><b>Ciclo</b> · ${c.fase.nombre}<div class="small muted">${c.fase.verbo}: ${c.fase.d}. ${c.fase.proxima.nombre.charAt(0).toUpperCase()+c.fase.proxima.nombre.slice(1)} el ${D.fechaCorta(c.fase.proxima.fecha)}.</div></div></div>
  </div>`;
  // esta semana
  if(c.semana.length) h+=`<details class="lectura"><summary>Esta semana</summary><ul class="puntos">${c.semana.map(x=>`<li><b>${D.fechaCorta(x.fecha)}:</b> ${x.txt}</li>`).join('')}</ul></details>`;
  $('#clima-cuerpo').innerHTML=h;
}

function pintarMia(){
  if(!conSesion()) return;
  const p=lista.find(x=>x.id===yo.id); if(!p){ $('#mia').innerHTML=''; return; }
  const n=otros().length, d=[...descubiertos()].filter(id=>lista.some(x=>x.id===id)).length;
  const comp=T.comparar(yo.palabras,p.carta,yo.pronombre);
  const falta=M.faltante(p);
  $('#mia').innerHTML=`<h4>${yo.nombre} <span class="muted" style="font-size:14px;font-family:Manrope">· tu estrella</span></h4>
    <div class="small">${T.descripcionEstrella(p.carta,true)}</div>
    <details class="lectura"><summary>Leer mi carta</summary>${L.leerPersona(p.carta,true).map(x=>`<div class="lectura-parte"><div class="k">${x.t}</div><div>${x.d}</div></div>`).join('')}</details>
    <div class="k" style="margin-top:10px">Etapa ${p.etapa} de 3</div>
    <div class="etapas"><i class="${p.etapa>=1?'on':''}"></i><i class="${p.etapa>=2?'on':''}"></i><i class="${p.etapa>=3?'on':''}"></i></div>
    <div class="small">${falta||'Perfil completo: signo solar, signo lunar y ascendente.'}</div>
    ${falta?'<div class="cta"><button type="button" class="boton mini" id="mia-completar">Completar mi perfil</button></div>':''}
    <div class="k" style="margin-top:12px">Hilos descubiertos</div>
    <div class="descubre">${n?`<b>${d}</b> de ${n}. ${d<n?'Toca un hilo o una estrella para descubrir uno.':'Todos descubiertos.'}`:'Todavía no hay nadie más en el mapa.'}</div>
    ${comp.filas.length?`<div class="k" style="margin-top:12px">Lo que dijiste de ti</div>
    <div class="palabras">${comp.filas.map(f=>`<span class="${f.coincide?'si':''}">${f.coincide?'✓ ':''}${f.texto}</span>`).join('')}</div>
    <div class="small">${comp.frase}</div>`:''}
    <div class="cta"><button type="button" class="boton mini sec" id="mia-ver">Ver mi estrella</button></div>`;
  const c=$('#mia-completar'); if(c) c.addEventListener('click',()=>abrirAlta(true));
  $('#mia-ver').addEventListener('click',()=>{ mapa.fijar(yo.id); $('.escena').scrollIntoView({behavior:'smooth',block:'start'}); });
}

const fichaDe = c => `<div class="ficha">
  <span>Signo solar</span><span>${M.fmt(c.Sun)} · ${M.elemDe(c.Sun)}</span>
  <span>Signo lunar</span><span>${M.fmt(c.Moon)}${c.exacta?'':' ≈'}</span>
  <span>Ascendente</span><span>${c.Asc!=null?M.fmt(c.Asc):'<i class="muted">requiere hora exacta</i>'}</span>
  <span>Mercurio · mente</span><span>${M.fmt(c.Mercury)}</span>
  <span>Venus · afecto</span><span>${M.fmt(c.Venus)}</span>
  <span>Marte · acción</span><span>${M.fmt(c.Mars)}</span></div>`;

function pintarDetalle(sel, fijo){
  const d=$('#detalle'); if(!conSesion()){ d.innerHTML=''; return; }
  if(!sel){ d.innerHTML=`<h4>Afinidades</h4><p class="vacio small" style="margin:0">Toca una estrella para ver su ficha, o un hilo para ver cómo se llevan dos personas. Arrastra para girar el cielo.</p>`; return; }
  if(sel.tipo==='nodo'){
    const p=lista.find(x=>x.id===sel.p.id)||sel.p, c=p.carta, yoMismo=esYo(p);   // la versión fresca, por si se corrigió el perfil
    const notas=[p.c||'', p.demo?'persona inventada':'', c.exacta?'':(c.aprox?'hora aproximada: signo lunar casi exacto':'sin hora: signo lunar aproximado'), (c.exacta&&p.lugarSupuesto)?'sin ciudad: se asumió Tijuana':''].filter(Boolean);
    const afines=mapa.vinculos.filter(v=>v.a.id===p.id||v.b.id===p.id).map(v=>Object.assign({otro:v.a.id===p.id?v.b:v.a},v)).sort((a,b)=>b.I-a.I).slice(0,3);
    const v=!yoMismo&&!p.demo?vinculoCon(p.id):null;
    d.innerHTML=`<h4>${p.n}${yoMismo?' <span class="muted" style="font-size:14px;font-family:Manrope">· tú</span>':''}</h4>
      <div class="k">${notas.join(' · ')}</div>${fichaDe(c)}
      <details class="lectura"><summary>${yoMismo?'Leer mi carta':'Leer su carta'}</summary>${L.leerPersona(c,yoMismo).map(x=>`<div class="lectura-parte"><div class="k">${x.t}</div><div>${x.d}</div></div>`).join('')}</details>
      <div class="k" style="margin-top:10px">Hoy</div><div class="hoy-items">${itemsHoy(T.diaPersona(c, yoMismo?'ti':p.n, trHoy||M.cielo(new Date())))}</div>
      <div class="k" style="margin-top:10px">Vínculos más intensos</div>
      <ul class="lista">${afines.map(x=>`<li><span class="tono" style="color:${T.tonoLlano(x.H).c}"><i></i></span>${x.otro.n}<span class="orb">${T.intensidadLlana(x.I)}</span></li>`).join('')||'<li class="vacio">todavía no hay nadie más en el mapa</li>'}</ul>
      ${v?`<div class="cta"><button type="button" class="boton mini ${descubiertos().has(p.id)?'sec':'pulsa'}" id="d-hilo">${descubiertos().has(p.id)?'Ver nuestro hilo':'Descubrir nuestro hilo'}</button></div>`:''}`;
    const b=$('#d-hilo'); if(b) b.addEventListener('click',()=>{ const k=mapa.vinculos.indexOf(v); seleccion={tipo:'hilo',v,k}; pintarDetalle(seleccion,true); });
  } else {
    const v=sel.v; const a=v.a, b=v.b; const tn=T.tonoLlano(v.H);
    const tuyo=yo&&(a.id===yo.id||b.id===yo.id); const otro=tuyo?(a.id===yo.id?b:a):null;
    const [p1,p2]= tuyo ? [yo.id===a.id?a:b, otro] : [a,b];
    const tr=trHoy||M.cielo(new Date());
    const lect=L.leerVinculo(v);                       // [intensidad, …aspectos, elementos]
    const clase=tn.c.includes('oro')?'arm':tn.c.includes('violeta')?'ten':'neu';
    const tipoAsp=x=>x.a.a===0?'conj':(x.a.a===60||x.a.a===120)?'arm':'ten';
    const ETQ={arm:'armonía',ten:'tensión',conj:'conjunción'};
    d.innerHTML=`<h4>${tuyo?'Tú':p1.n} <span class="muted">y</span> ${p2.n}</h4>
      <div class="tiles">
        <div class="tile"><div class="k">Intensidad</div><div class="medidor"><i style="width:${Math.min(v.I/25*100,100)}%"></i></div><b>${M.banda(v.I)}</b></div>
        <div class="tile ${clase}"><div class="k">Tipo de vínculo</div><b class="tono" style="color:${tn.c}"><i></i>${tn.t}</b><div class="small muted">${tn.d}</div></div>
      </div>
      <div class="veredicto ${clase}">${lect[0]}</div>
      <div class="k" style="margin-top:14px">Hoy</div>
      ${hoyPareja(p1,p2,tr,tuyo)}
      <div class="k" style="margin-top:14px">Aspectos principales</div>
      <div class="aspectos">${v.lista.slice(0,3).map(x=>{ const xx=(tuyo&&p1===b)?Object.assign({},x,{k1:x.k2,k2:x.k1}):x; const t=tipoAsp(x); return `<div class="asp-fila"><span class="asp-glifo ${t}">${M.PGL[xx.k1]} ${x.a.s} ${M.PGL[xx.k2]}</span><span>${T.quienes(xx,p1.n,p2.n,tuyo)}</span><span class="etiqueta ${t}">${ETQ[t]}</span></div>`; }).join('')||'<div class="vacio small">sin aspectos marcados entre sus cartas</div>'}</div>
      <details class="lectura"><summary>Leer el vínculo completo</summary><ul class="puntos">${lect.slice(1).map(x=>`<li>${x}</li>`).join('')}</ul></details>`;
    if(tuyo&&fijo) descubrir(otro.id);
  }
}
/* El cielo de hoy como filas cortas: quién · [glifo aspecto punto] efecto */
function itemsHoy(l){ return l.length ? l.map(x=>`<span class="hoy-item ${x.tipo==='A'?'arm':x.tipo==='T'?'ten':'conj'}"><b>${M.PGL[x.planeta]} ${x.simbolo} ${x.puntoCorto}</b><span>${x.consecuencia}</span></span>`).join('') : '<span class="muted small">sin aspectos del cielo</span>'; }
function hoyPareja(p1,p2,tr,tuyo){
  const n1=tuyo?'ti':p1.n; const l1=T.diaPersona(p1.carta,n1,tr), l2=T.diaPersona(p2.carta,p2.n,tr); const r=T.resumenDia(l1,l2,n1,p2.n);
  return `<div class="veredicto ${r.clase}"><b>Entre ustedes:</b> ${r.txt}</div>
    <div class="hoy-fila"><span class="quien">${tuyo?'A ti':'A '+p1.n}</span><div class="hoy-items">${itemsHoy(l1)}</div></div>
    <div class="hoy-fila"><span class="quien">A ${p2.n}</span><div class="hoy-items">${itemsHoy(l2)}</div></div>`;
}
async function descubrir(otroId){
  if(!yo||descubiertos().has(otroId)) return;
  try{ yo.descubiertos=await rpc('descubrir',{codigo:sesion,otro:otroId}); mapa.poner(lista,{miId:yo.id,descubiertos:yo.descubiertos}); pintarMia(); }
  catch(e){}
}

/* ---------- alta y perfil por pasos ---------- */
const datosVacios=()=>({nombre:'',pin:'',fecha:'',hora_tipo:'no',hora:'',hora_franja:null,ciudad:null,pronombre:'elle',nivel:'nada',palabras:[]});
let datos=datosVacios(), editando=false, paso=0;
const PASOS=[
  {id:'nombre', titulo:'¿Cómo te dicen en el equipo?', ayuda:'Así se verá tu estrella. Sólo el nombre o apodo.',
   html:d=>`<label>Nombre o apodo<input type="text" id="p-nombre" maxlength="24" value="${esc(d.nombre)}" required autocomplete="off"></label>
            ${editando?'':'<label>Elige un PIN de cuatro números<input type="password" id="p-pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required autocomplete="new-password"></label><div class="small muted">Es tu llave para entrar desde otro teléfono o computadora. Aquí ya queda guardado.</div>'}`,
   leer:d=>{ d.nombre=$('#p-nombre').value.trim(); if(d.nombre.length<2) return 'Pon al menos dos letras.'; if(!editando){ d.pin=$('#p-pin').value; if(!/^\d{4}$/.test(d.pin)) return 'El PIN son cuatro números.'; } }},
  {id:'fecha', titulo:'¿Cuándo naciste?', ayuda:'Es lo único indispensable: con la fecha se calculan el signo solar y casi todo el mapa. Nadie la ve; el mapa enseña signos, no fechas.',
   html:d=>`<label>Fecha de nacimiento<input type="date" id="p-fecha" value="${d.fecha}" min="1900-01-01" required></label>`,
   leer:d=>{ d.fecha=$('#p-fecha').value; if(!d.fecha) return 'Falta la fecha.'; if(new Date(d.fecha)>new Date()) return 'Esa fecha todavía no llega.'; }},
  {id:'hora', titulo:'¿Sabes a qué hora naciste?', ayuda:'Con la hora se calcula el signo lunar exacto y, si es la hora exacta, el ascendente. Si no la sabes, tu estrella sale igual.',
   html:d=>`<div class="opciones" id="p-tipo">
      <button type="button" class="opcion ${d.hora_tipo==='exacta'?'on':''}" data-v="exacta"><b>Sí, la sé</b><small>Está en tu acta de nacimiento</small></button>
      <button type="button" class="opcion ${d.hora_tipo==='aprox'?'on':''}" data-v="aprox"><b>Más o menos</b><small>Mañana, tarde, noche…</small></button>
      <button type="button" class="opcion ${d.hora_tipo==='no'?'on':''}" data-v="no"><b>No la sé</b><small>El signo lunar sale aproximado</small></button></div>
      <div id="p-hora-exacta" ${d.hora_tipo==='exacta'?'':'hidden'} style="margin-top:10px"><label>Hora<input type="time" id="p-hora" value="${d.hora}"></label></div>
      <div id="p-hora-aprox" ${d.hora_tipo==='aprox'?'':'hidden'} style="margin-top:10px"><div class="opciones dos" id="p-franja">
        ${[['madrugada','Madrugada','12 a 6 am'],['manana','Mañana','6 am a 12'],['tarde','Tarde','12 a 6 pm'],['noche','Noche','6 pm a 12']].map(([k,t,s])=>`<button type="button" class="opcion ${d.hora_franja===k?'on':''}" data-v="${k}"><b>${t}</b><small>${s}</small></button>`).join('')}</div></div>`,
   montar:d=>{ elegir('#p-tipo',v=>{ d.hora_tipo=v; $('#p-hora-exacta').hidden=v!=='exacta'; $('#p-hora-aprox').hidden=v!=='aprox'; }); elegir('#p-franja',v=>{ d.hora_franja=v; }); },
   leer:d=>{ if(d.hora_tipo==='exacta'){ d.hora=$('#p-hora').value; if(!d.hora) return 'Pon la hora, o elige «más o menos».'; } if(d.hora_tipo==='aprox'&&!d.hora_franja) return 'Elige en qué parte del día.'; }},
  {id:'ciudad', titulo:'¿En qué ciudad naciste?', ayuda:'Sólo hace falta con hora exacta: el ascendente depende del lugar de nacimiento.',
   saltar:d=>d.hora_tipo!=='exacta',
   html:d=>`<label>Ciudad<input type="search" id="p-ciudad" placeholder="Escribe y elige de la lista" value="${esc(d.ciudad?d.ciudad.nombre:'')}" autocomplete="off"></label><div class="sug" id="p-sug"></div><div class="small muted">Si la dejas vacía se asume Tijuana.</div>`,
   montar:d=>{ let timer=null; $('#p-ciudad').addEventListener('input',e=>{ d.ciudad=null; clearTimeout(timer); const q=e.target.value.trim(); if(q.length<3){ $('#p-sug').innerHTML=''; return; } timer=setTimeout(()=>buscarCiudad(q,d),350); }); },
   leer:d=>{ if($('#p-ciudad').value.trim()&&!d.ciudad) return 'Elige la ciudad de la lista, o bórrala.'; }},
  {id:'tu', titulo:'Dos cosas sobre ti', ayuda:'Para hablarte bien y para explicarte lo justo.',
   html:d=>`<div class="k" style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3)">¿Cómo te hablamos?</div><div class="opciones tres" id="p-pron">
      ${[['ella','Ella'],['el','Él'],['elle','Elle']].map(([k,t])=>`<button type="button" class="opcion ${d.pronombre===k?'on':''}" data-v="${k}"><b>${t}</b></button>`).join('')}</div>
      <div class="k" style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3);margin-top:14px">¿Qué tanto sabes de esto?</div><div class="opciones tres" id="p-nivel">
      ${[['nada','Nada','Me explicas todo'],['algo','Algo','Sé mi signo y poco más'],['bastante','Bastante','Sé qué es un ascendente']].map(([k,t,s])=>`<button type="button" class="opcion ${d.nivel===k?'on':''}" data-v="${k}"><b>${t}</b><small>${s}</small></button>`).join('')}</div>`,
   montar:d=>{ elegir('#p-pron',v=>{ d.pronombre=v; }); elegir('#p-nivel',v=>{ d.nivel=v; }); },
   leer:()=>{}},
  {id:'palabras', titulo:'Elige tres palabras que te describan', ayuda:'Al terminar, el mapa compara lo que dices de ti con lo que dice tu carta. Es un juego, no un examen.',
   html:d=>`<div class="chips" id="p-chips">${T.PALABRAS.map(w=>`<button type="button" class="chip ${d.palabras.includes(w.k)?'on':''}" data-v="${w.k}">${T.palabra(w.k,d.pronombre)}</button>`).join('')}</div><div class="contador" id="p-cuenta"></div>`,
   montar:d=>{ const cuenta=()=>{ $('#p-cuenta').textContent=`${d.palabras.length} de 3`; $('#p-chips').querySelectorAll('.chip').forEach(b=>{ b.disabled=d.palabras.length>=3&&!d.palabras.includes(b.dataset.v); }); }; $('#p-chips').addEventListener('click',e=>{ const b=e.target.closest('.chip'); if(!b) return; const k=b.dataset.v; if(d.palabras.includes(k)) d.palabras=d.palabras.filter(x=>x!==k); else if(d.palabras.length<3) d.palabras.push(k); b.classList.toggle('on',d.palabras.includes(k)); cuenta(); }); cuenta(); },
   leer:d=>{ if(d.palabras.length!==3) return 'Elige exactamente tres.'; }},
];
const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
function elegir(sel,cb){ const c=$(sel); if(!c) return; c.addEventListener('click',e=>{ const b=e.target.closest('.opcion'); if(!b) return; c.querySelectorAll('.opcion').forEach(x=>x.classList.toggle('on',x===b)); cb(b.dataset.v); }); }
async function buscarCiudad(q,d){
  try{
    const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=es&format=json`);
    const j=await r.json(); const res=j.results||[];
    $('#p-sug').innerHTML=res.map((c,i)=>`<button type="button" data-i="${i}">${c.name}${c.admin1?', '+c.admin1:''} · ${c.country||''}</button>`).join('')||'<div class="small vacio">Sin resultados. Prueba con la ciudad grande más cercana.</div>';
    $('#p-sug').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ const c=res[+b.dataset.i]; d.ciudad={lat:c.latitude,lon:c.longitude,tz:c.timezone,nombre:`${c.name}, ${c.country||''}`}; $('#p-ciudad').value=d.ciudad.nombre; $('#p-sug').innerHTML=''; }));
  }catch(err){ $('#p-sug').innerHTML='<div class="small vacio">No se pudo buscar la ciudad (¿sin red?). Puedes seguir sin ella.</div>'; }
}
/* En el alta se recorren todos los pasos. En «Mi perfil» se ve una
   ficha con cada dato y su botón «Cambiar»: abre sólo ese paso (la
   hora arrastra la ciudad si hace falta) y guarda al momento. */
let pasoSolo=null;   // en perfil: id del paso que se edita; null = la ficha
function pasosActivos(){
  if(editando){
    if(pasoSolo==null) return [];
    const lista=[PASOS.find(p=>p.id===pasoSolo)];
    if(pasoSolo==='hora' && datos.hora_tipo==='exacta') lista.push(PASOS.find(p=>p.id==='ciudad'));
    return lista;
  }
  return PASOS.filter(p=>!p.saltar||!p.saltar(datos));
}
const MESES='enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split(' ');
const FRANJA_TXT={madrugada:'madrugada',manana:'mañana',tarde:'tarde',noche:'noche'};
function pintarFicha(){
  const d=datos; const [y,m,dd]=d.fecha.split('-').map(Number);
  const filas=[
    ['nombre','Nombre o apodo', d.nombre],
    ['fecha','Fecha de nacimiento', `${dd} de ${MESES[m-1]} de ${y}`],
    ['hora','Hora de nacimiento', d.hora_tipo==='exacta'?d.hora:d.hora_tipo==='aprox'?`Más o menos: ${FRANJA_TXT[d.hora_franja]||''}`:'No la sé'],
    d.hora_tipo==='exacta'?['ciudad','Ciudad', d.ciudad?d.ciudad.nombre:'Sin ciudad (se asume Tijuana)']:null,
    ['tu','Cómo te hablamos · qué tanto sabes', `${{ella:'Ella',el:'Él',elle:'Elle'}[d.pronombre]} · ${{nada:'nada',algo:'algo',bastante:'bastante'}[d.nivel]}`],
    ['palabras','Tres palabras', d.palabras.map(k=>T.palabra(k,d.pronombre)).join(', ')||'—'],
  ].filter(Boolean);
  $('#avance').parentElement.hidden=true;
  $('#paso-num').textContent='Tu perfil';
  $('#paso').innerHTML=`<h2>${d.nombre}</h2><p class="ayuda">Cambia sólo lo que quieras; se guarda al momento.</p><div class="resumen">${filas.map(([id,k,v])=>`<div class="resumen-fila"><div><div class="k">${k}</div><div>${esc(v)}</div></div><button type="button" class="boton mini sec" data-paso="${id}">Cambiar</button></div>`).join('')}</div>`;
  $('#paso').querySelectorAll('[data-paso]').forEach(b=>b.addEventListener('click',()=>{ pasoSolo=b.dataset.paso; paso=0; pintarPaso(); }));
  $('#a-msg').textContent=''; $('#a-atras').hidden=true; $('#a-sig').textContent='Cerrar'; $('#a-extras').hidden=false; $('#a-primera').hidden=true; $('#alta .cerrar').hidden=false;
}
function pintarPaso(){
  if(editando && pasoSolo==null){ pintarFicha(); return; }
  const activos=pasosActivos(); if(paso>=activos.length) paso=activos.length-1;
  const p=activos[paso];
  $('#avance').parentElement.hidden=editando;
  $('#avance').style.width=((paso+1)/activos.length*100)+'%';
  $('#paso-num').textContent= editando ? 'Tu perfil · cambiar' : `paso ${paso+1} de ${activos.length}`;
  $('#paso').innerHTML=`<h2>${p.titulo}</h2><p class="ayuda">${p.ayuda}</p>${p.html(datos)}`;
  if(p.montar) p.montar(datos);
  $('#a-msg').textContent='';
  $('#a-atras').hidden=!editando && paso===0; $('#a-atras').textContent= editando&&paso===0 ? 'Cancelar' : 'Atrás';
  $('#a-sig').textContent = paso===activos.length-1 ? (editando?'Guardar':'Poner mi estrella') : 'Siguiente';
  $('#a-extras').hidden=true; $('#a-primera').hidden=editando; $('#alta .cerrar').hidden=!editando;
  const inp=$('#paso input'); if(inp&&inp.type!=='date') setTimeout(()=>inp.focus(),50);
}
function cargarDatosDeYo(){
  datos={nombre:yo.nombre,pin:'',fecha:String(yo.fecha).slice(0,10),hora_tipo:yo.hora_tipo||'no',hora:yo.hora?String(yo.hora).slice(0,5):'',hora_franja:yo.hora_franja||null,ciudad:yo.lat!=null?{lat:yo.lat,lon:yo.lon,tz:yo.zona,nombre:yo.ciudad}:null,pronombre:yo.pronombre||'elle',nivel:yo.nivel||'nada',palabras:(yo.palabras||[]).slice()};
}
function abrirAlta(editar){
  editando=!!editar; paso=0; pasoSolo=null;
  if(editando&&yo) cargarDatosDeYo(); else datos=datosVacios();
  $('#alta').hidden=false; pintarPaso();
}
function cerrarAlta(){ $('#alta').hidden=true; }
$('#a-atras').addEventListener('click',()=>{ if(paso>0){ paso--; pintarPaso(); } else if(editando){ cargarDatosDeYo(); pasoSolo=null; pintarPaso(); } });
$('#alta-form').addEventListener('submit',async e=>{
  e.preventDefault();
  if(editando && pasoSolo==null){ cerrarAlta(); return; }
  const activos=pasosActivos(); const p=activos[paso];
  const err=p.leer(datos); if(err){ $('#a-msg').textContent=err; return; }
  const activosDespues=pasosActivos();
  if(paso<activosDespues.length-1){ paso++; pintarPaso(); return; }
  // último paso: guardar
  const args={nombre:datos.nombre,fecha:datos.fecha,hora_tipo:datos.hora_tipo,hora:datos.hora_tipo==='exacta'?datos.hora+':00':null,hora_franja:datos.hora_tipo==='aprox'?datos.hora_franja:null,
    ciudad:datos.ciudad?datos.ciudad.nombre:null,lat:datos.ciudad?datos.ciudad.lat:null,lon:datos.ciudad?datos.ciudad.lon:null,zona:datos.ciudad?datos.ciudad.tz:null,
    pronombre:datos.pronombre,nivel:datos.nivel,palabras:datos.palabras};
  $('#a-sig').disabled=true; $('#a-msg').textContent='Guardando…';
  try{
    if(editando){
      await rpc('editar',Object.assign({codigo:sesion},args));
      await cargarMio(); filas=null; await cargar(false);
      pasoSolo=null; cargarDatosDeYo(); pintarPaso(); $('#a-msg').textContent='Guardado.';
    } else {
      const r=await rpc('registrar',Object.assign({pin:datos.pin},args));
      guardar('orbita.conocido','1'); cerrarAlta(); await abrirSesion(r.codigo);
      setTimeout(()=>mapa.fijar(yo.id),1400);
      if(yo&&!yo.recorrido&&yo.nivel!=='bastante') setTimeout(()=>abrirRecorrido(),2000);
    }
  }catch(err){ $('#a-msg').textContent=err.message; }
  $('#a-sig').disabled=false;
});
$('#a-salir').addEventListener('click',()=>{ cerrarAlta(); cerrarSesion(); });
$('#a-borrar').addEventListener('click',async()=>{
  if(!confirm('¿Borrar tu estrella del mapa? Se quitan tu nombre y tus datos de la base. Puedes volver a registrarte cuando quieras.')) return;
  try{ await rpc('borrar',{codigo:sesion}); cerrarAlta(); cerrarSesion(); }catch(err){ $('#a-msg').textContent='No se pudo borrar: '+err.message; }
});
$('#a-pin').addEventListener('click',()=>{ $('#pin-velo').hidden=false; $('#pin-msg').textContent=''; $('#pin-nuevo').value=''; setTimeout(()=>$('#pin-nuevo').focus(),50); });
$('#pin-cancelar').addEventListener('click',()=>{ $('#pin-velo').hidden=true; });
$('#pin-form').addEventListener('submit',async e=>{ e.preventDefault(); const p=$('#pin-nuevo').value; if(!/^\d{4}$/.test(p)){ $('#pin-msg').textContent='Cuatro números.'; return; } try{ await rpc('cambiar_pin',{codigo:sesion,pin:p}); $('#pin-velo').hidden=true; $('#a-msg').textContent='PIN cambiado.'; }catch(err){ $('#pin-msg').textContent=err.message; } });

/* ---------- entrada ---------- */
$('#entrar-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const nombre=$('#e-nombre').value.trim(), pin=$('#e-pin').value;
  if(!/^\d{4}$/.test(pin)){ $('#e-msg').textContent='El PIN son cuatro números.'; return; }
  $('#e-ok').disabled=true; $('#e-msg').textContent='Abriendo…';
  try{ const r=await rpc('entrar',{nombre,pin}); guardar('orbita.conocido','1'); $('#e-msg').textContent=''; $('#e-pin').value=''; await abrirSesion(r.codigo); setTimeout(()=>mapa.fijar(yo.id),1600); }
  catch(err){ $('#e-msg').textContent = err.codigo==='28000' ? 'Ese nombre y PIN no coinciden.' : err.message; }
  $('#e-ok').disabled=false;
});
$('#e-nuevo').addEventListener('click',()=>puerta('alta'));
$('#a-entrar').addEventListener('click',()=>puerta('entrar'));

/* ---------- recorrido y glosario ---------- */
let rPaso=0;
function abrirRecorrido(){ rPaso=0; pintarRecorrido(); $('#recorrido').hidden=false; }
function pintarRecorrido(){ const r=T.RECORRIDO[rPaso]; $('#r-num').textContent=`Recorrido · ${rPaso+1} de ${T.RECORRIDO.length}`; $('#r-titulo').textContent=r.t; $('#r-texto').textContent=r.d; $('#r-sig').textContent=rPaso===T.RECORRIDO.length-1?'Al mapa':'Siguiente'; }
async function cerrarRecorrido(){ $('#recorrido').hidden=true; if(yo&&!yo.recorrido){ yo.recorrido=true; try{ await rpc('marcar_recorrido',{codigo:sesion}); }catch(e){} } }
$('#r-sig').addEventListener('click',()=>{ if(rPaso<T.RECORRIDO.length-1){ rPaso++; pintarRecorrido(); } else cerrarRecorrido(); });
$('#r-saltar').addEventListener('click',cerrarRecorrido);
$('#b-recorrido').addEventListener('click',abrirRecorrido);
$('#glosario-lista').innerHTML=T.GLOSARIO.map(g=>`<div><dt>${g.t}</dt><dd>${g.d}</dd></div>`).join('');
$('#b-glosario').addEventListener('click',()=>{ $('#glosario').hidden=false; });
$('#g-volver').addEventListener('click',()=>{ $('#glosario').hidden=true; });
$('#b-perfil').addEventListener('click',()=>abrirAlta(true));
/* Cerrar una ventana: la ×, un clic en lo oscuro de afuera, o Escape.
   El alta de la primera vez sólo cierra con la × o Escape, para que
   un clic fuera no tire lo que ya se contestó. */
function cerrarVelo(v){
  if(!v||v.hidden) return;
  if(v.id==='entrada-velo' || (v.id==='alta' && !editando)) return;   // sin sesión no hay a dónde volver
  if(v.id==='recorrido') cerrarRecorrido();
  else if(v.id==='alta') cerrarAlta();
  else v.hidden=true;
}
document.addEventListener('click',e=>{
  const x=e.target.closest('[data-cerrar]'); if(x){ cerrarVelo(x.closest('.velo')); return; }
  if(e.target.classList.contains('velo') && !(e.target.id==='alta' && !editando)) cerrarVelo(e.target);
});
document.addEventListener('keydown',e=>{ if(e.key==='Escape') document.querySelectorAll('.velo:not([hidden])').forEach(cerrarVelo); });

/* ---------- arranque ---------- */
async function arrancar(){
  if(!M.A){ document.body.insertAdjacentHTML('afterbegin','<p class="fallo">No cargó astronomy-engine (¿sin red?). Sin él no se puede calcular nada.</p>'); quitarCarga(); return; }
  mapa=crearMapa($('#lienzo3d'),{
    alSeleccionar:(sel,fijo)=>{ seleccion=sel; pintarDetalle(sel,fijo); },
    alIntro:({f,escalaHTML,fundido})=>{   // la órbita HTML va pegada al anillo 3D y se funde con él
      const an=$('#carga-anillo'), es=$('#carga-estrella'), tx=$('#carga-txt'); if(!an) return;
      an.style.transform=`rotateX(62deg) scale(${escalaHTML.toFixed(4)})`; an.style.opacity=1-Math.max(0,Math.min(1,(f-.4)/.3));   // la órbita HTML se va cuando el anillo 3D ya está
      const q=1-Math.max(0,Math.min(1,(f-.1)/.6)); es.style.transform=`scale(${q})`; es.style.opacity=q; es.style.animation='none';
      tx.style.opacity=Math.max(0,1-f/.3);
    },
    alIntroFin:()=>quitarCarga(),
  });
  $('#version').textContent='v'+(CONFIG.version||'');
  if(!configurada){ aviso('Falta conectar la base (config.js). Mientras, el mapa enseña la muestra.'); }
  pintarLado();
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&conSesion()) cargar(false); });
  setInterval(()=>{ if(mapa&&lista.length){ trHoy=mapa.cielo(); pintarClima(); } },60000);
  if(sesion){ const ok=await abrirSesion(sesion); if(ok){ setTimeout(()=>mapa.fijar(yo.id),2000); return; } }
  refrescarMapa(); puerta(leer('orbita.conocido')?'entrar':'alta');
}
/* El velo de carga se va cuando el mapa ya tiene con qué dibujarse;
   pase lo que pase, a los 8 s se quita solo. */
let cargaFuera=false;
function quitarCarga(){ if(cargaFuera) return; cargaFuera=true; const c=$('#carga'); if(!c) return; c.classList.add('fuera'); setTimeout(()=>c.remove(),600); }
setTimeout(quitarCarga,12000);
arrancar();
