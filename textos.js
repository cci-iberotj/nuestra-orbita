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
  Sun:     {corto:'tu signo',             largo:'tu signo (el Sol): lo que eres en esencia'},
  Moon:    {corto:'tu lado emocional',    largo:'tu lado emocional (la Luna): cómo sientes por dentro'},
  Asc:     {corto:'tu primera impresión', largo:'tu primera impresión (el Ascendente): cómo te ven al conocerte'},
  Mercury: {corto:'tu forma de pensar',   largo:'tu forma de pensar (Mercurio): cómo razonas y hablas'},
  Venus:   {corto:'tu forma de querer',   largo:'tu forma de querer (Venus): qué te gusta y cómo te acercas'},
  Mars:    {corto:'tu forma de actuar',   largo:'tu forma de actuar (Marte): cómo te mueves y cómo peleas'},
};
/* «el signo de Aurora», «el lado emocional de Mateo» */
const de = (k, nombre) => PUNTO[k].corto.replace('tu ', k==='Sun'?'el ':k==='Moon'?'el ':k==='Asc'?'la ':k==='Mercury'?'la ':k==='Venus'?'la ':'la ') + ' de ' + nombre;

const ELEMENTO = {fuego:'impulso', tierra:'lo práctico', aire:'las ideas', agua:'la emoción'};
const ELEMENTO_FRASE = {fuego:'de impulso y entusiasmo', tierra:'de los pies en la tierra', aire:'de ideas y conversación', agua:'de emoción y sensibilidad'};

/* ---------- vínculos ---------- */
const ASPECTO_LLANO = {0:'en la misma frecuencia', 60:'en sintonía', 120:'en sintonía plena', 90:'se retan', 180:'de frente, como espejo'};
const TONO_LLANO = {
  'Afinidad luminosa':   {t:'Fluyen de maravilla', d:'Casi todo entre ustedes va fácil.'},
  'Fluye':               {t:'Fluyen',              d:'Se entienden sin esforzarse.'},
  'Neutra, independiente':{t:'Cada quien en lo suyo', d:'Ni chocan ni se buscan; se respetan.'},
  'Tensión creativa':    {t:'Se retan',            d:'Chocan un poco, y de ahí salen ideas.'},
  'Chispa fuerte':       {t:'Chispa fuerte',       d:'Mucha energía entre ustedes; da para mucho si se encauza.'},
};
const INTENSIDAD_LLANA = {
  'mínima':'casi no se mueven', 'moderada':'se mueven un poco', 'significativa':'se mueven bastante',
  'alta':'se mueven mucho', 'excepcional':'se mueven como con nadie',
};
function tonoLlano(h){ const t=M.tono(h); return Object.assign({c:t.c}, TONO_LLANO[t.t]); }
function intensidadLlana(pts){ return INTENSIDAD_LLANA[M.banda(pts)]; }
/* «Tu lado emocional y el signo de Mateo están en sintonía (☽ △ ☉)» */
function porque(x, a, b, tu){
  const izq = tu ? PUNTO[x.k1].corto.replace(/^tu /,'Tu ') : de(x.k1,a).replace(/^./,c=>c.toUpperCase());
  const der = de(x.k2,b);
  const verbo = x.a.a===90 ? 'se retan' : x.a.a===180 ? 'están de frente, como espejo' : x.a.a===0 ? 'están en la misma frecuencia' : x.a.a===120 ? 'están en sintonía plena' : 'están en sintonía';
  return `${izq} y ${der} ${verbo} <span class="glifo">${M.PGL[x.k1]} ${x.a.s} ${M.PGL[x.k2]}</span>`;
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
  else if(n===filas.length) frase=`Tu carta está de acuerdo contigo en todo: pesa lo ${ELEMENTO_FRASE[fuerte]}.`;
  else if(n>0) frase=`Tu carta coincide en ${n} de ${filas.length}. Lo que más pesa en ella es lo ${ELEMENTO_FRASE[fuerte]}${sugeridas.length?`; también te vería ${sugeridas.join(' y ')}`:''}.`;
  else frase=`Sorpresa: tu carta te ve distinto. Pesa lo ${ELEMENTO_FRASE[fuerte]}${sugeridas.length?`, más bien ${sugeridas.join(' o ')}`:''}.`;
  return {filas, n, frase, fuerte};
}

