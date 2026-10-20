/* ═══════════════════════════════════════════════════════════
   Nuestra Órbita · Los textos
   Equipo de Diseño y Medios · IBERO Tijuana

   Todo lo que la página le dice a alguien que no sabe nada de
   horóscopos vive aquí: nombres llanos de cada punto de la carta,
   cómo se llama cada vínculo, el glosario, el recorrido y las doce
   palabras con que la gente se describe (y cómo se comparan con la
   carta). Si algo suena a jerga, se cambia aquí y nada más.
   ═══════════════════════════════════════════════════════════ */
window.Textos = (function(){
'use strict';
const M = window.Motor;

/* ---------- cada punto de la carta, en llano ---------- */
const PUNTO = {
  Sun:     {corto:'tu signo solar',  largo:'signo solar (el Sol): la esencia'},
  Moon:    {corto:'tu signo lunar',  largo:'signo lunar (la Luna): la emoción'},
  Asc:     {corto:'tu ascendente',   largo:'ascendente: la primera impresión'},
  Mercury: {corto:'tu Mercurio',     largo:'Mercurio: la mente'},
  Venus:   {corto:'tu Venus',        largo:'Venus: el afecto'},
  Mars:    {corto:'tu Marte',        largo:'Marte: la acción'},
};
/* «el signo solar de Aurora», «el Marte de Mateo» */
const de = (k, nombre) => PUNTO[k].corto.replace('tu ','el ') + ' de ' + nombre;

const ELEMENTO = {fuego:'fuego', tierra:'tierra', aire:'aire', agua:'agua'};
const ELEMENTO_FRASE = {fuego:'fuego (impulso)', tierra:'tierra (lo práctico)', aire:'aire (ideas)', agua:'agua (emoción)'};

/* ---------- vínculos ---------- */
const ASPECTO_LLANO = {0:'conjunción', 60:'armonía (sextil)', 120:'armonía (trígono)', 90:'tensión (cuadratura)', 180:'tensión (oposición)'};
const TONO_LLANO = {
  'Afinidad luminosa':    {t:'Buena afinidad (alta)', d:'Casi todos los aspectos entre sus cartas son armónicos.'},
  'Fluye':                {t:'Buena afinidad', d:'Predominan los aspectos armónicos.'},
  'Neutra, independiente':{t:'Neutral',       d:'Sin aspectos marcados en ningún sentido.'},
  'Tensión creativa':     {t:'Tensión',       d:'Predominan los aspectos de tensión: fricción y también impulso.'},
  'Chispa fuerte':        {t:'Tensión (alta)', d:'Casi todos los aspectos entre sus cartas son de tensión.'},
};
const INTENSIDAD_LLANA = {
  'mínima':'intensidad mínima', 'moderada':'intensidad moderada', 'significativa':'intensidad significativa',
  'alta':'intensidad alta', 'excepcional':'intensidad excepcional',
};
function tonoLlano(h){ const t=M.tono(h); return Object.assign({c:t.c}, TONO_LLANO[t.t]); }
function intensidadLlana(pts){ return INTENSIDAD_LLANA[M.banda(pts)]; }
/* «Tu signo lunar y el signo solar de Mateo: armonía (trígono) ☽ △ ☉» */
function porque(x, a, b, tu){
  const izq = tu ? PUNTO[x.k1].corto.replace(/^tu /,'Tu ') : de(x.k1,a).replace(/^./,c=>c.toUpperCase());
  const der = de(x.k2,b);
  return `${izq} y ${der}: ${ASPECTO_LLANO[x.a.a]} <span class="glifo">${M.PGL[x.k1]} ${x.a.s} ${M.PGL[x.k2]}</span>`;
}

/* ---------- pronombres ---------- */
const PRON = {
  ella:{p:'ella', nacid:'nacida', list:'lista', el:'la'},
  el:  {p:'él',   nacid:'nacido', list:'listo', el:'el'},
  elle:{p:'elle', nacid:'nacide', list:'liste', el:'le'},
};
const pron = p => PRON[p]||PRON.elle;

/* ---------- las doce palabras ---------- */
/* Cada una con su forma según pronombre y los elementos con los que
   la carta la «confirma». Es un juego: coincidir no es acertar. */
const PALABRAS = [
  {k:'tranquilo',     f:{ella:'tranquila',     el:'tranquilo',     elle:'tranquile'},     e:['tierra','agua']},
  {k:'directo',       f:{ella:'directa',       el:'directo',       elle:'directe'},       e:['fuego']},
  {k:'sonador',       f:{ella:'soñadora',      el:'soñador',       elle:'soñadore'},      e:['agua']},
  {k:'ordenado',      f:{ella:'ordenada',      el:'ordenado',      elle:'ordenade'},      e:['tierra']},
  {k:'curioso',       f:{ella:'curiosa',       el:'curioso',       elle:'curiose'},       e:['aire']},
  {k:'intenso',       f:{ella:'intensa',       el:'intenso',       elle:'intense'},       e:['agua','fuego']},
  {k:'sociable',      f:{ella:'sociable',      el:'sociable',      elle:'sociable'},      e:['aire']},
  {k:'practico',      f:{ella:'práctica',      el:'práctico',      elle:'práctique'},     e:['tierra']},
  {k:'apasionado',    f:{ella:'apasionada',    el:'apasionado',    elle:'apasionade'},    e:['fuego']},
  {k:'independiente', f:{ella:'independiente', el:'independiente', elle:'independiente'}, e:['aire','fuego']},
  {k:'sensible',      f:{ella:'sensible',      el:'sensible',      elle:'sensible'},      e:['agua']},
  {k:'constante',     f:{ella:'constante',     el:'constante',     elle:'constante'},     e:['tierra']},
];
const palabra = (k, pr) => { const w=PALABRAS.find(x=>x.k===k); return w ? w.f[pr]||w.f.elle : k; };

/* Qué elementos pesan más en una carta. */
function elementosDe(c){
  const peso={fuego:0,tierra:0,aire:0,agua:0};
  const w={Sun:2,Moon:2,Asc:1.5,Venus:1,Mars:1,Mercury:.5};
  for(const k in w){ if(c[k]==null) continue; peso[M.elemDe(c[k])]+=w[k]; }
  return Object.entries(peso).sort((a,b)=>b[1]-a[1]);
}
/* Compara lo que alguien dijo de sí con lo que dice su carta. */
function comparar(palabras, c, pr){
  const orden=elementosDe(c); const top=orden.slice(0,2).map(x=>x[0]); const fuerte=orden[0][0];
  const filas=(palabras||[]).map(k=>{
    const w=PALABRAS.find(x=>x.k===k); if(!w) return null;
    const coincide=w.e.some(e=>top.includes(e));
    return {k, texto:palabra(k,pr), coincide, elem:w.e[0]};
  }).filter(Boolean);
  const n=filas.filter(f=>f.coincide).length;
  const sugeridas=PALABRAS.filter(w=>w.e.includes(fuerte) && !(palabras||[]).includes(w.k)).slice(0,2).map(w=>palabra(w.k,pr));
  let frase;
  if(!filas.length) frase='';
  else frase=`Elemento dominante en tu carta: ${ELEMENTO_FRASE[fuerte]}. Coinciden ${n} de ${filas.length}.${sugeridas.length?` La carta también sugiere: ${sugeridas.join(', ')}.`:''}`;
  return {filas, n, frase, fuerte};
}

/* ---------- el cielo de hoy, en llano ---------- */
function climaLlano(tr, lista){
  const luna = `Luna en ${M.SIGNOS[M.signo(tr.Moon)]}, elemento ${ELEMENTO[M.elemDe(tr.Moon)]}.`;
  const tocados=lista.filter(p=>p.lunaToca);
  const quien = !lista.length ? '' : tocados.length
    ? `Hoy la Luna forma aspecto con ${tocados.map(p=>`<b>${p.n}</b>`).join(', ')}.`
    : 'Hoy la Luna no forma aspecto con nadie del mapa.';
  return {luna, quien};
}
/* La frase del día para una pareja: el texto del motor, con los
   puntos nombrados igual que en el resto de la página. */
function fraseDia(cl){
  if(!cl.length) return 'Hoy no hay aspectos del cielo con sus cartas.';
  return cl.map(x=>{
    const t = x.txt.replace(/ sobre el Sol de /,' en conjunción con el signo solar de ').replace(/ sobre la Luna de /,' en conjunción con el signo lunar de ').replace(/ sobre el Ascendente de /,' en conjunción con el ascendente de ')
      .replace(/ al Sol de /,' al signo solar de ').replace(/ a la Luna de /,' al signo lunar de ').replace(/ al Ascendente de /,' al ascendente de ');
    const L=window.Lecturas; return `${t}: <b>${x.pos?'armonía':'tensión'}</b>${L?', '+L.leerDia(x):''}.`;
  }).join(' ');
}

/* ---------- la estrella de cada quien, explicada ----------
   «Acuario, signo de aire (ideas): por eso tu estrella brilla en azul
   claro. Signo lunar Virgo (tierra). Ascendente Leo (fuego).» */
const COLOR_ELEMENTO = {fuego:'naranja', tierra:'verde', aire:'azul claro', agua:'violeta'};
function descripcionEstrella(c, tu){
  const sol=M.SIGNOS[M.signo(c.Sun)], e=M.elemDe(c.Sun);
  const quien = tu ? 'tu estrella' : 'su estrella';
  let t = `${sol}, signo de ${ELEMENTO_FRASE[e]}: por eso ${quien} brilla en ${COLOR_ELEMENTO[e]}.`;
  t += ` Signo lunar ${M.SIGNOS[M.signo(c.Moon)]} (${M.elemDe(c.Moon)})${c.exacta?'':', aproximado'}.`;
  if(c.Asc!=null) t += ` Ascendente ${M.SIGNOS[M.signo(c.Asc)]} (${M.elemDe(c.Asc)}).`;
  const orden=elementosDe(c); const dom=orden[0][0];
  if(dom!==e) t += ` En el conjunto de la carta pesa más el elemento ${dom}.`;
  return t;
}

/* ---------- el cielo de hoy sobre una persona ----------
   «Luna en Capricornio en sextil (armonía) a tu signo lunar: ánimo ligero.»
   quien = 'ti' para la persona que mira; si no, su nombre. */
const ASPECTO_CORTO = {60:'en sextil (armonía) a', 120:'en trígono (armonía) a', 90:'en cuadratura (tensión) a', 180:'en oposición (tensión) a', 0:'sobre'};
const PUNTO_CORTO = {Sun:'signo solar', Moon:'signo lunar', Asc:'ascendente'};
function diaPersona(C, quien, tr){
  const L=window.Lecturas; const out=[];
  [['Moon',6],['Venus',4],['Mars',4],['Sun',4]].forEach(([t,o])=>{
    for(const k of ['Sun','Moon','Asc']){ if(C[k]==null) continue; const a=M.aspecto(tr[t],C[k],o); if(!a) continue;
      const tipo = a.a===0?'C':M.VAL[a.a]>0?'A':'T';
      const punto = quien==='ti' ? PUNTO[k].corto : de(k,quien);
      const consecuencia = L?L.consecuenciaDia(t,tipo):'';
      out.push({v:Math.abs(M.VAL[a.a])*(1-a.orb/o), tipo, planeta:t, signo:M.SIGNOS[M.signo(tr[t])], simbolo:a.s, aspecto:a.n,
        puntoCorto:(quien==='ti'?'tu ':'su ')+PUNTO_CORTO[k], consecuencia,
        txt:`${M.PLAN[t]} en ${M.SIGNOS[M.signo(tr[t])]} ${ASPECTO_CORTO[a.a]} ${punto}`.replace(' a el ',' al ')+`: ${consecuencia}`});
    }
  });
  out.sort((a,b)=>b.v-a.v);
  return out.slice(0,2);
}
/* Qué significa el cielo de hoy entre dos personas, a partir de lo de cada una. */
function resumenDia(l1, l2, n1, n2){
  const peso=l=>l.reduce((s,x)=>s+(x.tipo==='T'?-x.v:x.tipo==='A'?x.v:0),0);
  const w1=peso(l1), w2=peso(l2);
  if(!l1.length&&!l2.length) return {clase:'nada', txt:'nada marcado; día parejo.'};
  if(w1>=0&&w2>=0) return {clase:'arm', txt:'día fácil para las dos partes.'};
  if(w1<0&&w2<0) return {clase:'ten', txt:'día de roces para las dos partes; conviene no forzar.'};
  const quien = w1<w2 ? n1 : n2;
  return {clase:'mix', txt: quien==='ti' ? 'día desigual: hoy el cielo te pesa más a ti.' : `día desigual: hoy el cielo le pesa más a ${quien}.`};
}
/* «Tu signo lunar y el Venus de Sol», sin el aspecto. */
function quienes(x, a, b, tu){
  const izq = tu ? PUNTO[x.k1].corto.replace(/^tu /,'Tu ') : de(x.k1,a).replace(/^./,c=>c.toUpperCase());
  return `${izq} y ${de(x.k2,b)}`;
}

/* ---------- glosario ---------- */
const GLOSARIO = [
  {t:'Signo solar', d:'El signo de siempre: dónde estaba el Sol el día que naciste. Representa la esencia. En el mapa marca la posición de la estrella en el anillo.'},
  {t:'Signo lunar', d:'Dónde estaba la Luna cuando naciste. Cambia de signo cada dos días y medio; por eso ayuda saber la hora. Representa la emoción. En el mapa es la altura de la estrella.'},
  {t:'Ascendente', d:'El signo que salía por el horizonte a la hora exacta y en el lugar en que naciste. Representa la primera impresión. Sin hora exacta no se calcula.'},
  {t:'Aspectos', d:'Ángulos entre los puntos de dos cartas. Armonía: trígono (120°) y sextil (60°). Tensión: cuadratura (90°) y oposición (180°). Conjunción (0°): misma posición.'},
  {t:'Hilos', d:'Cada hilo une a dos personas. Grosor: intensidad del vínculo (cuántos aspectos y qué tan exactos). Color: tipo de vínculo. Dorado afinidad, azul neutral, violeta tensión. Ninguno es malo; la tensión también da impulso.'},
  {t:'Elementos', d:'Cada signo pertenece a uno: fuego (impulso), tierra (lo práctico), aire (ideas) o agua (emoción). Es el color del brillo de cada estrella.'},
  {t:'Cielo de hoy', d:'Posición actual del Sol, la Luna, Venus y Marte, marcada en el anillo. La Luna recorre el anillo en un mes y forma aspectos con las estrellas que pasa cerca: esa estrella late. Por eso el mapa cambia cada día.'},
  {t:'Fase lunar', d:'Cuánta Luna se ve. Nueva: sembrar, arrancar. Creciente: empujar, lo que se empieza crece. Llena: cosechar, se ve lo que ya está. Menguante: cerrar, soltar, ordenar. El ciclo dura 29 días y medio.'},
  {t:'Casa lunar', d:'Por qué zona de tu carta pasa la Luna hoy. La carta se divide en doce casas (temas de la vida: tú, lo material, mensajes, casa, creatividad, rutina, los demás, lo profundo, horizonte, trabajo, equipo, retiro). La Luna cambia de casa cada dos días y medio: siempre hay algo distinto que decir.'},
  {t:'Mercurio retrógrado', d:'Unas tres semanas, tres veces al año, Mercurio parece ir hacia atrás visto desde la Tierra. En llano: temporada de revisar, releer y reconfirmar; no es para firmar ni lanzar, y lo que se reabre se resuelve.'},
  {t:'Tránsito', d:'Un planeta de hoy pasando por un punto de tu carta. Los rápidos (Luna, Mercurio, Venus, Marte) son los que hacen que cada día sea distinto.'},
];

/* ---------- recorrido ---------- */
const RECORRIDO = [
  {t:'Tu estrella', d:'Eres una estrella en el mapa. Posición en el anillo: signo solar. Altura: signo lunar. Color del brillo: elemento. Crece en tres etapas: con la fecha, con la hora y con la ciudad.'},
  {t:'Los hilos', d:'Cada hilo te une con alguien del equipo. Grosor: intensidad del vínculo. Color: dorado afinidad, azul neutral, violeta tensión. Tócalo para descubrirlo y ver sus aspectos.'},
  {t:'El cielo de hoy', d:'El Sol, la Luna, Venus y Marte de hoy recorren el anillo. Cuando la Luna forma aspecto con una estrella, esa persona late. El mapa cambia cada día solo.'},
  {t:'Glosario', d:'Siete términos explican todo el mapa: signo solar, signo lunar, ascendente, aspectos, hilos, elementos y cielo de hoy. Está arriba, en Glosario. Es un juego del equipo, no una evaluación.'},
];

return {PUNTO, de, ELEMENTO, ELEMENTO_FRASE, ASPECTO_LLANO, tonoLlano, intensidadLlana, porque, pron, PALABRAS, palabra, elementosDe, comparar, climaLlano, fraseDia, diaPersona, resumenDia, quienes, descripcionEstrella, GLOSARIO, RECORRIDO};
})();
