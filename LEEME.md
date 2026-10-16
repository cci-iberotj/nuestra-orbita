# Nuestra Órbita
### El mapa de afinidades del equipo · Diseño y Medios, IBERO Tijuana

Cada quien del equipo es una estrella en una bóveda 3D: alrededor del
anillo va su signo, en altura su lado emocional, y brilla con el color
de su elemento. Los hilos entre estrellas son qué tanto se mueven dos
personas la una a la otra (grosor) y cómo se llevan (color). La Luna y
los planetas de hoy recorren el anillo y encienden a quien tocan.

Es cosa del equipo, no herramienta de trabajo: **no vive en LA PIZARRA
ni comparte con ella base, clave ni dirección.** Y está escrito para
quien no sabe nada de horóscopos: todo en llano, con recorrido y glosario.

---

## Cómo entrar

# https://cci-iberotj.github.io/nuestra-orbita/

Sin clave general. Cada quien crea su estrella con su **nombre o apodo y
un PIN de cuatro números**; el navegador lo recuerda y desde otro
teléfono se entra con el mismo nombre y PIN. Quien lo olvide lo cambia
desde la base (abajo). No hay correo ni contraseña.

Sin sesión la página enseña un **mapa de muestra** con ocho personas
inventadas (llevan un punto tras el nombre).

## El alta, por pasos

1. Nombre o apodo + PIN.
2. Fecha de nacimiento (lo único indispensable).
3. ¿Sabes a qué hora? Sí exacta · más o menos (madrugada, mañana, tarde,
   noche) · no. Con «más o menos» el lado emocional sale casi exacto.
4. Ciudad (sólo si dio hora exacta: es lo que da la primera impresión).
5. Cómo te hablamos (ella / él / elle) y qué tanto sabes de esto
   (decide si el recorrido sale solo).
6. Tres palabras que te describan: al terminar, el mapa las compara con
   lo que dice la carta.

La estrella **crece en tres etapas**: fecha → hora → hora exacta y ciudad.
Los hilos **se descubren** tocándolos (o tocando la estrella de alguien y
«Descubrir nuestro hilo»); el panel «tu estrella» lleva la cuenta.

«Mi perfil» (arriba a la derecha) corrige todo, cambia el PIN, cierra la
sesión en ese navegador o borra la estrella.

---

## Dónde viven los datos

En un proyecto de Supabase **propio** de Nuestra Órbita (`config.js` trae
la referencia). Una tabla, `personas`, que no se puede leer ni escribir
directo desde el navegador: todo pasa por funciones que piden el código
de sesión (lo que se recibe al registrarse o al entrar con nombre + PIN).
El PIN se guarda cifrado. Está explicado en `supabase/esquema.sql`.

Correr SQL contra esa base, sin entrar al tablero de Supabase:

    python supabase/correr.py esquema.sql --si-borra
    python supabase/correr.py "select nombre, ciudad, creado from personas"

Necesita el token de cuenta en `datos/token_supabase.txt` (la carpeta
`datos/` no se sube a GitHub). El script se niega a correr cualquier
cosa que borre, salvo que se le agregue `--si-borra`.

### Reiniciar el PIN de alguien

    python supabase/correr.py "select cambiar_pin(codigo, '1234') from personas where nombre_clave = 'apodo'"

---

## Publicar cambios

    git add -A
    git commit -m "qué cambió"
    python empujar.py

`empujar.py` sube por la API de GitHub (la red de IBERO bloquea
github.com pero no api.github.com), igual que en LA PIZARRA. GitHub Pages
publica solo en cerca de un minuto; los `.js` se quedan en caché del
navegador hasta diez minutos.

---

## Archivos

| | |
|---|---|
| `index.html` | la página: mapa, entrada, alta por pasos, glosario, recorrido |
| `motor.js` | el cálculo: cartas, aspectos, intensidad (Discepolo), tono, tránsitos, etapas |
| `textos.js` | todo lo dicho en llano: puntos de la carta, vínculos, glosario, recorrido, las doce palabras |
| `mapa3d.js` | la bóveda en Three.js: anillo, estrellas, hilos, cielo de hoy, nacer |
| `app.js` | sesión, alta, paneles, descubrimientos, sondeo cada 15 s |
| `estilos.css` | estilos (noche siempre; sin ajustes para quien entra) |
| `config.js` | URL y llave publicable del proyecto de Supabase |
| `concepto.html` | el estudio de concepto original, con la explicación de todo |
| `supabase/esquema.sql` | tabla, funciones y permisos |
| `supabase/correr.py` | correr SQL desde aquí |
| `empujar.py` | publicar |

Cálculo en el navegador con [astronomy-engine](https://www.npmjs.com/package/astronomy-engine)
(MIT); 3D con [three.js](https://threejs.org) (MIT); ciudades con
[Open-Meteo](https://open-meteo.com/en/docs/geocoding-api) (sin llave).
