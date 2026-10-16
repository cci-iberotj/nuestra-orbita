# Constelación
### El mapa de afinidades del equipo · Diseño y Medios, IBERO Tijuana

Cada quien registra su fecha, hora y ciudad de nacimiento, y el equipo
aparece como una constelación: cada persona es una estrella en el grado
de su Sol y los hilos entre estrellas son la sinastría (grosor =
intensidad, color = tono). La Luna y los planetas de hoy recorren el
anillo y encienden a quien tocan.

Es cosa del equipo, no herramienta de trabajo: **no vive en LA PIZARRA
ni comparte con ella base, clave ni dirección.**

---

## Cómo entrar

# https://cci-iberotj.github.io/constelacion/

Pide la **clave del equipo** una sola vez; el navegador la recuerda.
Es la misma para todos y sólo sirve para ver el mapa.

## Registrarse

En el panel «Tu estrella»: nombre o apodo, fecha (obligatoria), hora
(si la sabes) y ciudad (escribe y elige de la lista). El propio
formulario dice qué se pierde sin hora o sin ciudad.

Al guardar aparece **tu enlace personal** (`?c=` + ocho letras). Con él
corriges o borras tu estrella desde cualquier dispositivo; no hay cuenta
ni contraseña. En el navegador donde te registraste queda guardado solo.

El mapa enseña signos y grados; la fecha y la hora no se muestran a nadie.

## Demostración

Mientras la tabla está vacía el mapa enseña ocho personas **inventadas**
(con un punto tras el nombre y un aviso). En cuanto alguien se registra,
desaparecen.

---

## Dónde viven los datos

En un proyecto de Supabase **propio** de Constelación (la referencia está
en `config.js`). Una tabla, `personas`, que no se puede leer ni escribir
directo desde el navegador: todo pasa por funciones que piden la clave
del equipo (para ver y para registrarse) o el código personal (para
corregir y borrar). Está explicado en `supabase/esquema.sql`.

Correr SQL contra esa base, sin entrar al tablero de Supabase:

    python supabase/correr.py esquema.sql
    python supabase/correr.py "select nombre, ciudad, creado from personas"

Necesita el token de cuenta en `datos/token_supabase.txt` (la carpeta
`datos/` no se sube a GitHub). El script se niega a correr cualquier
cosa que borre, salvo que se le agregue `--si-borra`.

### Cambiar la clave del equipo

    python supabase/correr.py "update ajustes set valor = 'la-nueva' where nombre = 'clave'"

A quien tenga la vieja guardada se le vuelve a pedir al instante.

---

## Publicar cambios

    git add -A
    git commit -m "qué cambió"
    python empujar.py

`empujar.py` sube por la API de GitHub (la red de IBERO bloquea
github.com pero no api.github.com), igual que en LA PIZARRA. GitHub Pages
publica solo en cerca de un minuto.

---

## Archivos

| | |
|---|---|
| `index.html` | la página: puerta, mapa y panel «Tu estrella» |
| `motor.js` | el cálculo: cartas, aspectos, intensidad (Discepolo), tono, tránsitos |
| `mapa.js` | el dibujo: anillo, estrellas, hilos, clima del día, animación de nacer |
| `app.js` | clave, lectura de la base, alta, enlace personal, sondeo cada 15 s |
| `estilos.css` | estilos |
| `config.js` | URL y llave publicable del proyecto de Supabase |
| `concepto.html` | el estudio de concepto original, con la explicación de todo |
| `supabase/esquema.sql` | tablas, funciones y permisos |
| `supabase/correr.py` | correr SQL desde aquí |
| `empujar.py` | publicar |

Cálculo en el navegador con [astronomy-engine](https://www.npmjs.com/package/astronomy-engine)
(MIT); ciudades con [Open-Meteo](https://open-meteo.com/en/docs/geocoding-api) (sin llave).
