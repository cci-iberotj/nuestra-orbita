/* ═══════════════════════════════════════════════════════════
   Nuestra Órbita · Motor de cálculo
   Equipo de Diseño y Medios · IBERO Tijuana

   Es el mismo motor del estudio de concepto (concepto.html),
   sacado a su propio archivo para que el mapa y el formulario lo
   compartan. Nada de aquí toca la red ni la base: recibe personas
   y devuelve cartas, intensidades, tonos y tránsitos.

   Depende de astronomy-engine (window.Astronomy).
   ═══════════════════════════════════════════════════════════ */
window.Motor = (function(){
'use strict';
const A = window.Astronomy;
const RAD = Math.PI/180;
const norm = d => ((d%360)+360)%360;
const SIGNOS = ['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'];
const GLIFOS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const ELEM = ['fuego','tierra','aire','agua'];
const MODAL = ['cardinal','fija','mutable'];
const PLAN = {Sun:'Sol',Moon:'Luna',Mercury:'Mercurio',Venus:'Venus',Mars:'Marte',Asc:'Ascendente'};
const PGL = {Sun:'☉',Moon:'☽',Mercury:'☿',Venus:'♀',Mars:'♂',Asc:'Asc'};
const ASPECTOS = [{n:'conjunción',a:0,s:'☌'},{n:'sextil',a:60,s:'⚹'},{n:'cuadratura',a:90,s:'□'},{n:'trígono',a:120,s:'△'},{n:'oposición',a:180,s:'☍'}];
const VAL = {0:0.3,60:0.6,120:1,90:-1,180:-0.7};

/* Tijuana: lo que se asume cuando alguien da hora pero no ciudad. */
const TIJUANA = {lat:32.5149, lon:-117.0382, tz:'America/Tijuana'};

/* Las ocho personas inventadas del estudio de concepto. Sólo se
   enseñan cuando la tabla está vacía, marcadas como demostración. */
const DEMO = [
 {n:'Aurora',    y:1991,m:3, d:22,h:7, mi:40, c:'Tijuana',          lat:32.5149,lon:-117.0382,tz:'America/Tijuana'},
 {n:'Mateo',     y:1988,m:11,d:5, h:null,     c:'Ciudad de México', lat:19.4326,lon:-99.1332, tz:'America/Mexico_City'},
 {n:'Valentina', y:1995,m:7, d:14,h:15,mi:10, c:'Guadalajara',      lat:20.6597,lon:-103.3496,tz:'America/Mexico_City'},
 {n:'Diego',     y:1990,m:1, d:28,h:23,mi:5,  c:'Monterrey',        lat:25.6866,lon:-100.3161,tz:'America/Monterrey'},
 {n:'Camila',    y:1997,m:9, d:2, h:4, mi:30, c:'Mexicali',         lat:32.6245,lon:-115.4523,tz:'America/Tijuana'},
 {n:'Rodrigo',   y:1986,m:5, d:17,h:null,     c:'Hermosillo',       lat:29.0729,lon:-110.9559,tz:'America/Hermosillo'},
 {n:'Lucía',     y:1993,m:12,d:9, h:12,mi:0,  c:'Ensenada',         lat:31.8667,lon:-116.5964,tz:'America/Tijuana'},
 {n:'Emilio',    y:1999,m:6, d:21,h:18,mi:45, c:'Puebla',           lat:19.0414,lon:-98.2063, tz:'America/Mexico_City'},
].map((p,i)=>Object.assign({id:'demo-'+i, demo:true}, p));

/* ---------- tiempo ---------- */
function tzOffsetMin(date, tz){
  const f = new Intl.DateTimeFormat('en-US',{timeZone:tz,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'});
  const p = Object.fromEntries(f.formatToParts(date).map(x=>[x.type,x.value]));
  const asUTC = Date.UTC(+p.year,+p.month-1,+p.day,+p.hour%24,+p.minute,+p.second);
  return (asUTC - date.getTime())/60000;
}
function zonedToUTC(y,mo,d,h,mi,tz){
  const wall = Date.UTC(y,mo-1,d,h,mi);
  let guess = wall;
  for(let i=0;i<3;i++){ guess = wall - tzOffsetMin(new Date(guess),tz)*60000; }
  return new Date(guess);
}

/* ---------- astronomía ---------- */
function lonDe(body, date){
  if(body==='Sun') return norm(A.SunPosition(date).elon);
  if(body==='Moon') return norm(A.EclipticGeoMoon(date).lon);
  const v = A.GeoVector(A.Body[body], date, true);
  return norm(A.Ecliptic(v).elon);
}
function ascendente(date, lat, lon){
  const gst = A.SiderealTime(date)*15;
  const th = norm(gst+lon)*RAD, eps = 23.4393*RAD, ph = lat*RAD;
  return norm(Math.atan2(Math.cos(th), -(Math.sin(th)*Math.cos(eps)+Math.tan(ph)*Math.sin(eps)))/RAD);
}
/* Hora «más o menos»: el centro de cada franja. Afina la Luna (que
   avanza medio grado por hora) sin fingir un Ascendente, que cambia
   de signo cada dos horas y con una franja de seis no se sostiene. */
const FRANJAS = {madrugada:3, manana:9, tarde:15, noche:21};
function carta(p){
  const exacta = p.h!=null;
  const aprox = !exacta && !!p.franja;
  const tz = p.tz||TIJUANA.tz, lat = p.lat!=null?p.lat:TIJUANA.lat, lon = p.lon!=null?p.lon:TIJUANA.lon;
  const hora = exacta ? p.h : aprox ? FRANJAS[p.franja] : 12;
  const fecha = zonedToUTC(p.y,p.m,p.d, hora, exacta?(p.mi||0):0, tz);
  const c = {exacta, aprox, fecha};
  for(const b of ['Sun','Moon','Mercury','Venus','Mars']) c[b]=lonDe(b,fecha);
  c.Asc = exacta ? ascendente(fecha, lat, lon) : null;
  return c;
}
/* Qué tan completa está una estrella: 1 sólo fecha · 2 con hora
   (exacta o más o menos) · 3 hora exacta y ciudad. */
function etapa(p){
  if(p.h!=null && p.lat!=null) return 3;
  if(p.h!=null || p.franja) return 2;
  return 1;
}
function faltante(p){
  const e=etapa(p);
  if(e===3) return '';
  if(e===2) return p.h!=null ? 'Agrega tu ciudad para completar tu primera impresión.' : 'Con tu hora exacta aparece tu primera impresión.';
  return 'Agrega tu hora, aunque sea más o menos, y tu estrella crece.';
}
const signo = l => Math.floor(norm(l)/30);
const grado = l => Math.floor(norm(l)%30);
const fmt = l => `${GLIFOS[signo(l)]} ${SIGNOS[signo(l)]} ${grado(l)}°`;
const elemDe = l => ELEM[signo(l)%4];
const colorElem = l => `var(--${elemDe(l)})`;

/* ---------- aspectos ---------- */
const sep = (a,b)=>{ const d=Math.abs(norm(a)-norm(b)); return d>180?360-d:d; };
function aspecto(l1,l2,orb){ const d=sep(l1,l2); for(const asp of ASPECTOS){ const o=Math.abs(d-asp.a); if(o<=orb) return Object.assign({orb:o},asp); } return null; }
const esLum = k => k==='Sun'||k==='Moon';
const orbe = (k1,k2)=> (esLum(k1)||esLum(k2))?8:6;

function intensidad(P,Q){
  let pts=0; const det=[];
  const ss = aspecto(P.Sun,Q.Sun,8); let paso1=false;
  if(ss && (ss.a===90||ss.a===180)){ const b=ss.orb<=2?3:0; pts+=8+b; paso1=true; det.push(`Sol ${ss.s} Sol · ${8+b}`); }
  const slConj = new Set();
  [['Sun','Moon'],['Moon','Sun']].forEach(([k1,k2])=>{ const c=aspecto(P[k1],Q[k2],8); if(c&&c.a===0){ const b=c.orb<=2?3:0; pts+=8+b; slConj.add(k1+k2); det.push(`${PLAN[k1]} ☌ ${PLAN[k2]} · ${8+b}`);} });
  const claves=['Sun','Moon','Asc'];
  for(const k1 of claves){ if(P[k1]==null) continue; for(const k2 of claves){ if(Q[k2]==null) continue;
    const a=aspecto(P[k1],Q[k2],orbe(k1,k2)); if(!a) continue;
    if(k1==='Sun'&&k2==='Sun'&&paso1) continue;
    if(a.a===0 && slConj.has(k1+k2)) continue;
    pts+=4; det.push(`${PLAN[k1]} ${a.s} ${PLAN[k2]} · 4`);
  }}
  if(!paso1 && signo(P.Sun)%3===signo(Q.Sun)%3){ pts+=5; det.push(`Soles ${MODAL[signo(P.Sun)%3]}s · 5`); }
  [['Venus','Mars'],['Mars','Venus']].forEach(([k1,k2])=>{ const a=aspecto(P[k1],Q[k2],6); if(a){ pts+=4; det.push(`${PLAN[k1]} ${a.s} ${PLAN[k2]} · 4`);} });
  return {pts, det};
}
const banda = p => p<5?'mínima':p<10?'moderada':p<15?'significativa':p<20?'alta':'excepcional';
function compatElem(l1,l2){ const e1=signo(l1)%4,e2=signo(l2)%4; if(e1===e2) return .6; if((e1+e2)%2===0) return .3; return -.4; }
function armonia(P,Q){
  const keys=['Sun','Moon','Mercury','Venus','Mars','Asc']; let s=0; const lista=[];
  for(const k1 of keys){ if(P[k1]==null) continue; for(const k2 of keys){ if(Q[k2]==null) continue;
    const o=orbe(k1,k2); const a=aspecto(P[k1],Q[k2],o); if(!a) continue;
    const w=1-a.orb/o; const v=VAL[a.a]*w; s+=v; lista.push({k1,k2,a,w,v});
  }}
  s += compatElem(P.Sun,Q.Sun) + compatElem(P.Moon,Q.Moon);
  lista.sort((x,y)=>Math.abs(y.v)-Math.abs(x.v));
  return {h:Math.tanh(s/4), lista};
}
function tono(h){
  if(h>=.55) return {t:'Afinidad luminosa',c:'var(--oro)'};
  if(h>=.2) return {t:'Fluye',c:'var(--oro)'};
  if(h>-.2) return {t:'Neutra, independiente',c:'var(--azul)'};
  if(h>-.55) return {t:'Tensión creativa',c:'var(--violeta)'};
  return {t:'Chispa fuerte',c:'var(--violeta)'};
}

/* ---------- tránsitos ---------- */
function cielo(date){ const c={}; for(const b of ['Sun','Moon','Venus','Mars']) c[b]=lonDe(b,date); return c; }
function climaPareja(P,Q,nombres,tr){
  const out=[];
  [['Moon',6],['Venus',4],['Mars',4],['Sun',4]].forEach(([t,o])=>{
    [[P,nombres[0]],[Q,nombres[1]]].forEach(([C,nom])=>{
      for(const k of ['Sun','Moon','Asc']){ if(C[k]==null) continue; const a=aspecto(tr[t],C[k],o); if(!a) continue;
        const pos = VAL[a.a]>0; out.push({v:Math.abs(VAL[a.a])*(1-a.orb/o), txt:`${PLAN[t]} en ${SIGNOS[signo(tr[t])]} ${a.n==='conjunción'?'sobre '+(k==='Moon'?'la Luna':k==='Sun'?'el Sol':'el Ascendente'):'en '+a.n+' '+(k==='Moon'?'a la Luna':k==='Sun'?'al Sol':'al Ascendente')} de ${nom}`, pos});
      }
    });
  });
  out.sort((a,b)=>b.v-a.v);
  return out.slice(0,2);
}
const fraseClima = c => c.pos ? 'día ligero entre ustedes' : 'día de roces que dan chispa';

/* ---------- de la base al motor ----------
   Un renglón de la tabla personas (fecha 'AAAA-MM-DD', hora
   'HH:MM:SS' o null, lat/lon/zona o null) se vuelve la persona
   que entienden carta() y el mapa. */
function persona(fila){
  const [y,m,d] = String(fila.fecha).slice(0,10).split('-').map(Number);
  let h=null, mi=0;
  if(fila.hora_tipo==='exacta' && fila.hora){ const t=String(fila.hora).split(':').map(Number); h=t[0]; mi=t[1]||0; }
  const p = {id:fila.id, n:fila.nombre, y,m,d,h,mi, franja: fila.hora_tipo==='aprox' ? fila.hora_franja : null,
             c:fila.ciudad||'', lat:fila.lat, lon:fila.lon, tz:fila.zona||null, pron:fila.pronombre||'elle',
             lugarSupuesto: fila.lat==null, actualizado:fila.actualizado};
  p.carta = carta(p);
  p.etapa = etapa(p);
  return p;
}

return {A, RAD, norm, SIGNOS, GLIFOS, ELEM, MODAL, PLAN, PGL, ASPECTOS, VAL, TIJUANA, DEMO, FRANJAS,
        tzOffsetMin, zonedToUTC, lonDe, ascendente, carta, etapa, faltante, signo, grado, fmt, elemDe, colorElem,
        sep, aspecto, esLum, orbe, intensidad, banda, compatElem, armonia, tono, cielo, climaPareja, fraseClima, persona};
})();
