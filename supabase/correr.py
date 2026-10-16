# -*- coding: utf-8 -*-
"""
Constelación - Correr SQL en su proyecto de Supabase sin copy-paste

    python supabase/correr.py esquema.sql
    python supabase/correr.py "select count(*) from personas"

EL PROYECTO
Es el de Constelación, no el de LA PIZARRA. Su referencia se lee
de config.js (la URL https://<referencia>.supabase.co), así que no
hay forma de apuntarle a otra base por descuido.

EL TOKEN
Es el token de CUENTA de Supabase (empieza con sbp_), que vive en
datos/token_supabase.txt, fuera del repositorio (datos/ está en
.gitignore). Se lee para firmar la petición y nada más.

Si se revoca o se vence, se genera otro en
https://supabase.com/dashboard/account/tokens

LO QUE NO HACE SOLO
Cualquier instrucción que borre datos -- drop, delete, truncate,
alter ... drop column -- la detiene y la enseña antes. Para
correrla de todos modos hay que agregar --si-borra a propósito.
"""

import json
import os
import re
import sys
import urllib.error
import urllib.request

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOKEN = os.path.join(RAIZ, "datos", "token_supabase.txt")
CONFIG = os.path.join(RAIZ, "config.js")
API = "https://api.supabase.com/v1/projects/{}/database/query"

PELIGROSAS = [
    (r"\bdrop\s+table\b", "drop table"),
    (r"\bdrop\s+schema\b", "drop schema"),
    (r"\bdrop\s+database\b", "drop database"),
    (r"\btruncate\b", "truncate"),
    (r"\bdelete\s+from\b", "delete from"),
    (r"\bdrop\s+column\b", "drop column"),
]


def salir(mensaje):
    print("\n  " + mensaje.replace("\n", "\n  ") + "\n")
    sys.exit(1)


def proyecto():
    with open(CONFIG, "r", encoding="utf-8") as f:
        m = re.search(r"https://([a-z0-9]+)\.supabase\.co", f.read())
    if not m:
        salir("config.js todavía no tiene la URL del proyecto de Supabase.")
    return m.group(1)


def leer_token():
    if not os.path.exists(TOKEN):
        salir(
            "No encuentro el token.\n\n"
            "  1. Ve a https://supabase.com/dashboard/account/tokens\n"
            "  2. Generate new token. Nombre: constelacion\n"
            "  3. Cópialo y pégalo TAL CUAL, solo, en este archivo:\n\n"
            "       {}\n\n"
            "  Esa carpeta está fuera del repositorio: no se sube a GitHub.".format(TOKEN)
        )
    with open(TOKEN, "r", encoding="utf-8") as f:
        reales = [l.strip() for l in f if l.strip() and not l.strip().startswith("#")]
    t = reales[0] if reales else ""
    if not t:
        salir("Todavía no hay token en el archivo:\n\n    {}".format(TOKEN))
    if not t.startswith("sbp_"):
        salir("Eso no parece un token de cuenta de Supabase: empiezan con sbp_.")
    return t


def revisar(sql):
    limpio = re.sub(r"--[^\n]*", "", sql).lower()
    return [nombre for patron, nombre in PELIGROSAS if re.search(patron, limpio)]


def ejecutar(sql, token, ref):
    peticion = urllib.request.Request(
        API.format(ref),
        data=json.dumps({"query": sql}).encode("utf-8"),
        headers={
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
            # Sin User-Agent propio Cloudflare responde 403.
            "User-Agent": "constelacion/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(peticion, timeout=120) as r:
            return json.loads(r.read().decode("utf-8") or "[]")
    except urllib.error.HTTPError as e:
        cuerpo = e.read().decode("utf-8", "replace")
        try:
            cuerpo = json.loads(cuerpo).get("message", cuerpo)
        except Exception:
            pass
        if e.code in (401, 403):
            salir("Supabase rechazó el token ({}). Genera otro en\n"
                  "  https://supabase.com/dashboard/account/tokens\n"
                  "  y reemplaza el contenido de {}".format(e.code, TOKEN))
        salir("Supabase respondió error {}:\n\n  {}".format(e.code, cuerpo))
    except urllib.error.URLError as e:
        salir("No hubo forma de llegar a Supabase: {}".format(e.reason))


def tabla(filas):
    if not isinstance(filas, list) or not filas:
        return
    columnas = list(filas[0].keys())
    anchos = [max(len(c), max(len(str(f.get(c, ""))) for f in filas)) for c in columnas]
    print("  " + "  ".join(c.ljust(a) for c, a in zip(columnas, anchos)))
    print("  " + "  ".join("-" * a for a in anchos))
    for f in filas:
        print("  " + "  ".join(str(f.get(c, "")).ljust(a) for c, a in zip(columnas, anchos)))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    a_proposito = "--si-borra" in sys.argv
    if not args:
        salir("Dime qué correr:\n\n    python supabase/correr.py esquema.sql\n"
              "    python supabase/correr.py \"select count(*) from personas\"")
    que = args[0]
    ruta = que if os.path.exists(que) else os.path.join(os.path.dirname(os.path.abspath(__file__)), que)
    if os.path.exists(ruta):
        with open(ruta, "r", encoding="utf-8") as f:
            sql = f.read()
        print("\n  archivo: {}".format(os.path.basename(ruta)))
    else:
        sql = que
        print("\n  sql: {}".format(sql[:70]))

    peligros = revisar(sql)
    if peligros and not a_proposito:
        salir("Esto borra cosas ({}). Si es a propósito, agrega --si-borra."
              .format(", ".join(peligros)))

    ref = proyecto()
    print("  proyecto: {}".format(ref))
    resultado = ejecutar(sql, leer_token(), ref)
    tabla(resultado)
    print("\n  Listo.\n")


if __name__ == "__main__":
    main()
