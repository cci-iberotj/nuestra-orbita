-- ═══════════════════════════════════════════════════════════
--  Nuestra Órbita · Esquema de la base (v2: nombre + PIN y perfil)
--  Equipo de Diseño y Medios · IBERO Tijuana
--
--      python supabase/correr.py esquema.sql --si-borra
--
--  (lleva --si-borra porque las funciones borrar() y el arranque
--  limpio traen «delete» y «drop»; correr.py los detiene por
--  defecto a propósito.)
--
--  CÓMO SE PROTEGEN LOS DATOS
--  La tabla personas tiene RLS encendido y NINGUNA política, y
--  además se le quita todo permiso a anon: desde el navegador no se
--  puede leer ni escribir directo. Todo pasa por funciones
--  «security definer» que piden el código de sesión (lo que recibe
--  el navegador al registrarse o al entrar con nombre + PIN):
--
--    registrar(nombre, pin, …perfil)   → {id, codigo}
--    entrar(nombre, pin)               → {id, codigo}
--    ver_personas(codigo)              el mapa, sin PIN ni perfil íntimo
--    mi_registro(codigo)               lo propio, completo
--    editar(codigo, …perfil)           corregir lo propio
--    cambiar_pin(codigo, pin)
--    descubrir(codigo, otro)           anota un hilo descubierto
--    marcar_recorrido(codigo)
--    borrar(codigo)
--
--  El PIN se guarda con bcrypt (pgcrypto); nunca en claro.
--  Quien olvide su PIN: python supabase/correr.py
--     "select cambiar_pin(codigo, '1234') from personas where nombre_clave = 'apodo'"
-- ═══════════════════════════════════════════════════════════

create extension if not exists pgcrypto with schema extensions;

-- ── 0. Arranque limpio desde la v1 (la tabla estaba vacía) ─────
drop function if exists public.registrar(text, text, date, time, text, double precision, double precision, text);
drop function if exists public.editar(text, text, date, time, text, double precision, double precision, text);
drop function if exists public.ver_personas(text);
drop function if exists public.mi_registro(text);
drop function if exists public.clave_ok(text);
drop table if exists public.ajustes;
drop table if exists public.personas cascade;

-- ── 1. Tabla ───────────────────────────────────────────────
create table public.personas (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null check (length(trim(nombre)) between 2 and 24),
  nombre_clave text generated always as (lower(trim(nombre))) stored unique,
  pin_hash     text not null,
  fecha        date not null check (fecha >= date '1900-01-01' and fecha <= current_date),
  hora_tipo    text not null default 'no' check (hora_tipo in ('exacta', 'aprox', 'no')),
  hora         time,                           -- sólo con hora_tipo = 'exacta'
  hora_franja  text check (hora_franja in ('madrugada', 'manana', 'tarde', 'noche')),
  ciudad       text,
  lat          double precision,
  lon          double precision,
  zona         text,                           -- zona horaria IANA
  pronombre    text not null default 'elle' check (pronombre in ('ella', 'el', 'elle')),
  nivel        text not null default 'nada' check (nivel in ('nada', 'algo', 'bastante')),
  palabras     text[] not null default '{}',   -- las tres con que se describe
  descubiertos uuid[] not null default '{}',   -- hilos que ya abrió
  recorrido    boolean not null default false, -- ya vio el recorrido
  codigo       text not null unique,           -- código de sesión, 8 caracteres
  creado       timestamptz not null default now(),
  actualizado  timestamptz not null default now()
);

create or replace function public.tocar_actualizado()
returns trigger language plpgsql as $$
begin new.actualizado = now(); return new; end $$;
drop trigger if exists personas_actualizado on public.personas;
create trigger personas_actualizado before update on public.personas
  for each row execute function public.tocar_actualizado();

-- ── 2. Nadie entra directo ─────────────────────────────────
alter table public.personas enable row level security;
revoke all on table public.personas from anon, authenticated;

-- ── 3. Ayudantes (no expuestos) ────────────────────────────
-- Código de 8 caracteres sin letras que se confundan (0/O, 1/I/L).
create or replace function public.nuevo_codigo()
returns text language plpgsql volatile security definer set search_path = public as $$
declare
  abc  constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  b    bytea;
  out_ text;
