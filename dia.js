/* ═══════════════════════════════════════════════════════════
   Nuestra Órbita · El día
   Equipo de Diseño y Medios · IBERO Tijuana

   Lo que sí cambia de un día a otro, y qué significa:
     · la Luna: signo, fase, por dónde pasa en la carta de cada quien
       (casa lunar) y qué aspectos forma hoy con los demás planetas;
     · Mercurio: signo, si va retrógrado y cuándo cambia;
     · Venus y Marte: signo y cuándo cambian;
     · lo que viene esta semana.
   Todo se calcula con astronomy-engine para la fecha que se le pida,
   así que «hoy» y «mañana» dan textos distintos.

   Depende de Motor (motor.js), Textos y Lecturas.
   ═══════════════════════════════════════════════════════════ */
window.Dia = (function(){
'use strict';
const M = window.Motor, A = window.Astronomy;
const S = M.SIGNOS;
const DIA_MS = 86400000;
const TZ = 'America/Tijuana';

/* ---------- lecturas del día ---------- */
/* La Luna en cada signo: el ánimo general. Dos palabras para el titular y una línea. */
const LUNA_SIGNO = {
  Aries:['impulso y prisa','Se quiere empezar ya; la paciencia es corta.'],
  Tauro:['calma y cosas concretas','Se busca lo seguro y lo que se puede tocar; no es día de cambios.'],
  Géminis:['charla y cambios','Muchas conversaciones y cambios de tema; cuesta concentrarse.'],
  Cáncer:['cuidado y refugio','Se protege lo propio; la gente está sensible.'],
  Leo:['brillo y ganas de ser visto','Se busca reconocimiento; buen día para presentar.'],
  Virgo:['detalle y orden','Se revisa, se corrige, se organiza; cuidado con la crítica.'],
  Libra:['acuerdos y buen trato','Se busca el equilibrio; buen día para negociar.'],
  Escorpio:['intensidad y fondo','Se va a lo profundo; no es día de superficialidades.'],
  Sagitario:['horizonte y franqueza','Se dice lo que se piensa; ganas de ver lejos.'],
  Capricornio:['disciplina y resultados','Se trabaja en serio; buen día para cerrar pendientes.'],
  Acuario:['ideas y distancia','Se piensa distinto y se toma distancia; buen día para lo nuevo, no para lo íntimo.'],
  Piscis:['sensibilidad y niebla','Se capta todo y se precisa poco; buen día para imaginar, no para firmar.'],
};
/* Fase lunar: nombre y lectura. */
const FASE = [
  {desde:0,   nombre:'Luna nueva',     verbo:'sembrar',  d:'arrancar cosas, sin esperar resultados todavía'},
  {desde:45,  nombre:'Luna creciente', verbo:'empujar',  d:'lo que se empieza ahora crece'},
  {desde:180, nombre:'Luna llena',     verbo:'cosechar', d:'se ve lo que ya está; ánimos a tope'},
  {desde:225, nombre:'Luna menguante', verbo:'cerrar',   d:'terminar, soltar, ordenar'},
];
const CUARTO = ['Luna nueva','cuarto creciente','Luna llena','cuarto menguante'];
/* La Luna de hoy con cada planeta de hoy: el motor clásico del horóscopo del día. */
const LUNA_ASPECTO = {
  Sun:     {A:'ánimo y voluntad van juntos: día rendidor', T:'lo que se quiere y lo que se siente no coinciden: día de tira y afloja', C:'arranque: hay empuje y poca claridad'},
  Mercury: {A:'se piensa claro y se dice fácil: buen día para hablar y escribir', T:'malentendidos fáciles: leer dos veces antes de responder', C:'la emoción se mete en lo que se dice: cuidado con los mensajes rápidos'},
  Venus:   {A:'buen trato y ganas de colaborar: día para pedir y agradecer', T:'gustos encontrados: pequeños desacuerdos de forma', C:'día amable; se busca compañía'},
  Mars:    {A:'energía con dirección: día para avanzar pendientes', T:'ánimo corto: no es día para discutir ajustes', C:'impulso y prisa: cuidado con reaccionar de más'},
  Jupiter: {A:'optimismo y amplitud: día para proponer', T:'exceso: se promete de más o todo parece fácil', C:'buen humor y ganas de abarcar'},
  Saturn:  {A:'seriedad que ayuda: día para cerrar y estructurar', T:'pesadez y freno: todo cuesta un poco más', C:'día sobrio; mejor para revisar que para empezar'},
};
/* Por dónde pasa la Luna en la carta de cada quien. */
const CASA = ['',
  'tú al frente: humor a flor de piel y ganas de iniciar',
  'lo tuyo y lo material: recursos, cobros, lo que vale la pena',
  'mensajes y traslados: conversaciones, correos, lo cercano',
  'casa y raíces: ganas de refugio, familia y descanso',
  'juego y creatividad: días para crear y divertirte',
  'rutina, pendientes y cuerpo: días de poner orden',
  'los demás: acuerdos, pareja, socios; se negocia',
  'lo profundo: lo compartido, lo que se transforma, lo que cuesta soltar',
  'horizonte: aprender, viajar, ver más lejos',
  'trabajo y visibilidad: lo que haces se nota',
  'amistades y equipo: redes, grupos, proyectos en común',
  'retiro: descanso, cierre, lo que se procesa por dentro',
];
/* El clima del equipo según el signo de cada planeta lento. */
const TRABAJO = {
  Mercury:{Aries:'directa y rápida; se dice antes de pensar', Tauro:'pausada y concreta; cuesta cambiar de opinión', Géminis:'ágil y dispersa; muchas conversaciones a la vez', Cáncer:'con tacto y memoria; se toma personal', Leo:'convincente y con estilo; cuidado con el ego', Virgo:'precisa y crítica; se revisan los detalles', Libra:'diplomática; se busca acuerdo antes que verdad', Escorpio:'directa y con fondo; cuidado con lo que se calla', Sagitario:'franca y sin filtro; se habla en grande', Capricornio:'seria y útil; se habla de planes y plazos', Acuario:'original y distante; ideas nuevas, poco tacto', Piscis:'intuitiva y vaga; conviene confirmar por escrito'},
  Mars:   {Aries:'arranques rápidos; los roces son de frente y se pasan', Tauro:'constante; los roces se enquistan', Géminis:'en palabras; discusiones ágiles', Cáncer:'defensiva; los roces hieren', Leo:'orgullosa; los roces son por reconocimiento', Virgo:'en el detalle; los roces son por criterio', Libra:'indecisa; se evita el choque hasta que estalla', Escorpio:'intensa; los roces van al fondo', Sagitario:'expansiva; roces francos y breves', Capricornio:'disciplinada; roces fríos', Acuario:'a su manera; roces por independencia', Piscis:'difusa; se evita el conflicto'},
  Venus:  {Aries:'con iniciativa; se enfría si no hay respuesta', Tauro:'leal y lenta', Géminis:'conversada y variada', Cáncer:'de cuidado; se protege al equipo', Leo:'generosa; se necesita reconocimiento', Virgo:'útil; se ayuda resolviendo', Libra:'equilibrada; se busca el acuerdo', Escorpio:'intensa; todo o nada', Sagitario:'abierta y optimista', Capricornio:'seria y con compromiso', Acuario:'de amistad; se necesita espacio', Piscis:'empática; se difuminan los límites'},
};
const RETRO = 'retrógrado: temporada de revisar, releer y reconfirmar; no es para firmar ni para lanzar, y lo que se reabre se resuelve';
/* Qué hacer con alguien según lo que el cielo le toca hoy. */
const FRASE_PAREJA = {
  Sun:    {A:'día para proponerle algo', T:'hoy no está para presiones', C:'día en que pesa su presencia'},
  Moon:   {A:'día de empatía fácil', T:'ánimos desacompasados', C:'sintonía emocional'},
  Asc:    {A:'trato fácil desde el saludo', T:'primera reacción áspera', C:'se le nota todo hoy'},
  Venus:  {A:'buen día para pedirle algo', T:'desacuerdo de gusto; no es día para elegir juntos', C:'día de buen trato'},
  Mars:   {A:'día para avanzar juntos', T:'mejor no discutir ajustes hoy', C:'empuje; cuidado con el choque'},
  Mercury:{A:'buen día para platicar y aclarar', T:'malentendidos fáciles; confirmar por escrito', C:'muchas palabras; que no se pierda el punto'},
};
/* Lo mismo, dicho a la persona que mira. */
const FRASE_TI = {
  Sun:    {A:'día para proponer', T:'no es día para que te presionen', C:'tu presencia pesa hoy'},
  Moon:   {A:'empatía fácil', T:'ánimo desacompasado con los demás', C:'sensibilidad alta'},
  Asc:    {A:'trato fácil desde el saludo', T:'tu primera reacción sale áspera', C:'se te nota todo hoy'},
  Venus:  {A:'buen día para pedir', T:'desacuerdos de gusto; no elijas con otros hoy', C:'buen trato'},
  Mars:   {A:'día para avanzar', T:'mejor no discutir ajustes hoy', C:'empuje; cuidado con el choque'},
  Mercury:{A:'buen día para platicar y aclarar', T:'malentendidos fáciles; confirma por escrito', C:'muchas palabras; que no se pierda el punto'},
};
const PUNTO_DE = {Sun:'el signo solar', Moon:'el signo lunar', Asc:'el ascendente', Venus:'la Venus', Mars:'el Marte', Mercury:'el Mercurio'};
const PLANETA = {Sun:'el Sol', Moon:'la Luna', Mercury:'Mercurio', Venus:'Venus', Mars:'Marte', Jupiter:'Júpiter', Saturn:'Saturno'};

/* ---------- herramientas ---------- */
const signo = l => S[M.signo(l)];
const fechaCorta = d => new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'long',timeZone:TZ}).format(d);
const diaSemana = d => { const s=new Intl.DateTimeFormat('es-MX',{weekday:'long',timeZone:TZ}).format(d); return s.charAt(0).toUpperCase()+s.slice(1); };
const tipoDe = a => a.a===0?'C':(a.a===60||a.a===120)?'A':'T';
/* Cuándo cambia de signo un cuerpo, buscando hacia adelante. */
function proximoCambioSigno(body, desde, pasoHoras, maxDias){
  const s0=M.signo(M.lonDe(body,desde)); const paso=pasoHoras*3600000; const fin=desde.getTime()+maxDias*DIA_MS;
  for(let t=desde.getTime()+paso; t<=fin; t+=paso){ const d=new Date(t); const s=M.signo(M.lonDe(body,d)); if(s!==s0) return {fecha:d, signo:S[s]}; }
  return null;
}
/* Velocidad en grados por día (negativa = retrógrado). */
function velocidad(body, d){ const l1=M.lonDe(body,new Date(d.getTime()-DIA_MS/2)), l2=M.lonDe(body,new Date(d.getTime()+DIA_MS/2)); let v=l2-l1; if(v>180) v-=360; if(v<-180) v+=360; return v; }
/* Cuándo un planeta cambia de sentido (estación). */
function proximaEstacion(body, desde, maxDias){
  const v0=velocidad(body,desde)<0; for(let i=1;i<=maxDias;i++){ const d=new Date(desde.getTime()+i*DIA_MS); if((velocidad(body,d)<0)!==v0) return d; } return null;
}

