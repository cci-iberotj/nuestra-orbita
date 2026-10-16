/* ═══════════════════════════════════════════════════════════
   Nuestra Órbita · Las lecturas
   Equipo de Diseño y Medios · IBERO Tijuana

   Qué dice cada cosa de una persona y de un vínculo, en términos
   concretos. Sigue la lectura clásica de la astrología occidental
   moderna (la línea de Stephen Arroyo, Liz Greene, Sue Tompkins
   para los aspectos y Robert Hand para los tránsitos), resumida y
   escrita sin género para que sirva a cualquiera.

   Regla de tono: describe tendencias y dinámicas, nunca juzga.
   Ningún signo, aspecto ni vínculo es bueno o malo; la tensión da
   fricción y también impulso.

   Qué hay aquí:
     SOL, LUNA, ASC, MERCURIO, VENUS, MARTE   por signo (12 cada uno)
     ELEMENTO, MODALIDAD                      por grupo
     sintesisPersona(carta)                   cómo se combinan Sol, Luna y Ascendente
     leerPersona(carta, tu)                   la lectura completa, por partes
     leerVinculo(v, nombres, tuyo)            la lectura del hilo entre dos
     leerDia(cl)                              qué hace el cielo de hoy con un vínculo
   ═══════════════════════════════════════════════════════════ */