begin
  loop
    b := extensions.gen_random_bytes(8); out_ := '';
    for i in 0..7 loop
      out_ := out_ || substr(abc, (get_byte(b, i) % length(abc)) + 1, 1);
    end loop;
    exit when not exists (select 1 from personas where codigo = out_);
  end loop;
  return out_;
end $$;
revoke execute on function public.nuevo_codigo() from public, anon, authenticated;

-- Quién es el dueño de un código de sesión; si no existe, error.
create or replace function public.sesion(codigo text)
returns uuid language plpgsql stable security definer set search_path = public as $$
declare quien uuid;
begin
  select p.id into quien from personas p where p.codigo = upper(trim(sesion.codigo));
  if quien is null then
    raise exception 'sesión no válida' using errcode = '28000';
  end if;
  return quien;
end $$;
revoke execute on function public.sesion(text) from public, anon, authenticated;

create or replace function public.pin_valido(pin text)
returns boolean language sql immutable as $$ select pin ~ '^[0-9]{4}$' $$;
revoke execute on function public.pin_valido(text) from public, anon, authenticated;

-- ── 4. Lo que usa la página ────────────────────────────────
create or replace function public.registrar(
  nombre text, pin text, fecha date,
  hora_tipo text default 'no', hora time default null, hora_franja text default null,
  ciudad text default null, lat double precision default null, lon double precision default null, zona text default null,
  pronombre text default 'elle', nivel text default 'nada', palabras text[] default '{}')
returns json language plpgsql volatile security definer set search_path = public as $$
declare nuevo personas%rowtype;
begin
  if not pin_valido(registrar.pin) then
    raise exception 'el PIN son cuatro números' using errcode = '22023';
  end if;
  if exists (select 1 from personas p where p.nombre_clave = lower(trim(registrar.nombre))) then
    raise exception 'ese nombre ya está en el mapa; si eres tú, entra con tu PIN' using errcode = '23505';
  end if;
  insert into personas (nombre, pin_hash, fecha, hora_tipo, hora, hora_franja, ciudad, lat, lon, zona,
                        pronombre, nivel, palabras, codigo)
  values (trim(registrar.nombre), extensions.crypt(registrar.pin, extensions.gen_salt('bf')),
          registrar.fecha, registrar.hora_tipo,
          case when registrar.hora_tipo = 'exacta' then registrar.hora end,
          case when registrar.hora_tipo = 'aprox' then registrar.hora_franja end,
          nullif(trim(registrar.ciudad), ''), registrar.lat, registrar.lon, nullif(trim(registrar.zona), ''),
          coalesce(registrar.pronombre, 'elle'), coalesce(registrar.nivel, 'nada'),
          coalesce(registrar.palabras, '{}'), nuevo_codigo())
  returning * into nuevo;
  return json_build_object('id', nuevo.id, 'codigo', nuevo.codigo);
end $$;

create or replace function public.entrar(nombre text, pin text)
returns json language plpgsql volatile security definer set search_path = public as $$
declare quien personas%rowtype;
begin
  select * into quien from personas p where p.nombre_clave = lower(trim(entrar.nombre));
  if quien.id is null or quien.pin_hash <> extensions.crypt(entrar.pin, quien.pin_hash) then
    raise exception 'nombre o PIN incorrecto' using errcode = '28000';
  end if;
  return json_build_object('id', quien.id, 'codigo', quien.codigo);
end $$;

