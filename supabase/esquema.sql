-- ═══════════════════════════════════════════════════════════
--  Constelación · Esquema de la base
--  Equipo de Diseño y Medios · IBERO Tijuana
--
--      python supabase/correr.py esquema.sql
--
--  Se puede correr las veces que haga falta: todo es «if not
--  exists» o «create or replace».
--
--  CÓMO SE PROTEGEN LOS DATOS
--  La tabla personas tiene RLS encendido y NINGUNA política, y
--  además se le quita todo permiso a anon. Resultado: desde el
--  navegador no se puede leer ni escribir directo, ni con la
--  llave publicable. Todo pasa por funciones «security definer»:
--
--    ver_personas(clave)   lee el mapa; pide la clave del equipo
--    registrar(clave, …)   da de alta; devuelve el código personal
--    mi_registro(codigo)   lee lo propio; pide sólo el código
--    editar(codigo, …)     corrige lo propio
--    borrar(codigo)        quita lo propio
--
--  Se hizo así, y no con políticas que lean el código, porque una
--  política RLS no puede ver el código personal: el navegador no
--  tiene cómo mandárselo. La función sí lo recibe como parámetro.
--
--  LA CLAVE DEL EQUIPO vive en la tabla ajustes. Para cambiarla:
--      update ajustes set valor = 'la-nueva' where nombre = 'clave';
--  y avisar al equipo; al que tenga la vieja guardada se le vuelve
--  a pedir.
-- ═══════════════════════════════════════════════════════════

-- pgcrypto ya viene en Supabase, en el esquema «extensions»; por eso
-- abajo se llama extensions.gen_random_bytes y no a secas.
create extension if not exists pgcrypto with schema extensions;

-- ── 1. Tablas ──────────────────────────────────────────────
create table if not exists public.ajustes (
  nombre text primary key,
  valor  text not null
);
insert into public.ajustes (nombre, valor) values ('clave', 'estrellas')
  on conflict (nombre) do nothing;

create table if not exists public.personas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null check (length(trim(nombre)) between 1 and 40),
  fecha       date not null check (fecha >= date '1900-01-01' and fecha <= current_date),
  hora        time,                       -- opcional: sin ella no hay Ascendente
  ciudad      text,                       -- opcional: como la escribió Open-Meteo
  lat         double precision,
  lon         double precision,
  zona        text,                       -- zona horaria IANA, p. ej. America/Tijuana
  codigo      text not null unique,       -- 8 caracteres: la llave personal
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create or replace function public.tocar_actualizado()
returns trigger language plpgsql as $$
begin new.actualizado = now(); return new; end $$;
drop trigger if exists personas_actualizado on public.personas;
create trigger personas_actualizado before update on public.personas
  for each row execute function public.tocar_actualizado();

-- ── 2. Nadie entra directo ─────────────────────────────────
alter table public.personas enable row level security;
alter table public.ajustes  enable row level security;
revoke all on table public.personas from anon, authenticated;
revoke all on table public.ajustes  from anon, authenticated;

-- ── 3. Ayudantes (no expuestos) ────────────────────────────
create or replace function public.clave_ok(c text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from ajustes where nombre = 'clave' and valor = c)
$$;
revoke execute on function public.clave_ok(text) from public, anon, authenticated;

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

-- ── 4. Lo que usa la página ────────────────────────────────
-- Devuelve lo necesario para calcular, nunca el código de nadie.
create or replace function public.ver_personas(clave text)
returns table (id uuid, nombre text, fecha date, hora time, ciudad text,
               lat double precision, lon double precision, zona text,
               creado timestamptz, actualizado timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not clave_ok(ver_personas.clave) then
    raise exception 'clave incorrecta' using errcode = '28000';
  end if;
  return query
    select p.id, p.nombre, p.fecha, p.hora, p.ciudad, p.lat, p.lon, p.zona, p.creado, p.actualizado
    from personas p order by p.creado;
end $$;

create or replace function public.registrar(
  clave text, nombre text, fecha date, hora time default null, ciudad text default null,
  lat double precision default null, lon double precision default null, zona text default null)
returns json language plpgsql volatile security definer set search_path = public as $$
declare nuevo personas%rowtype;
begin
  if not clave_ok(registrar.clave) then
    raise exception 'clave incorrecta' using errcode = '28000';
  end if;
  insert into personas (nombre, fecha, hora, ciudad, lat, lon, zona, codigo)
  values (trim(registrar.nombre), registrar.fecha, registrar.hora, nullif(trim(registrar.ciudad), ''),
          registrar.lat, registrar.lon, nullif(trim(registrar.zona), ''), nuevo_codigo())
  returning * into nuevo;
  return json_build_object('id', nuevo.id, 'codigo', nuevo.codigo);
end $$;

create or replace function public.mi_registro(codigo text)
returns table (id uuid, nombre text, fecha date, hora time, ciudad text,
               lat double precision, lon double precision, zona text,
               creado timestamptz, actualizado timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.nombre, p.fecha, p.hora, p.ciudad, p.lat, p.lon, p.zona, p.creado, p.actualizado
  from personas p where p.codigo = upper(trim(mi_registro.codigo))
$$;

create or replace function public.editar(
  codigo text, nombre text, fecha date, hora time default null, ciudad text default null,
  lat double precision default null, lon double precision default null, zona text default null)
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare n int;
begin
  update personas p set
    nombre = trim(editar.nombre), fecha = editar.fecha, hora = editar.hora,
    ciudad = nullif(trim(editar.ciudad), ''), lat = editar.lat, lon = editar.lon,
    zona = nullif(trim(editar.zona), '')
  where p.codigo = upper(trim(editar.codigo));
  get diagnostics n = row_count;
  if n = 0 then raise exception 'código no encontrado' using errcode = 'P0002'; end if;
  return true;
end $$;

create or replace function public.borrar(codigo text)
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare n int;
begin
  delete from personas p where p.codigo = upper(trim(borrar.codigo));
  get diagnostics n = row_count;
  if n = 0 then raise exception 'código no encontrado' using errcode = 'P0002'; end if;
  return true;
end $$;

grant execute on function public.ver_personas(text) to anon;
grant execute on function public.registrar(text, text, date, time, text, double precision, double precision, text) to anon;
grant execute on function public.mi_registro(text) to anon;
grant execute on function public.editar(text, text, date, time, text, double precision, double precision, text) to anon;
grant execute on function public.borrar(text) to anon;

-- Para que PostgREST vea las funciones nuevas sin esperar.
notify pgrst, 'reload schema';
