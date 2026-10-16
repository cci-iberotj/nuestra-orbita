/* ═══════════════════════════════════════════════════════════
   Constelación · El mapa
   Equipo de Diseño y Medios · IBERO Tijuana

   Dibuja el anillo, las estrellas, los hilos y el cielo del día.
   Es el dibujo del estudio de concepto, con dos cambios:
     · recibe la lista de personas desde fuera (poner), en vez de
       traerla fija, y recuerda quién ya estaba para que la estrella
       nueva nazca con animación;
     · los ajustes del mapa se guardan en el navegador.
   Depende de Motor (motor.js).
   ═══════════════════════════════════════════════════════════ */
window.Mapa = (function(){
'use strict';
const M = window.Motor;
const {RAD, GLIFOS, PLAN, PGL, fmt, elemDe, colorElem, aspecto, intensidad, armonia, tono, banda, cielo, climaPareja, fraseClima} = M;

const $ = s=>document.querySelector(s);
const svg=$('#svg'), gRing=$('#ring'), gHilos=$('#hilos'), gNodos=$('#nodos'), gTr=$('#transitos'), mapa=$('#mapa');
const CX=400, CY=400, R_RING=330, R_GLIFO=358;
const pos=(lon,r)=>{ const a=(180-lon)*RAD; return [CX+r*Math.cos(a), CY-r*Math.sin(a)]; };
const NS='http://www.w3.org/2000/svg';
const el=(t,attrs,parent)=>{ const e=document.createElementNS(NS,t); for(const k in attrs) e.setAttribute(k,attrs[k]); if(parent) parent.appendChild(e); return e; };

/* ---------- estado ---------- */
let lista=[];          // personas con carta, en el orden que llegan
let fechaVista=null;   // null = ahora
let pin=null;          // {tipo:'nodo',i} | {tipo:'hilo',k}
let vinculos=[];       // {i,j,I,H,lista,det}
let P0=[];             // posiciones base
let conocidos=null;    // ids que ya estaban dibujados (null = primera vez)

const AJUSTES_DEF = {umbral:4, grosor:1.2, nombres:true, transitos:true, mov:true, tema:'noche'};
const ajustes = Object.assign({}, AJUSTES_DEF);
try{ Object.assign(ajustes, JSON.parse(localStorage.getItem('constelacion.ajustes')||'{}')); }catch(e){}
function guardarAjustes(){ try{ localStorage.setItem('constelacion.ajustes', JSON.stringify(ajustes)); }catch(e){} }

function dibujarAnillo(){
  gRing.innerHTML='';
  el('circle',{cx:CX,cy:CY,r:R_RING},gRing);
  el('circle',{cx:CX,cy:CY,r:R_RING-16,'stroke-dasharray':'1 5'},gRing);
  for(let i=0;i<12;i++){
    const [x1,y1]=pos(i*30,R_RING-16), [x2,y2]=pos(i*30,R_RING);
    el('line',{x1,y1,x2,y2},gRing);
    const [gx,gy]=pos(i*30+15,R_GLIFO);
    const t=el('text',{x:gx,y:gy},gRing); t.textContent=GLIFOS[i];
  }
}

function posiciones(lista){
  // cada estrella en el grado de su Sol; el radio se ajusta para no encimarse
  const out=[]; const radios=[215,165,262,190,240];
  lista.forEach((p,i)=>{
    let r=radios[0], ok=false;
    for(const rr of radios){ const [x,y]=pos(p.carta.Sun,rr); if(out.every(q=>Math.hypot(q.x-x,q.y-y)>64)){ r=rr; ok=true; break; } }
    if(!ok) r=radios[i%radios.length];
    const [x,y]=pos(p.carta.Sun,r); out.push({x,y,r});
  });
  return out;
}

function calcularVinculos(lista){
  vinculos=[];
  for(let i=0;i<lista.length;i++) for(let j=i+1;j<lista.length;j++){
    const P=lista[i].carta,Q=lista[j].carta; const I=intensidad(P,Q), H=armonia(P,Q);
    vinculos.push({i,j,I:I.pts,det:I.det,H:H.h,lista:H.lista});
  }
}

/* Vuelve a dibujar todo. Las personas cuyo id no estaba la vez
   anterior nacen con animación; la primera vez nacen todas, una
   tras otra. */
function dibujar(){
  P0=posiciones(lista); calcularVinculos(lista);
  const nuevos=new Set(lista.filter(p=>!conocidos||!conocidos.has(p.id)).map(p=>p.id));
  const primera = conocidos===null;
  gHilos.innerHTML=''; gNodos.innerHTML='';
  vinculos.forEach((v,k)=>{
    const g=el('g',{'data-k':k},gHilos);
    const nace = nuevos.has(lista[v.i].id)||nuevos.has(lista[v.j].id);
    const path=el('path',{class:'hilo real'+(nace?' tiende':''),filter:'url(#hiloglow)',pathLength:1},g);
    if(nace) path.style.animationDelay=(primera?0.9+Math.max(v.i,v.j)*0.09:0.6)+'s';
    el('path',{class:'hilo ancho'},g);
    g.addEventListener('mouseenter',()=>{ if(!pin) foco({tipo:'hilo',k}); });
    g.addEventListener('mouseleave',()=>{ if(!pin) foco(null); });
    g.addEventListener('click',e=>{ e.stopPropagation(); pin={tipo:'hilo',k}; foco(pin); });
  });
  lista.forEach((p,i)=>{
    const nace=nuevos.has(p.id);
    const g=el('g',{class:'nodo'+(p.esTu?' tu':'')+(p.demo?' demo':'')+(nace?' nace':''),'data-i':i},gNodos);
    if(nace) g.style.setProperty('--retraso',(primera?i*0.09:0)+'s');
    el('circle',{class:'halo',r:16,fill:colorElem(p.carta.Sun),filter:'url(#glow2)'},g);
    el('circle',{class:'anillo',r:12},g);
    if(nace) el('circle',{class:'destello',r:4,fill:'none',stroke:'var(--star)'},g);
    if(p.lunaToca) el('circle',{class:'luna-toca',r:14},g);
    el('circle',{class:'cuerpo',r:5.5,fill:'var(--star)',filter:'url(#glow)'},g);
    el('circle',{class:'nucleo',r:2.5,fill:colorElem(p.carta.Sun)},g);
    if(!p.carta.exacta) el('circle',{cx:9,cy:-9,r:1.8,fill:'var(--label)',opacity:.6},g);
    const t=el('text',{y:28,class:'nombre'},g); t.textContent=p.n+(p.demo?' ·':'');
    g.addEventListener('mouseenter',()=>{ if(!pin) foco({tipo:'nodo',i}); });
    g.addEventListener('mouseleave',()=>{ if(!pin) foco(null); });
    g.addEventListener('click',e=>{ e.stopPropagation(); pin={tipo:'nodo',i}; foco(pin); });
  });
  conocidos=new Set(lista.map(p=>p.id));
  aplicarAjustes(); colocar(performance.now()); actualizarClima(); if(pin) foco(pin);
}
svg.addEventListener('click',()=>{ pin=null; foco(null); });

function geometria(t){
  return lista.map((p,i)=>{ const f=i*1.7; const dx=ajustes.mov?3.5*Math.sin(t*.00045+f):0, dy=ajustes.mov?3*Math.cos(t*.00038+f*1.3):0; return {x:P0[i].x+dx,y:P0[i].y+dy}; });
}
function colocar(t){
  const g=geometria(t);
  gNodos.querySelectorAll('.nodo').forEach((n,i)=>n.setAttribute('transform',`translate(${g[i].x.toFixed(2)} ${g[i].y.toFixed(2)})`));
  gHilos.querySelectorAll('g').forEach(gr=>{
    const v=vinculos[+gr.dataset.k]; const a=g[v.i], b=g[v.j];
    const mx=(a.x+b.x)/2, my=(a.y+b.y)/2; const cx=mx+(CX-mx)*.35, cy=my+(CY-my)*.35;
    const d=`M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    gr.querySelectorAll('path').forEach(p=>p.setAttribute('d',d));
  });
}
function aplicarAjustes(){
  mapa.dataset.tema=ajustes.tema;
  gHilos.querySelectorAll('g').forEach(gr=>{
    const v=vinculos[+gr.dataset.k]; const p=gr.querySelector('.real');
    const I=Math.pow(Math.min(v.I/25,1),1.3); const visible=v.I>=ajustes.umbral;
    p.style.stroke=tono(v.H).c; p.style.strokeWidth=((0.5+3.4*I)*ajustes.grosor).toFixed(2);
    p.style.opacity=visible?(0.22+0.65*I).toFixed(2):0; gr.style.display=visible?'':'none';
  });
  gNodos.querySelectorAll('.nombre').forEach(t=>t.style.display=ajustes.nombres?'':'none');
  gTr.style.display=ajustes.transitos?'':'none';
}

const VACIO='<h4>Afinidades</h4><p class="vacio small" style="margin:0">Pasa el cursor por una estrella o por un hilo. Toca una estrella para fijarla.</p>';
function foco(sel){
  mapa.classList.toggle('foco',!!sel);
  gHilos.querySelectorAll('g').forEach(gr=>gr.querySelector('.real').classList.remove('on'));
  gNodos.querySelectorAll('.nodo').forEach(n=>n.classList.remove('on','pin'));
  if(!sel){ $('#detalle').innerHTML=VACIO; return; }
  if(sel.tipo==='nodo'){
    const p=lista[sel.i]; const n=gNodos.querySelector(`[data-i="${sel.i}"]`); if(!p||!n){ pin=null; $('#detalle').innerHTML=VACIO; return; }
    n.classList.add('on'); if(pin) n.classList.add('pin');
    gHilos.querySelectorAll('g').forEach(gr=>{ const v=vinculos[+gr.dataset.k]; if(v.i===sel.i||v.j===sel.i){ gr.querySelector('.real').classList.add('on'); gNodos.querySelector(`[data-i="${v.i===sel.i?v.j:v.i}"]`).classList.add('on'); } });
    const c=p.carta;
    const afines=vinculos.filter(v=>v.i===sel.i||v.j===sel.i).map(v=>Object.assign({otro:lista[v.i===sel.i?v.j:v.i].n},v)).sort((a,b)=>b.I-a.I).slice(0,3);
    const notas=[p.c||''].concat(p.demo?['persona inventada']:[], c.exacta?[]:['sin hora: Luna aproximada'], (c.exacta&&p.lugarSupuesto)?['sin ciudad: se asumió Tijuana']:[]).filter(Boolean);
    $('#detalle').innerHTML=`<h4>${p.n}${p.esTu?' <span style="opacity:.5;font-size:15px">· tú</span>':''}</h4><div class="k">${notas.join(' · ')}</div>
      <div class="ficha"><span>☉ Sol</span><span>${fmt(c.Sun)} · ${elemDe(c.Sun)}</span><span>☽ Luna</span><span>${fmt(c.Moon)}${c.exacta?'':' ≈'}</span><span>Asc</span><span>${c.Asc!=null?fmt(c.Asc):'<i style="opacity:.5">requiere hora</i>'}</span><span>☿ Mercurio</span><span>${fmt(c.Mercury)}</span><span>♀ Venus</span><span>${fmt(c.Venus)}</span><span>♂ Marte</span><span>${fmt(c.Mars)}</span></div>
      <div class="k" style="margin-top:10px">Vínculos más intensos</div><ul class="lista">${afines.map(v=>`<li><span class="tono" style="color:${tono(v.H).c}"><i></i></span>${v.otro}<span class="orb">${v.I} pts · ${banda(v.I)}</span></li>`).join('')||'<li class="vacio">'+(lista.length<2?'todavía no hay nadie más en el mapa':'ninguno con esta configuración')+'</li>'}</ul>`;
  } else {
    const v=vinculos[sel.k]; const gr=gHilos.querySelector(`[data-k="${sel.k}"]`); if(!v||!gr){ pin=null; $('#detalle').innerHTML=VACIO; return; }
    gr.querySelector('.real').classList.add('on');
    [v.i,v.j].forEach(i=>gNodos.querySelector(`[data-i="${i}"]`).classList.add('on'));
    const a=lista[v.i], b=lista[v.j]; const tn=tono(v.H);
    const tr=cielo(fechaActual()); const cl=climaPareja(a.carta,b.carta,[a.n,b.n],tr);
    $('#detalle').innerHTML=`<h4>${a.n} <span style="opacity:.5">y</span> ${b.n}</h4>
      <div class="k">Intensidad</div><div class="medidor"><i style="width:${Math.min(v.I/25*100,100)}%"></i></div><div class="small">${v.I} puntos · ${banda(v.I)}</div>
      <div class="k" style="margin-top:10px">Tono</div><div class="tono" style="color:${tn.c}"><i></i>${tn.t}</div>
      <div class="k" style="margin-top:10px">Aspectos más exactos</div>
      <ul class="lista">${v.lista.slice(0,3).map(x=>`<li><span class="asp">${x.a.s}</span><span>${PGL[x.k1]} ${PLAN[x.k1]} de ${a.n} ${x.a.n} ${PGL[x.k2]} ${PLAN[x.k2]} de ${b.n}</span><span class="orb">${x.a.orb.toFixed(1)}°</span></li>`).join('')||'<li class="vacio">sin aspectos mayores entre puntos personales</li>'}</ul>
      <div class="k" style="margin-top:10px">${fechaVista?'Ese día':'Hoy'}</div>
      <div class="small">${cl.length?cl.map(x=>`${x.txt}: <b>${fraseClima(x)}</b>.`).join(' '):'Sin tránsitos marcados entre ustedes. Día tranquilo.'}</div>`;
  }
}

/* ---------- clima / tránsitos ---------- */
function fechaActual(){ if(!fechaVista) return new Date(); const ahora=new Date(); return new Date(fechaVista.getTime()+ ((ahora.getUTCHours()*60+ahora.getUTCMinutes())*60000)); }
function actualizarClima(){
  const d=fechaActual(); const tr=cielo(d);
  const fF=new Intl.DateTimeFormat('es-MX',{weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'America/Tijuana'});
  $('#clima-titulo').textContent = fechaVista ? 'El cielo de ese día' : 'El cielo de hoy';
  $('#clima-cuerpo').innerHTML = `<div style="flex-basis:100%;opacity:.65;font-size:12px">${fF.format(d)} (Tijuana)</div>` + ['Sun','Moon','Venus','Mars'].map(b=>`<span><span class="gl">${PGL[b]}</span><b>${PLAN[b]}</b> ${fmt(tr[b])}</span>`).join('');
  // quién recibe la Luna
  const tocados=[]; lista.forEach(p=>{ p.lunaToca=false; for(const k of ['Sun','Moon','Asc']){ if(p.carta[k]==null) continue; const a=aspecto(tr.Moon,p.carta[k],6); if(a && (a.a===0 || a.orb<=2.5)){ p.lunaToca=true; tocados.push(`${p.n} (${a.n} a su ${k==='Sun'?'Sol':k==='Moon'?'Luna':'Ascendente'})`); break; } } });
  $('#clima-luna').innerHTML = lista.length ? (tocados.length ? `La Luna toca hoy a <b>${tocados.join(', ')}</b>.` : 'La Luna no toca a nadie en este momento.') : '';
  // marcas en el anillo
  gTr.innerHTML='';
  ['Sun','Moon','Venus','Mars'].forEach(b=>{
    const [x,y]=pos(tr[b],R_RING-8); const g=el('g',{transform:`translate(${x} ${y})`},gTr);
    el('circle',{r:b==='Moon'?6:3.5,fill:b==='Moon'?'var(--oro)':'var(--star)',opacity:b==='Moon'?.95:.7,filter:'url(#glow)'},g);
    const t=el('text',{y:b==='Moon'?-11:-9},g); t.textContent=PLAN[b];
  });
  // anillos de pulso
  gNodos.querySelectorAll('.nodo').forEach((n,i)=>{ const p=lista[i]; let c=n.querySelector('.luna-toca'); if(p.lunaToca&&!c){ c=el('circle',{class:'luna-toca',r:14}); n.insertBefore(c,n.querySelector('.cuerpo')); } if(!p.lunaToca&&c) c.remove(); });
}

/* ---------- fondo de estrellas ---------- */
const canvas=$('#fondo'); const ctx=canvas.getContext('2d'); let estrellas=[];
function prepFondo(){ const r=mapa.getBoundingClientRect(); canvas.width=r.width*devicePixelRatio; canvas.height=r.height*devicePixelRatio; estrellas=Array.from({length:220},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.3+.3,f:Math.random()*6.28,s:Math.random()*.6+.3})); }
function pintarFondo(t){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const alba=mapa.dataset.tema==='alba';
  for(const e of estrellas){ const a=(alba?.35:.85)*(0.5+0.5*Math.sin(t*.001*e.s+e.f)); ctx.globalAlpha=a; ctx.fillStyle=alba?'#6b4fd8':'#ffffff'; ctx.beginPath(); ctx.arc(e.x*canvas.width,e.y*canvas.height,e.r*devicePixelRatio,0,6.283); ctx.fill(); }
  ctx.globalAlpha=1;
}

/* ---------- loop ---------- */
let ultimoMin=-1, corriendo=false;
function loop(t){ colocar(t); pintarFondo(t); const m=Math.floor(Date.now()/60000); if(m!==ultimoMin){ ultimoMin=m; if(!fechaVista) actualizarClima(); } requestAnimationFrame(loop); }

/* ---------- controles ---------- */
function controles(){
  const tema=$('#tema');
  tema.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===ajustes.tema));
  tema.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; ajustes.tema=b.dataset.v; tema.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); aplicarAjustes(); guardarAjustes(); });
  $('#umbral').value=ajustes.umbral; $('#grosor').value=ajustes.grosor;
  $('#umbral').addEventListener('input',e=>{ ajustes.umbral=+e.target.value; aplicarAjustes(); guardarAjustes(); });
  $('#grosor').addEventListener('input',e=>{ ajustes.grosor=+e.target.value; aplicarAjustes(); guardarAjustes(); });
  [['sw-nombres','nombres'],['sw-transitos','transitos'],['sw-mov','mov']].forEach(([id,k])=>{ const b=$('#'+id); b.classList.toggle('on',ajustes[k]); b.addEventListener('click',()=>{ ajustes[k]=!ajustes[k]; b.classList.toggle('on',ajustes[k]); aplicarAjustes(); guardarAjustes(); }); });
  $('#fecha').addEventListener('change',e=>{ if(!e.target.value){ fechaVista=null; } else { const [y,m,d]=e.target.value.split('-').map(Number); fechaVista=new Date(Date.UTC(y,m-1,d,7,0)); } actualizarClima(); if(pin) foco(pin); });
}

/* ---------- lo que usa app.js ---------- */
function arrancar(){
  dibujarAnillo(); prepFondo(); controles(); aplicarAjustes(); actualizarClima();
  if(!corriendo){ corriendo=true; requestAnimationFrame(loop); }
  window.addEventListener('resize',prepFondo);
}
/* Recibe la lista completa de personas (ya con carta). */
let firma='';
function poner(nueva){
  // Si no cambió nada no se redibuja: redibujar a la mitad de la
  // animación de nacer la corta.
  const f=nueva.map(p=>[p.id,p.actualizado||'',p.esTu?1:0].join('|')).join(';');
  if(f===firma) return;
  firma=f;
  const fijo = pin && pin.tipo==='nodo' ? lista[pin.i] && lista[pin.i].id : null;
  lista=nueva;
  if(pin && pin.tipo==='hilo') pin=null;
  if(fijo){ const i=lista.findIndex(p=>p.id===fijo); pin = i>=0 ? {tipo:'nodo',i} : null; }
  dibujar();
}
/* Fija una persona por id (para resaltar la propia al registrarse). */
function fijar(id){ const i=lista.findIndex(p=>p.id===id); if(i<0) return; pin={tipo:'nodo',i}; foco(pin); }

return {arrancar, poner, fijar, ajustes, get lista(){ return lista; }};
})();