window.Lecturas = (function(){
'use strict';
const M = window.Motor;
const S = ['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'];

/* ---------- el Sol: la esencia, cómo funciona la persona ---------- */
const SOL = {
  Aries:       'Arranca. Energía directa, decisiones rápidas y poca paciencia con los rodeos. Funciona mejor cuando tiene algo que iniciar.',
  Tauro:       'Constancia y sentido práctico. Va a su ritmo, no se deja apresurar y cuida lo que tiene. Funciona mejor con estabilidad y tiempo.',
  Géminis:     'Curiosidad y palabra. Cambia de tema con facilidad, conecta ideas y personas, y se aburre con lo repetitivo. Funciona mejor con variedad.',
  Cáncer:      'Protege. Memoria emocional larga y apego a lo propio y a la gente cercana. Funciona mejor cuando hay confianza.',
  Leo:         'Presencia. Necesita expresarse y que lo que hace se note; es generoso cuando se siente reconocido. Funciona mejor con un escenario propio.',
  Virgo:       'Precisión. Observa el detalle, corrige y mejora; se exige mucho. Funciona mejor con un método claro.',
  Libra:       'Equilibrio. Busca acuerdo y buen trato, y pesa las opciones antes de decidir. Funciona mejor en pareja o en equipo.',
  Escorpio:    'Intensidad. Va al fondo de las cosas, guarda lo importante y no se queda en la superficie. Funciona mejor con confianza total.',
  Sagitario:   'Horizonte. Necesita sentido y movimiento, dice lo que piensa y apuesta por lo grande. Funciona mejor con libertad.',
  Capricornio: 'Estructura. Objetivos a largo plazo, disciplina y sentido de responsabilidad. Funciona mejor con un plan y reglas claras.',
  Acuario:     'Independencia. Piensa distinto, le interesa el grupo más que la jerarquía y toma distancia para ver el conjunto. Funciona mejor con libertad de criterio.',
  Piscis:      'Sensibilidad. Capta el ambiente, imagina y se adapta; los límites se le difuminan. Funciona mejor con inspiración y poca presión.',
};
/* ---------- la Luna: la necesidad emocional y la reacción ---------- */
const LUNA = {
  Aries:       'Reacciona rápido y se le pasa rápido. Necesita acción para sentirse bien; la espera le cuesta.',
  Tauro:       'Necesita calma y rutina. Se altera poco, pero lo que le altera le dura. Se recupera con comodidad y tiempo.',
  Géminis:     'Necesita hablar lo que siente para entenderlo. Ánimo cambiante; se recupera conversando o distrayéndose.',
  Cáncer:      'Sensibilidad alta y memoria larga. Necesita sentirse en casa; se recupera con gente cercana.',
  Leo:         'Necesita sentirse valorado para estar bien. Reacciona con intensidad y lo supera con afecto y reconocimiento.',
  Virgo:       'Procesa lo que siente analizándolo. Tiende a preocuparse; se recupera poniendo orden y resolviendo algo concreto.',
  Libra:       'Necesita armonía alrededor; el conflicto le pesa. Se recupera con compañía y trato amable.',
  Escorpio:    'Siente intenso y lo guarda. Desconfía antes de abrirse; cuando confía, es total.',
  Sagitario:   'Necesita aire y perspectiva. Optimismo rápido; se recupera saliendo o cambiando de escenario.',
  Capricornio: 'Contiene lo que siente y lo administra. Necesita sentirse competente; se recupera trabajando.',
  Acuario:     'Toma distancia de lo que siente para entenderlo. Necesita espacio; se recupera a solas o con amistades, nunca bajo presión.',
  Piscis:      'Absorbe el ánimo de los demás. Necesita refugio y silencio; se recupera con tiempo a solas.',
};
/* ---------- el Ascendente: la primera impresión ---------- */
const ASC = {
  Aries:       'Se le ve con decisión, directo y con prisa. Entra de frente.',
  Tauro:       'Se le ve tranquilo, sólido y de pocas palabras. Transmite calma.',
  Géminis:     'Se le ve ágil, conversador y curioso. Pregunta mucho.',
  Cáncer:      'Se le ve reservado al principio y cálido después. Observa antes de abrirse.',
  Leo:         'Se le ve seguro y con presencia. Llena el espacio.',
  Virgo:       'Se le ve discreto, atento al detalle y modesto. Escucha más de lo que habla.',
  Libra:       'Se le ve amable, de buen trato y buen gusto. Busca caer bien.',
  Escorpio:    'Se le ve intenso, reservado y difícil de leer. Impone sin hablar.',
  Sagitario:   'Se le ve franco, animado y algo impaciente. Cuenta cosas.',
  Capricornio: 'Se le ve serio, formal y competente. Cuesta verle relajado.',
  Acuario:     'Se le ve distinto, independiente y algo distante. Original sin esfuerzo.',
  Piscis:      'Se le ve suave, receptivo y un poco disperso. Cuesta ubicarle.',
};
/* ---------- Mercurio: la mente ---------- */
const MERCURIO = {
  Aries:'piensa rápido y decide; habla directo.', Tauro:'piensa despacio y con los pies en la tierra; no cambia de opinión fácil.',
  Géminis:'piensa varias cosas a la vez; comunica con facilidad.', Cáncer:'piensa desde lo que siente; memoria larga.',
  Leo:'piensa en grande y convence.', Virgo:'piensa en detalle; analiza y corrige.',
  Libra:'piensa en los dos lados; tarda en decidir.', Escorpio:'piensa a fondo; desconfía de lo fácil.',
  Sagitario:'piensa en conceptos grandes; habla sin filtro.', Capricornio:'piensa en lo útil; planifica.',
  Acuario:'piensa distinto; sistemas e ideas nuevas.', Piscis:'piensa en imágenes; más intuición que lógica.',
};
/* ---------- Venus: el afecto y el trato ---------- */
const VENUS = {
  Aries:'quiere y colabora con iniciativa; se enfría si no hay respuesta.', Tauro:'lealtad y hechos más que palabras; le cuesta soltar.',
  Géminis:'afecto por conversación; necesita variedad.', Cáncer:'cuida y se apega.',
  Leo:'generoso, y necesita que se note.', Virgo:'demuestra ayudando y resolviendo; crítica con cariño.',
  Libra:'busca el acuerdo y la cortesía; evita el choque.', Escorpio:'todo o nada; lealtad profunda y celos.',
  Sagitario:'afecto abierto, sin ataduras.', Capricornio:'afecto serio, con compromiso y poco teatro.',
  Acuario:'amistad antes que romance; necesita espacio.', Piscis:'se entrega e idealiza.',
};
/* ---------- Marte: la acción y el conflicto ---------- */
const MARTE = {
  Aries:'actúa de inmediato; discute de frente y se le pasa.', Tauro:'actúa despacio y no se detiene; en conflicto, se planta.',
  Géminis:'actúa con palabras; discute con argumentos y rapidez.', Cáncer:'actúa por lo que siente; en conflicto se retrae o protege.',
  Leo:'actúa con orgullo; en conflicto defiende su dignidad.', Virgo:'actúa con método; en conflicto, crítica precisa.',
  Libra:'actúa después de medir; evita el conflicto hasta que explota.', Escorpio:'actúa con estrategia y persistencia; no olvida.',
  Sagitario:'actúa a lo grande; conflicto franco y breve.', Capricornio:'actúa con disciplina; en conflicto, frío y firme.',
  Acuario:'actúa a su manera; en conflicto, se desconecta.', Piscis:'actúa por intuición; evita el conflicto y cede.',
};
const ELEMENTO = {
  fuego:  'Fuego: actúa por impulso y entusiasmo; necesita movimiento.',
  tierra: 'Tierra: actúa por lo concreto; necesita resultados.',
  aire:   'Aire: actúa por ideas; necesita intercambio.',
  agua:   'Agua: actúa por lo que siente; necesita confianza.',
};
const MODALIDAD = {cardinal:'cardinal: inicia', fija:'fija: sostiene', mutable:'mutable: adapta'};

const signo = l => S[M.signo(l)];
const elem = l => M.elemDe(l);
const relacionElementos = (e1,e2) => e1===e2 ? 'mismo' : (['fuego','aire'].includes(e1)===['fuego','aire'].includes(e2)) ? 'afin' : 'distinto';

/* ---------- cómo se combinan Sol, Luna y Ascendente ---------- */
function sintesisPersona(c){
  const out=[];
  const r=relacionElementos(elem(c.Sun),elem(c.Moon));
  if(r==='mismo') out.push('Signo solar y signo lunar del mismo elemento: lo que muestra y lo que necesita van en la misma dirección. Coherencia, poca contradicción interna.');
  else if(r==='afin') out.push('Signo solar y signo lunar de elementos afines: lo que muestra y lo que necesita se complementan sin esfuerzo.');
  else out.push('Signo solar y signo lunar de elementos distintos: lo que muestra (Sol) y lo que necesita por dentro (Luna) van por caminos separados. Contraste interno que da matices y, a veces, contradicción.');
  if(c.Asc!=null){
    if(elem(c.Asc)===elem(c.Sun)) out.push('Ascendente del mismo elemento que el Sol: se le ve como es.');
    else out.push('Ascendente de otro elemento que el Sol: la primera impresión no coincide con la esencia; quien le conoce bien ve otra cosa.');
  }
  return out;
}

/* ---------- la lectura completa de una persona ---------- */
function leerPersona(c, tu){
  const pos = tu ? 'Tu' : 'Su';
  const partes=[
    {t:`${pos} signo solar · ${signo(c.Sun)}`, d:SOL[signo(c.Sun)]+' '+ELEMENTO[elem(c.Sun)]},
    {t:`${pos} signo lunar · ${signo(c.Moon)}${c.exacta?'':' (aproximado)'}`, d:LUNA[signo(c.Moon)]},
    c.Asc!=null ? {t:`${pos} ascendente · ${signo(c.Asc)}`, d:ASC[signo(c.Asc)]} : {t:`${pos} ascendente`, d:'Requiere hora exacta de nacimiento.'},
    {t:'Mente, afecto y acción', d:`Mercurio en ${signo(c.Mercury)}: ${MERCURIO[signo(c.Mercury)]} Venus en ${signo(c.Venus)}: ${VENUS[signo(c.Venus)]} Marte en ${signo(c.Mars)}: ${MARTE[signo(c.Mars)]}`},
    {t:'En conjunto', d:sintesisPersona(c).join(' ')},
  ];
  return partes;
}

/* ---------- los aspectos entre dos cartas ----------
   Clave: par de puntos (sin orden) y tipo: C conjunción, A armonía
   (sextil, trígono), T tensión (cuadratura, oposición). */
const PAR = {
  'Sun|Sun':     {C:'Misma esencia: se entienden de inmediato y también compiten por el mismo espacio.', A:'Esencias compatibles: se apoyan sin esfuerzo.', T:'Esencias que chocan: cada quien quiere llevar las cosas a su manera. Mucha energía si se reparten el terreno.'},
  'Moon|Sun':    {C:'La esencia de uno coincide con la necesidad emocional del otro: el vínculo clásico de complemento.', A:'Lo que uno es le hace bien a lo que el otro siente: apoyo natural.', T:'Lo que uno es incomoda a lo que el otro necesita: roces que piden ajustar expectativas.'},
  'Moon|Moon':   {C:'Mismo registro emocional: se leen el ánimo sin hablar.', A:'Ánimos compatibles: se calman mutuamente.', T:'Necesidades emocionales distintas: lo que a uno tranquiliza al otro inquieta.'},
  'Asc|Sun':     {C:'Uno es como el otro aparenta: afinidad inmediata.', A:'La presencia de uno acompaña la esencia del otro: trato fácil desde el inicio.', T:'Primera impresión y esencia no cuadran: el arranque es incómodo aunque después funcione.'},
  'Asc|Moon':    {C:'La forma de presentarse de uno encaja con lo que el otro siente: comodidad rápida.', A:'Trato cómodo desde el principio.', T:'La manera de presentarse de uno altera al otro.'},
  'Asc|Asc':     {C:'Mismo estilo de presentarse.', A:'Estilos de presentarse compatibles.', T:'Estilos de presentarse que contrastan.'},
  'Mars|Venus':  {C:'Atracción y empuje: uno quiere y el otro actúa, y coinciden. Mucha energía en común.', A:'Afecto y acción coordinados: trabajan y se llevan bien.', T:'Lo que uno quiere y cómo actúa el otro chocan: fricción con chispa.'},
  'Venus|Venus': {C:'Misma forma de querer y de tratar: gustos parecidos.', A:'Formas de trato compatibles.', T:'Gustos y formas de trato distintos: desacuerdos de estilo.'},
  'Mars|Mars':   {C:'Misma forma de actuar: aliados o rivales según el terreno.', A:'Ritmos de acción compatibles: avanzan juntos.', T:'Ritmos de acción que chocan: discusiones sobre cómo hacer las cosas.'},
  'Mercury|Mercury':{C:'Piensan parecido.', A:'Se entienden hablando.', T:'Piensan distinto: discusiones que, bien llevadas, enriquecen.'},
  'Mercury|Sun': {C:'Uno entiende con facilidad cómo funciona el otro.', A:'Uno entiende con facilidad cómo funciona el otro.', T:'A uno le cuesta entender al otro; hace falta explicar más.'},
  'Mercury|Moon':{C:'Conversación que calma.', A:'Conversación que calma.', T:'Palabras que irritan sin querer.'},
  'Sun|Venus':   {C:'Afecto natural: a uno le gusta cómo es el otro.', A:'Afecto natural: a uno le gusta cómo es el otro.', T:'Lo que uno valora y lo que el otro es no coinciden del todo.'},
  'Moon|Venus':  {C:'Cariño y comodidad: se cuidan.', A:'Cariño y comodidad: se cuidan.', T:'Expectativas de trato distintas.'},
  'Mars|Sun':    {C:'Energía compartida: empuje y competencia.', A:'Se impulsan.', T:'Choque de voluntades.'},
  'Mars|Moon':   {C:'Uno activa al otro.', A:'Uno activa al otro.', T:'La forma de actuar de uno hiere lo que el otro siente: discusiones.'},
};
const NOMBRE = {Sun:'el signo solar',Moon:'el signo lunar',Asc:'el ascendente',Mercury:'Mercurio',Venus:'Venus',Mars:'Marte'};
function tipo(a){ return a.a===0?'C':(a.a===60||a.a===120)?'A':'T'; }
function textoAspecto(x){
  const k=[x.k1,x.k2].sort().join('|'); const t=tipo(x.a);
  if(PAR[k]) return PAR[k][t];
  const n1=NOMBRE[x.k1], n2=NOMBRE[x.k2];
  return t==='A' ? `Compatibilidad entre ${n1} de uno y ${n2} del otro.` : t==='T' ? `Contraste entre ${n1} de uno y ${n2} del otro.` : `Coincidencia entre ${n1} de uno y ${n2} del otro.`;
}
const INTENSIDAD = {
  'mínima':'Pocos puntos en contacto entre las cartas: relación que tiende a ser tranquila y distante.',
  'moderada':'Algunos contactos: relación presente, sin dominar.',
  'significativa':'Varios contactos: se influyen de verdad.',
  'alta':'Muchos contactos: relación que marca a los dos.',
  'excepcional':'Contactos por todos lados: difícil quedar indiferentes.',
};
function textoElementos(c1,c2){
  const r=relacionElementos(elem(c1.Sun),elem(c2.Sun));
  const s = r==='mismo' ? 'Signos solares del mismo elemento: se entienden el modo de ser.' : r==='afin' ? 'Signos solares de elementos afines: se complementan.' : 'Signos solares de elementos distintos: modos de ser que contrastan.';
  const rl=relacionElementos(elem(c1.Moon),elem(c2.Moon));
  const l = rl==='mismo' ? 'Signos lunares del mismo elemento: sienten parecido.' : rl==='afin' ? 'Signos lunares afines: se acompañan en lo emocional.' : 'Signos lunares de elementos distintos: necesitan cosas distintas para estar bien.';
  return s+' '+l;
}
/* La lectura de un hilo: intensidad, los aspectos que más pesan y los elementos. */
function leerVinculo(v){
  const partes=[];
  partes.push(INTENSIDAD[M.banda(v.I)]);
  const vistos=new Set();
  v.lista.slice(0,4).forEach(x=>{ const t=textoAspecto(x); if(!vistos.has(t)){ vistos.add(t); partes.push(t); } });
  partes.push(textoElementos(v.a.carta, v.b.carta));
  return partes;
}

/* ---------- el cielo de hoy sobre un vínculo ---------- */
const TRANSITO = {
  Moon:  {C:'sensibilidad alta', A:'ánimo ligero', T:'ánimo inquieto; conviene no forzar'},
  Sun:   {C:'día de visibilidad', A:'energía fácil', T:'voluntad a prueba'},
  Venus: {C:'buen trato', A:'buen trato', T:'desacuerdos de gusto'},
  Mars:  {C:'empuje y prisa', A:'energía para avanzar', T:'roces; cuidado con la prisa'},
};
const PLANETA = {Luna:'Moon',Sol:'Sun',Venus:'Venus',Marte:'Mars'};
function leerDia(x){
  const p = PLANETA[x.txt.split(' ')[0]] || 'Moon';
  const t = /sobre/.test(x.txt) ? 'C' : x.pos ? 'A' : 'T';
  return TRANSITO[p][t];
}

return {SOL, LUNA, ASC, MERCURIO, VENUS, MARTE, ELEMENTO, MODALIDAD, sintesisPersona, leerPersona, leerVinculo, leerDia, textoAspecto, INTENSIDAD};
})();