/* ---------- el cielo del día ---------- */
function cielo(fecha){
  const d=fecha||new Date(); const c={fecha:d, lon:{}};
  for(const b of ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn']) c.lon[b]=M.lonDe(b,d);
  // fase
  const ang=A.MoonPhase(d); let f=FASE[0]; for(const x of FASE) if(ang>=x.desde) f=x;
  const q=A.SearchMoonQuarter(d);
  c.fase={angulo:ang, nombre:f.nombre, verbo:f.verbo, d:f.d, proxima:{nombre:CUARTO[q.quarter], fecha:q.time.date}};
  // la Luna hoy
  c.luna={signo:signo(c.lon.Moon), palabras:LUNA_SIGNO[signo(c.lon.Moon)][0], d:LUNA_SIGNO[signo(c.lon.Moon)][1], cambia:proximoCambioSigno('Moon',d,1,4)};
  // aspectos de la Luna con los planetas de hoy
  c.aspectos=[];
  for(const b of ['Sun','Mercury','Venus','Mars','Jupiter','Saturn']){ const a=M.aspecto(c.lon.Moon,c.lon[b],5); if(!a) continue; const t=tipoDe(a); c.aspectos.push({planeta:b, a, tipo:t, exactitud:1-a.orb/5, txt:LUNA_ASPECTO[b][t]}); }
  c.aspectos.sort((x,y)=>y.exactitud-x.exactitud);
  // Mercurio, Venus, Marte
  c.planetas={};
  for(const b of ['Mercury','Venus','Mars']){
    const retro=velocidad(b,d)<0;
    c.planetas[b]={signo:signo(c.lon[b]), retro, cambia:proximoCambioSigno(b,d,24,400), estacion: retro||b==='Mercury' ? proximaEstacion(b,d,150) : null, lectura:TRABAJO[b][signo(c.lon[b])]};
  }
  // titular
  const asp=c.aspectos[0];
  c.titular=`${diaSemana(d)} de ${c.luna.palabras}`;
  c.subtitular=`Luna en ${c.luna.signo}, ${c.fase.nombre.replace('Luna ','').toLowerCase()}${asp?`, en ${asp.a.n} con ${PLANETA[asp.planeta]}`:''}.`;
  c.porque=[
    `Luna en ${c.luna.signo}: ${c.luna.d}`,
    `${c.fase.nombre} (${c.fase.verbo}): ${c.fase.d}. Siguiente: ${c.fase.proxima.nombre} el ${fechaCorta(c.fase.proxima.fecha)}.`,
  ].concat(asp?[`Luna en ${asp.a.n} con ${PLANETA[asp.planeta]}: ${asp.txt}.`]:['Hoy la Luna no forma aspectos exactos con los planetas: día sin picos.']);
  // esta semana
  c.semana=[];
  let desde=d; for(let i=0;i<3;i++){ const ch=proximoCambioSigno('Moon',desde,1,4); if(!ch||ch.fecha.getTime()>d.getTime()+7*DIA_MS) break; c.semana.push({fecha:ch.fecha, txt:`Luna entra en ${ch.signo}: ${LUNA_SIGNO[ch.signo][0]}`}); desde=new Date(ch.fecha.getTime()+3600000); }
  if(c.fase.proxima.fecha.getTime()<=d.getTime()+8*DIA_MS) c.semana.push({fecha:c.fase.proxima.fecha, txt:c.fase.proxima.nombre});
  for(const b of ['Mercury','Venus','Mars']){ const p=c.planetas[b]; if(p.cambia&&p.cambia.fecha.getTime()<=d.getTime()+14*DIA_MS) c.semana.push({fecha:p.cambia.fecha, txt:`${PLANETA[b]} entra en ${p.cambia.signo}`}); if(p.estacion&&p.estacion.getTime()<=d.getTime()+14*DIA_MS) c.semana.push({fecha:p.estacion, txt:`${PLANETA[b]} ${p.retro?'vuelve a directo':'se pone retrógrado'}`}); }
  c.semana.sort((x,y)=>x.fecha-y.fecha);
  return c;
}

/* ---------- lo personal ---------- */
/* Casa por signo entero: desde el ascendente si lo hay, si no desde el Sol. */
function casaLunar(carta, c){
  const base = carta.Asc!=null ? carta.Asc : carta.Sun;
  const n = ((M.signo(c.lon.Moon) - M.signo(base) + 12) % 12) + 1;
  return {n, d:CASA[n], desdeSol: carta.Asc==null};
}
/* Tránsitos exactos de hoy a una carta: Luna, Mercurio, Venus, Marte, Sol. */
function transitosA(carta, c, tu){
  const out=[];
  [['Moon',5],['Mercury',3],['Venus',3],['Mars',3],['Sun',3]].forEach(([t,o])=>{
    for(const k of ['Sun','Moon','Asc','Venus','Mars','Mercury']){ if(carta[k]==null) continue; const a=M.aspecto(c.lon[t],carta[k],o); if(!a) continue;
      const tipo=tipoDe(a); out.push({planeta:t, punto:k, a, tipo, v:(1-a.orb/o)*(t==='Moon'?1:.8), frase:(tu?FRASE_TI:FRASE_PAREJA)[k][tipo]});
    }
  });
  out.sort((x,y)=>y.v-x.v);
  return out;
}
/* «Para ti»: casa lunar + tránsitos exactos (si hay). */
function paraTi(carta, c){
  const casa=casaLunar(carta,c); const tr=transitosA(carta,c,true).slice(0,2);
  return {casa, transitos:tr};
}
/* «Con los demás»: las parejas más movidas hoy, con nombre y qué hacer. */
function conLosDemas(yo, otros, c, tono){
  return otros.map(p=>{
    const suyos=transitosA(p.carta,c); const mios=transitosA(yo.carta,c);
    const top=suyos[0]; const v=Math.max(suyos[0]?suyos[0].v:0, mios[0]?mios[0].v*.6:0);
    let frase;
    if(top) frase=`${PLANETA[top.planeta].charAt(0).toUpperCase()+PLANETA[top.planeta].slice(1)} ${top.a.a===0?'sobre':'en '+top.a.n+' con'} ${PUNTO_DE[top.punto]} de ${p.n}: ${top.frase}.`;
    else { const casa=casaLunar(p.carta,c); frase=`La Luna pasa por su casa ${casa.n} (${casa.d.split(':')[0]}); sin tránsitos exactos.`; }
    return {p, v, tipo: top?top.tipo:'N', frase, etiqueta: tono(p)};
  }).sort((x,y)=>y.v-x.v).slice(0,3);
}

return {cielo, casaLunar, transitosA, paraTi, conLosDemas, fechaCorta, diaSemana, PLANETA, RETRO, CASA, FASE};
})();
