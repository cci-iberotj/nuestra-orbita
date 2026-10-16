/* ═══════════════════════════════════════════════════════════
   Constelación · El mapa en 3D
   Equipo de Diseño y Medios · IBERO Tijuana

   Una bóveda con profundidad: el anillo de los doce signos en el
   piso, cada persona como una estrella que brilla con el color de
   su elemento, los hilos como trazos de luz y la Luna y los
   planetas de hoy recorriendo el anillo. La cámara gira sola y se
   deja mover con el dedo o el mouse.

   Dónde va cada estrella: alrededor del anillo, en el grado de su
   signo (el Sol); en altura, su lado emocional (la Luna). Crece en
   tres etapas según lo completo del perfil.

   Qué recibe (poner): la lista de personas ya con carta (Motor),
   y quién soy / qué hilos descubrí, para encender lo mío.
   Qué avisa (alSeleccionar): {tipo:'nodo', p} · {tipo:'hilo', v} · null
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const M = window.Motor;
const RAD = Math.PI/180;

/* ---------- colores (los mismos del concepto, en noche) ---------- */
const COLOR = {
  fuego:0xffb36b, tierra:0xa8e6a1, aire:0xa9d8ff, agua:0xc9b0ff,
  oro:0xffd79a, violeta:0xd4a6ff, azul:0x9fd3ff, estrella:0xffffff, anillo:0x8f86c2,
};
const TONO_COLOR = {'var(--oro)':COLOR.oro, 'var(--violeta)':COLOR.violeta, 'var(--azul)':COLOR.azul};

/* Hilos visibles desde intensidad 5 (moderada). Fijo a propósito. */
const UMBRAL = 5;
const R_ANILLO = 5.4;