-- El mapa: lo que hace falta para calcular y dibujar; nada íntimo.
create or replace function public.ver_personas(codigo text)
returns table (id uuid, nombre text, fecha date, hora_tipo text, hora time, hora_franja text,
               ciudad text, lat double precision, lon double precision, zona text,
               pronombre text, creado timestamptz, actualizado timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  perform sesion(ver_personas.codigo);
  return query
    select p.id, p.nombre, p.fecha, p.hora_tipo, p.hora, p.hora_franja, p.ciudad, p.lat, p.lon, p.zona,
           p.pronombre, p.creado, p.actualizado
    from personas p order by p.creado;
end $$;

create or replace function public.mi_registro(codigo text)
returns table (id uuid, nombre text, fecha date, hora_tipo text, hora time, hora_franja text,
               ciudad text, lat double precision, lon double precision, zona text,
               pronombre text, nivel text, palabras text[], descubiertos uuid[], recorrido boolean,
               creado timestamptz, actualizado timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.nombre, p.fecha, p.hora_tipo, p.hora, p.hora_franja, p.ciudad, p.lat, p.lon, p.zona,
         p.pronombre, p.nivel, p.palabras, p.descubiertos, p.recorrido, p.creado, p.actualizado
  from personas p where p.codigo = upper(trim(mi_registro.codigo))
$$;

create or replace function public.editar(
  codigo text, nombre text, fecha date,
  hora_tipo text default 'no', hora time default null, hora_franja text default null,
  ciudad text default null, lat double precision default null, lon double precision default null, zona text default null,
  pronombre text default 'elle', nivel text default 'nada', palabras text[] default '{}')
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare quien uuid := sesion(editar.codigo);
begin
  if exists (select 1 from personas p where p.nombre_clave = lower(trim(editar.nombre)) and p.id <> quien) then
    raise exception 'ese nombre ya lo usa alguien más' using errcode = '23505';
  end if;
  update personas p set
    nombre = trim(editar.nombre), fecha = editar.fecha, hora_tipo = editar.hora_tipo,
    hora = case when editar.hora_tipo = 'exacta' then editar.hora end,
    hora_franja = case when editar.hora_tipo = 'aprox' then editar.hora_franja end,
    ciudad = nullif(trim(editar.ciudad), ''), lat = editar.lat, lon = editar.lon, zona = nullif(trim(editar.zona), ''),
    pronombre = coalesce(editar.pronombre, p.pronombre), nivel = coalesce(editar.nivel, p.nivel),
    palabras = coalesce(editar.palabras, p.palabras)
  where p.id = quien;
  return true;
end $$;

create or replace function public.cambiar_pin(codigo text, pin text)
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare quien uuid := sesion(cambiar_pin.codigo);
begin
  if not pin_valido(cambiar_pin.pin) then
    raise exception 'el PIN son cuatro números' using errcode = '22023';
  end if;
  update personas p set pin_hash = extensions.crypt(cambiar_pin.pin, extensions.gen_salt('bf')) where p.id = quien;
  return true;
end $$;

create or replace function public.descubrir(codigo text, otro uuid)
returns uuid[] language plpgsql volatile security definer set search_path = public as $$
declare quien uuid := sesion(descubrir.codigo); lista uuid[];
begin
  update personas p set descubiertos = array_append(p.descubiertos, descubrir.otro)
  where p.id = quien and not (descubrir.otro = any (p.descubiertos));
  select p.descubiertos into lista from personas p where p.id = quien;
  return lista;
end $$;

create or replace function public.marcar_recorrido(codigo text)
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare quien uuid := sesion(marcar_recorrido.codigo);
begin
  update personas p set recorrido = true where p.id = quien;
  return true;
end $$;

create or replace function public.borrar(codigo text)
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare quien uuid := sesion(borrar.codigo);
begin
  delete from personas p where p.id = quien;
  -- y que nadie se quede con un hilo «descubierto» hacia alguien que ya no está
  update personas p set descubiertos = array_remove(p.descubiertos, quien) where quien = any (p.descubiertos);
  return true;
end $$;

grant execute on function public.registrar(text, text, date, text, time, text, text, double precision, double precision, text, text, text, text[]) to anon;
grant execute on function public.entrar(text, text) to anon;
grant execute on function public.ver_personas(text) to anon;
grant execute on function public.mi_registro(text) to anon;
grant execute on function public.editar(text, text, date, text, time, text, text, double precision, double precision, text, text, text, text[]) to anon;
grant execute on function public.cambiar_pin(text, text) to anon;
grant execute on function public.descubrir(text, uuid) to anon;
grant execute on function public.marcar_recorrido(text) to anon;
grant execute on function public.borrar(text) to anon;

notify pgrst, 'reload schema';
