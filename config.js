/* ═══════════════════════════════════════════════════════════
   Nuestra Órbita · Configuración

   Estas líneas son públicas a propósito: la llave publicable de
   Supabase está hecha para vivir en el navegador de cualquiera.
   Lo que protege los datos es la base: la tabla no se puede leer
   ni escribir directo; sólo a través de funciones que piden la
   clave del equipo (para ver) o el código personal (para editar
   o borrar lo propio).

   Este proyecto de Supabase es PROPIO de Nuestra Órbita. No es el
   de LA PIZARRA ni comparte nada con él.
   ═══════════════════════════════════════════════════════════ */
'use strict';

const CONFIG = {
  supabase: {
    url:   'https://hypibsmfnqyylkieluwu.supabase.co',
    llave: 'sb_publishable_BuzCRgmeE0PTkSo8XeBuGA_f47hGBBh',
  },
  /* Cada cuántos milisegundos se vuelve a leer la tabla para que
     aparezca quien se acaba de registrar. */
  sondeo: 15000,
  /* La sube publicar.py en cada publicación; se ve abajo a la
     izquierda y hace que el navegador pida los archivos nuevos. */
  version: '2.7',
};