/* ---------- texturas dibujadas ---------- */
function texturaBrillo(){
  const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d');
  const r=g.createRadialGradient(64,64,0,64,64,64);
  r.addColorStop(0,'rgba(255,255,255,1)'); r.addColorStop(.18,'rgba(255,255,255,.75)'); r.addColorStop(.45,'rgba(255,255,255,.18)'); r.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=r; g.fillRect(0,0,128,128);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function texturaTexto(txt, px=96, color='#cfc8ec'){
  const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d');
  g.font=`${px}px "Noto Sans Symbols2","Segoe UI Symbol","Apple Symbols",serif`; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle=color;
  g.fillText(txt,64,70);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
const BRILLO = texturaBrillo();

/* ---------- geometría del mapa ---------- */
/* Alrededor: el grado del Sol. 0° Aries a la derecha, creciendo en
   contra del reloj visto desde arriba, igual que una carta. */
function alrededor(lon, r){ const a=lon*RAD; return [r*Math.cos(a), -r*Math.sin(a)]; }
/* Altura: dónde cae la Luna respecto al Sol. */
function altura(c){ return 1.5*Math.sin(((c.Moon-c.Sun)+360)%360*RAD); }
function posiciones(lista){
  const out=[]; const radios=[4.1,3.3,4.8,3.7,4.45];
  lista.forEach((p,i)=>{
    const y=altura(p.carta); let elegido=null;
    for(const r of radios){ const [x,z]=alrededor(p.carta.Sun,r); if(out.every(q=>Math.hypot(q.x-x,q.y-y,q.z-z)>1.0)){ elegido=new THREE.Vector3(x,y,z); break; } }
    if(!elegido){ const [x,z]=alrededor(p.carta.Sun,radios[i%radios.length]); elegido=new THREE.Vector3(x,y,z); }
    out.push(elegido);
  });
  return out;
}

export function crearMapa(contenedor, {alSeleccionar}={}){
  /* ---------- escena ---------- */
  const escena=new THREE.Scene();
  escena.background=new THREE.Color(0x0b1026);
  escena.fog=new THREE.FogExp2(0x0b1026, 0.012);
  const camara=new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  camara.position.set(0, 7.5, 13.5);
  const renderer=new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
  renderer.domElement.className='lienzo';
  contenedor.appendChild(renderer.domElement);
  const etiquetas=new CSS2DRenderer(); etiquetas.domElement.className='etiquetas';
  contenedor.appendChild(etiquetas.domElement);

  const compositor=new EffectComposer(renderer);
  compositor.addPass(new RenderPass(escena,camara));
  const bloom=new UnrealBloomPass(new THREE.Vector2(1,1), 0.75, 0.5, 0.15);
  compositor.addPass(bloom);
  compositor.addPass(new OutputPass());

  const controles=new OrbitControls(camara, etiquetas.domElement);
  controles.enableDamping=true; controles.dampingFactor=.06; controles.enablePan=false;
  controles.minDistance=8; controles.maxDistance=20; controles.minPolarAngle=.55; controles.maxPolarAngle=1.5;
  controles.autoRotate=true; controles.autoRotateSpeed=.35;
  controles.target.set(0,.4,0);

  /* ---------- fondo: estrellas y nebulosas ---------- */
  const fondo=new THREE.Group(); escena.add(fondo);
  {
    const n=1600, pos=new Float32Array(n*3), tam=new Float32Array(n);
    for(let i=0;i<n;i++){ const v=new THREE.Vector3().randomDirection().multiplyScalar(40+Math.random()*30); pos.set([v.x,v.y,v.z],i*3); tam[i]=Math.random(); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const m=new THREE.PointsMaterial({color:0xffffff,size:.22,sizeAttenuation:true,map:BRILLO,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending});
    fondo.add(new THREE.Points(g,m));
    [[0xd4a6ff,-18,6,-24,34],[0xffd79a,20,-4,-20,30],[0x9fd3ff,6,12,-30,26],[0x6b4fd8,-10,-10,-18,22]].forEach(([c,x,y,z,s])=>{
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:BRILLO,color:c,transparent:true,opacity:.16,depthWrite:false,blending:THREE.AdditiveBlending}));
      sp.position.set(x,y,z); sp.scale.set(s,s,1); fondo.add(sp);
    });
  }

  /* ---------- anillo de signos ---------- */
  const anillo=new THREE.Group(); escena.add(anillo);
  {
    const mat=new THREE.MeshBasicMaterial({color:COLOR.anillo,transparent:true,opacity:.45});
    anillo.add(new THREE.Mesh(new THREE.TorusGeometry(R_ANILLO,.012,6,180).rotateX(Math.PI/2),mat));
    const puntos=[]; for(let i=0;i<=180;i++){ const a=i/180*Math.PI*2; puntos.push(new THREE.Vector3(Math.cos(a)*(R_ANILLO-.35),0,Math.sin(a)*(R_ANILLO-.35))); }
    const dash=new THREE.Line(new THREE.BufferGeometry().setFromPoints(puntos), new THREE.LineDashedMaterial({color:COLOR.anillo,dashSize:.05,gapSize:.14,transparent:true,opacity:.5}));
    dash.computeLineDistances(); anillo.add(dash);
    for(let i=0;i<12;i++){
      const [x1,z1]=alrededor(i*30,R_ANILLO-.35), [x2,z2]=alrededor(i*30,R_ANILLO);
      anillo.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1,0,z1),new THREE.Vector3(x2,0,z2)]), new THREE.LineBasicMaterial({color:COLOR.anillo,transparent:true,opacity:.6})));
      const [gx,gz]=alrededor(i*30+15,R_ANILLO+.5);
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:texturaTexto(M.GLIFOS[i]),transparent:true,opacity:.75,depthWrite:false}));
      sp.position.set(gx,.02,gz); sp.scale.set(.62,.62,1); anillo.add(sp);
      const et=document.createElement('div'); et.className='etq signo'; et.textContent=M.SIGNOS[i];
      const o=new CSS2DObject(et); o.position.set(gx,-.32,gz); anillo.add(o);
    }
  }

  /* ---------- estado ---------- */
  let lista=[], vinculos=[], nodos=[], hilos=[], P=[];
  let conocidos=null, miId=null, descubiertos=new Set();
  let seleccion=null, sobre=null, firma='';
  let transitos={grupo:new THREE.Group(), marcas:{}}; escena.add(transitos.grupo);
  const reloj=new THREE.Clock(); let animaciones=[];
  const objetivo=new THREE.Vector3(0,.4,0);

  function calcularVinculos(){
    vinculos=[];
    for(let i=0;i<lista.length;i++) for(let j=i+1;j<lista.length;j++){
      const Pc=lista[i].carta,Q=lista[j].carta; const I=M.intensidad(Pc,Q), H=M.armonia(Pc,Q);
      vinculos.push({i,j,a:lista[i],b:lista[j],I:I.pts,det:I.det,H:H.h,lista:H.lista,visible:I.pts>=UMBRAL});
    }
  }
  const tamanoEtapa = e => e===3?1.25:e===2?1.02:.82;

  function limpiar(){
    nodos.forEach(n=>{ escena.remove(n.grupo); n.grupo.traverse(o=>{ if(o.isCSS2DObject) o.element.remove(); }); });
    hilos.forEach(h=>{ escena.remove(h.linea); h.linea.geometry.dispose(); h.linea.material.dispose(); });
    nodos=[]; hilos=[]; animaciones=[];
  }

  function construir(){
    const nuevos=new Set(lista.filter(p=>!conocidos||!conocidos.has(p.id)).map(p=>p.id));
    const primera=conocidos===null;
    limpiar(); P=posiciones(lista); calcularVinculos();
    const tam=renderer.getSize(new THREE.Vector2());

    lista.forEach((p,i)=>{
      const g=new THREE.Group(); g.position.copy(P[i]);
      const color=COLOR[M.elemDe(p.carta.Sun)];
      const brillo=new THREE.Sprite(new THREE.SpriteMaterial({map:BRILLO,color,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending}));
      const nucleo=new THREE.Mesh(new THREE.SphereGeometry(.085,16,16), new THREE.MeshBasicMaterial({color:COLOR.estrella}));
      const centro=new THREE.Mesh(new THREE.SphereGeometry(.05,12,12), new THREE.MeshBasicMaterial({color}));
      centro.position.z=.06;
      const base=tamanoEtapa(p.etapa||M.etapa(p))*(p.id===miId?1.18:1);
      brillo.scale.set(base,base,1); g.add(brillo,nucleo,centro);
      let aro=null;
      if(p.id===miId){ aro=new THREE.Mesh(new THREE.TorusGeometry(.26,.012,8,48), new THREE.MeshBasicMaterial({color:COLOR.estrella,transparent:true,opacity:.7})); g.add(aro); }
      const et=document.createElement('div'); et.className='etq nombre'+(p.id===miId?' mia':'')+(p.demo?' demo':''); et.textContent=p.n+(p.demo?' ·':'');
      if(!p.carta.exacta){ const s=document.createElement('span'); s.className='sinhora'; s.title=p.carta.aprox?'hora aproximada':'sin hora'; et.appendChild(s); }
      const o=new CSS2DObject(et); o.position.set(0,-.34,0); g.add(o);
      nucleo.userData={tipo:'nodo',i}; brillo.userData={tipo:'nodo',i};
      escena.add(g);
      const nodo={p,grupo:g,brillo,nucleo,centro,aro,etiqueta:et,base,pulso:0};
      nodos.push(nodo);
      if(nuevos.has(p.id)) nacer(nodo, primera? i*.12 : 0);
    });

    vinculos.forEach((v,k)=>{
      if(!v.visible) return;
      const a=P[v.i], b=P[v.j]; const medio=a.clone().add(b).multiplyScalar(.5);
      const control=medio.clone().multiplyScalar(.55); control.y=medio.y+.35;
      const curva=new THREE.QuadraticBezierCurve3(a,control,b); const puntos=curva.getPoints(36);
      const geo=new LineGeometry(); geo.setPositions(puntos.flatMap(q=>[q.x,q.y,q.z]));
      const I=Math.pow(Math.min(v.I/25,1),1.3);
      const mat=new LineMaterial({color:TONO_COLOR[M.tono(v.H).c],linewidth:1+3.4*I,transparent:true,opacity:.16+.5*I,depthWrite:false,blending:THREE.AdditiveBlending});
      mat.resolution.copy(tam);
      const linea=new Line2(geo,mat); linea.computeLineDistances(); linea.userData={tipo:'hilo',k};
      escena.add(linea);
      const hilo={v,k,linea,mat,I,opacidad:.16+.5*I,ancho:1+3.4*I,segmentos:puntos.length-1};
      hilos.push(hilo);
      if(nuevos.has(v.a.id)||nuevos.has(v.b.id)){ geo.instanceCount=0; animaciones.push({t:0,dur:1.3,retraso:primera?1.2+Math.max(v.i,v.j)*.12:.7,paso:f=>{ geo.instanceCount=Math.round(f*hilo.segmentos); }}); }
    });
    conocidos=new Set(lista.map(p=>p.id));
    aplicarEstado();
  }

  function nacer(nodo, retraso){
    const b=nodo.base; nodo.brillo.scale.set(0,0,1); nodo.nucleo.scale.set(0,0,0); nodo.etiqueta.style.opacity=0;
    const onda=new THREE.Mesh(new THREE.TorusGeometry(.2,.015,8,48), new THREE.MeshBasicMaterial({color:COLOR.estrella,transparent:true,opacity:.9}));
    nodo.grupo.add(onda);
    animaciones.push({t:0,dur:1.4,retraso,paso:f=>{
      const s=f<.6? b*2.2*(f/.6) : b*(2.2-1.2*((f-.6)/.4)); nodo.brillo.scale.set(s,s,1);
      const n=Math.min(1,f*1.6); nodo.nucleo.scale.set(n,n,n);
      const o=1+f*9; onda.scale.set(o,o,1); onda.material.opacity=.9*(1-f);
      nodo.etiqueta.style.opacity=Math.max(0,(f-.5)*2);
    },fin:()=>{ nodo.grupo.remove(onda); onda.geometry.dispose(); onda.material.dispose(); nodo.brillo.scale.set(b,b,1); }});
  }

  /* Qué se ve atenuado y qué encendido según la selección. */
  function aplicarEstado(){
    const sel=seleccion||sobre;
    const enfocados=new Set(); let hiloSel=null;
    if(sel&&sel.tipo==='nodo'){ enfocados.add(sel.i); hilos.forEach(h=>{ if(h.v.i===sel.i||h.v.j===sel.i){ enfocados.add(h.v.i); enfocados.add(h.v.j); } }); }
    if(sel&&sel.tipo==='hilo'){ hiloSel=sel.k; const v=vinculos[sel.k]; enfocados.add(v.i); enfocados.add(v.j); }
    nodos.forEach((n,i)=>{
      const apagado=sel && !enfocados.has(i);
      n.brillo.material.opacity=apagado?.25:.85; n.etiqueta.classList.toggle('apagada',!!apagado); n.etiqueta.classList.toggle('activa',!!(sel&&enfocados.has(i)));
      if(n.aro) n.aro.material.opacity=apagado?.2:.7;
    });
    hilos.forEach(h=>{
      const mio = miId && (h.v.a.id===miId||h.v.b.id===miId);
      const otro = mio ? (h.v.a.id===miId?h.v.b.id:h.v.a.id) : null;
      const descubierto = !miId || !mio || descubiertos.has(otro);
      let on = !sel || (sel.tipo==='hilo' ? h.k===hiloSel : (h.v.i===sel.i||h.v.j===sel.i));
      h.mat.opacity = on ? h.opacidad*(descubierto?1:.4) : .05;
      h.mat.linewidth = on ? h.ancho*(descubierto?1:.6) : h.ancho*.5;
      h.linea.userData.descubierto=descubierto;
    });
    controles.autoRotate=!seleccion;
    if(seleccion&&seleccion.tipo==='nodo') objetivo.copy(P[seleccion.i]).multiplyScalar(.45).setY(P[seleccion.i].y*.5);
    else if(seleccion&&seleccion.tipo==='hilo'){ const v=vinculos[seleccion.k]; objetivo.copy(P[v.i]).add(P[v.j]).multiplyScalar(.5).multiplyScalar(.45); }
    else objetivo.set(0,.4,0);
  }

  /* ---------- tránsitos ---------- */
  function cielo(fecha){
    const tr=M.cielo(fecha||new Date());
    const g=transitos.grupo;
    if(!transitos.listo){
      [['Sun','Sol',.42,COLOR.estrella],['Moon','Luna',.95,COLOR.oro],['Venus','Venus',.36,COLOR.estrella],['Mars','Marte',.36,0xffc9a8]].forEach(([k,n,s,c])=>{
        const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:BRILLO,color:c,transparent:true,opacity:k==='Moon'?1:.8,depthWrite:false,blending:THREE.AdditiveBlending}));
        sp.scale.set(s,s,1); g.add(sp);
        const et=document.createElement('div'); et.className='etq transito'+(k==='Moon'?' luna':''); et.textContent=n;
        const o=new CSS2DObject(et); o.position.set(0,.3,0); sp.add(o);
        transitos.marcas[k]=sp;
      });
      transitos.listo=true;
    }
    for(const k in transitos.marcas){ const [x,z]=alrededor(tr[k],R_ANILLO-.12); transitos.marcas[k].position.set(x,.02,z); }
    // a quién toca la Luna
    lista.forEach((p,i)=>{ p.lunaToca=false; for(const k of ['Sun','Moon','Asc']){ if(p.carta[k]==null) continue; const a=M.aspecto(tr.Moon,p.carta[k],6); if(a&&(a.a===0||a.orb<=2.5)){ p.lunaToca=true; break; } } if(nodos[i]) nodos[i].pulso=p.lunaToca?1:0; });
    return tr;
  }

  /* ---------- interacción ---------- */
  const ray=new THREE.Raycaster(); ray.params.Line2={threshold:7};
  const puntero=new THREE.Vector2(); let bajada=null;
  function bajoPuntero(ev){
    const r=renderer.domElement.getBoundingClientRect();
    puntero.set(((ev.clientX-r.left)/r.width)*2-1, -((ev.clientY-r.top)/r.height)*2+1);
    ray.setFromCamera(puntero,camara);
    const objetos=nodos.map(n=>n.nucleo).concat(nodos.map(n=>n.brillo));
    let h=ray.intersectObjects(objetos,false)[0];
    if(h) return {tipo:'nodo',i:h.object.userData.i};
    h=ray.intersectObjects(hilos.map(x=>x.linea),false)[0];
    if(h) return {tipo:'hilo',k:h.object.userData.k};
    return null;
  }
  const mismo=(a,b)=> (!a&&!b) || (a&&b&&a.tipo===b.tipo&&a.i===b.i&&a.k===b.k);
  const lienzo=etiquetas.domElement;
  lienzo.addEventListener('pointermove',ev=>{ if(bajada) return; const s=bajoPuntero(ev); lienzo.style.cursor=s?'pointer':''; if(!mismo(s,sobre)){ sobre=s; if(!seleccion){ aplicarEstado(); alSeleccionar&&alSeleccionar(describir(s),false); } } });
  lienzo.addEventListener('pointerdown',ev=>{ bajada={x:ev.clientX,y:ev.clientY}; });
  lienzo.addEventListener('pointerup',ev=>{ if(!bajada) return; const d=Math.hypot(ev.clientX-bajada.x,ev.clientY-bajada.y); bajada=null; if(d>6) return; const s=bajoPuntero(ev); seleccion=mismo(s,seleccion)?null:s; sobre=null; aplicarEstado(); alSeleccionar&&alSeleccionar(describir(seleccion),true); });
  lienzo.addEventListener('pointerleave',()=>{ if(sobre&&!seleccion){ sobre=null; aplicarEstado(); alSeleccionar&&alSeleccionar(null,false); } });
  function describir(s){ if(!s) return null; if(s.tipo==='nodo') return {tipo:'nodo',p:lista[s.i],i:s.i}; return {tipo:'hilo',v:vinculos[s.k],k:s.k}; }

  /* ---------- tamaño ---------- */
  function redimensionar(){
    const w=contenedor.clientWidth, h=contenedor.clientHeight; if(!w||!h) return;
    camara.aspect=w/h; camara.updateProjectionMatrix();
    renderer.setSize(w,h); compositor.setSize(w,h); etiquetas.setSize(w,h);
    bloom.resolution.set(w,h); hilos.forEach(x=>x.mat.resolution.set(w,h));
  }
  new ResizeObserver(redimensionar).observe(contenedor); redimensionar();

  /* ---------- bucle ---------- */
  let vivo=true;
  function cuadro(){
    if(!vivo) return; requestAnimationFrame(cuadro);
    const dt=Math.min(reloj.getDelta(),.05), t=reloj.elapsedTime;
    fondo.rotation.y+=dt*.004;
    nodos.forEach((n,i)=>{
      const f=i*1.7; n.grupo.position.set(P[i].x+.06*Math.sin(t*.45+f), P[i].y+.05*Math.cos(t*.38+f*1.3), P[i].z+.06*Math.sin(t*.4+f*.7));
      if(n.pulso){ const s=n.base*(1+.22*Math.sin(t*2.4+f)); n.brillo.scale.set(s,s,1); }
      if(n.aro){ n.aro.rotation.y=t*.6; n.aro.rotation.x=Math.sin(t*.4)*.5; }
    });
    if(nodos.length){ // los hilos siguen a las estrellas que respiran
      hilos.forEach(h=>{ const a=nodos[h.v.i].grupo.position, b=nodos[h.v.j].grupo.position; const medio=a.clone().add(b).multiplyScalar(.5); const control=medio.clone().multiplyScalar(.55); control.y=medio.y+.35; moverLinea(h.linea.geometry, new THREE.QuadraticBezierCurve3(a,control,b).getPoints(36)); });
    }
    animaciones=animaciones.filter(a=>{ a.t+=dt; const f=Math.max(0,Math.min(1,(a.t-a.retraso)/a.dur)); if(a.t>=a.retraso) a.paso(f<1?easeOut(f):1); if(f>=1){ a.fin&&a.fin(); return false; } return true; });
    controles.target.lerp(objetivo,.04); controles.update();
    compositor.render(); etiquetas.render(escena,camara);
  }
  const easeOut=f=>1-Math.pow(1-f,3);
  /* Escribe los puntos nuevos sobre el mismo búfer de la línea (el
     formato es inicio-fin por segmento) sin crear uno cada cuadro. */
  function moverLinea(geo, pts){
    const buf=geo.attributes.instanceStart.data; const arr=buf.array;
    for(let i=0;i<pts.length-1;i++){ const o=i*6; arr[o]=pts[i].x; arr[o+1]=pts[i].y; arr[o+2]=pts[i].z; arr[o+3]=pts[i+1].x; arr[o+4]=pts[i+1].y; arr[o+5]=pts[i+1].z; }
    buf.needsUpdate=true;
  }
  cuadro();

  /* ---------- lo que usa la aplicación ---------- */
  return {
    poner(nueva, {miId:yo, descubiertos:desc}={}){
      if(yo!==undefined) miId=yo; if(desc) descubiertos=new Set(desc);
      const f=nueva.map(p=>[p.id,p.actualizado||'',p.etapa||''].join('|')).join(';')+'#'+miId+'#'+[...descubiertos].join(',');
      if(f===firma) return;
      const fijo=seleccion&&seleccion.tipo==='nodo'?lista[seleccion.i]&&lista[seleccion.i].id:null;
      const soloDescubrir = firma && f.split('#')[0]===firma.split('#')[0] && f.split('#')[1]===firma.split('#')[1];
      firma=f; lista=nueva;
      if(soloDescubrir){ aplicarEstado(); return; }   // sólo cambió lo descubierto: no hay que reconstruir
      seleccion = fijo ? (()=>{ const i=lista.findIndex(p=>p.id===fijo); return i>=0?{tipo:'nodo',i}:null; })() : null;
      construir(); cielo();
    },
    cielo,
    fijar(id){ const i=lista.findIndex(p=>p.id===id); if(i<0) return; seleccion={tipo:'nodo',i}; aplicarEstado(); alSeleccionar&&alSeleccionar(describir(seleccion),true); },
    soltar(){ seleccion=null; sobre=null; aplicarEstado(); alSeleccionar&&alSeleccionar(null,true); },
    get vinculos(){ return vinculos; },
    get lista(){ return lista; },
    destruir(){ vivo=false; limpiar(); renderer.dispose(); },
  };
}