/* ---------- el cielo de hoy, en llano ---------- */
function climaLlano(tr, lista){
  const luna = `La Luna está en ${M.SIGNOS[M.signo(tr.Moon)]}: hoy el ánimo del equipo tira a lo ${ELEMENTO[M.elemDe(tr.Moon)]}.`;
  const tocados=lista.filter(p=>p.lunaToca);
  const quien = !lista.length ? '' : tocados.length
    ? `Hoy la Luna toca a ${tocados.map(p=>`<b>${p.n}</b>`).join(', ')}: su lado emocional anda más despierto.`
    : 'Hoy la Luna no toca a nadie del mapa; día parejo.';
  return {luna, quien};
}
/* La frase del día para una pareja. */
function fraseDia(cl){
  if(!cl.length) return 'Hoy no hay nada especial en el cielo entre ustedes. Día tranquilo.';
  return cl.map(x=>{
    const t = x.txt.replace(/^Luna/,'El lado emocional del equipo (la Luna)').replace(/^Sol/,'El Sol').replace(/^Venus/,'Venus').replace(/^Marte/,'Marte')
      .replace(/ sobre la Luna de /,' se para justo sobre el lado emocional de ').replace(/ sobre el Sol de /,' se para justo sobre el signo de ').replace(/ sobre el Ascendente de /,' se para justo sobre la primera impresión de ')
      .replace(/ en trígono a la Luna de /,' está en sintonía plena con el lado emocional de ').replace(/ en trígono al Sol de /,' está en sintonía plena con el signo de ').replace(/ en trígono al Ascendente de /,' está en sintonía plena con la primera impresión de ')
      .replace(/ en sextil a la Luna de /,' está en sintonía con el lado emocional de ').replace(/ en sextil al Sol de /,' está en sintonía con el signo de ').replace(/ en sextil al Ascendente de /,' está en sintonía con la primera impresión de ')
      .replace(/ en cuadratura a la Luna de /,' reta al lado emocional de ').replace(/ en cuadratura al Sol de /,' reta al signo de ').replace(/ en cuadratura al Ascendente de /,' reta a la primera impresión de ')
      .replace(/ en oposición a la Luna de /,' está de frente al lado emocional de ').replace(/ en oposición al Sol de /,' está de frente al signo de ').replace(/ en oposición al Ascendente de /,' está de frente a la primera impresión de ');
    return `${t}: <b>${x.pos?'día ligero entre ustedes':'día con chispa entre ustedes'}</b>.`;
  }).join(' ');
}

/* ---------- glosario ---------- */
const GLOSARIO = [
  {t:'Tu signo (el Sol)', d:'El de siempre, el que todo mundo sabe: dónde estaba el Sol el día que naciste. Dice lo que eres en esencia. En el mapa marca en qué parte del anillo está tu estrella.'},
  {t:'Tu lado emocional (la Luna)', d:'Dónde estaba la Luna cuando naciste. Cambia de signo cada dos días y medio, por eso ayuda saber la hora. Dice cómo sientes por dentro. En el mapa es la altura de tu estrella.'},
  {t:'Tu primera impresión (el Ascendente)', d:'El signo que salía por el horizonte a la hora exacta en que naciste, en tu ciudad. Dice cómo te ven al conocerte. Sin hora exacta no se puede calcular; no pasa nada.'},
  {t:'Los hilos', d:'Cada hilo une a dos personas. Su grosor es qué tanto se mueven el uno al otro; su color es cómo se llevan: dorado fluyen, azul cada quien en lo suyo, violeta se retan. Ninguno es «malo»: retarse también enciende cosas.'},
  {t:'Los cuatro elementos', d:'Cada signo pertenece a uno: fuego (impulso), tierra (lo práctico), aire (las ideas) o agua (la emoción). Es el color del brillo de cada estrella. Los del mismo elemento se entienden rápido; fuego con aire y tierra con agua también se llevan.'},
  {t:'El cielo de hoy', d:'Dónde están el Sol, la Luna, Venus y Marte en este momento, marcados en el anillo. La Luna recorre todo el anillo en un mes y «toca» a quien pasa cerca: esa estrella late. Por eso el mapa cambia cada día sin que nadie haga nada.'},
  {t:'Descubrir un hilo', d:'Toca un hilo o la estrella de alguien y se abre su lectura. Cada hilo descubierto queda encendido para ti. La meta es descubrirlos todos.'},
];

/* ---------- recorrido ---------- */
const RECORRIDO = [
  {t:'Tu estrella', d:'Eres una estrella en el mapa. Alrededor del anillo está tu signo; la altura es tu lado emocional. Tu estrella crece en tres etapas: con tu fecha, con tu hora y con tu ciudad.'},
  {t:'Los hilos', d:'Cada hilo te une con alguien del equipo. Grueso: se mueven mucho el uno al otro. Dorado: fluyen. Azul: cada quien en lo suyo. Violeta: se retan, y eso también enciende. Tócalo y descúbrelo.'},
  {t:'El cielo de hoy', d:'La Luna y los planetas de hoy recorren el anillo. Cuando la Luna pasa cerca de una estrella, esa persona late. El mapa cambia cada día solo.'},
  {t:'Sin jerga', d:'Aquí no hay que saber nada: cada cosa está dicha en llano, y el glosario (abajo del mapa) explica los seis términos que importan. Es un juego del equipo, no una evaluación.'},
];

return {PUNTO, de, ELEMENTO, ELEMENTO_FRASE, ASPECTO_LLANO, tonoLlano, intensidadLlana, porque, pron, PALABRAS, palabra, elementosDe, comparar, climaLlano, fraseDia, GLOSARIO, RECORRIDO};
})();
