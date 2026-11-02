#!/usr/bin/env bash
# Vuelca la base, la cifra y comprueba que se puede restaurar en un Postgres vacío.
# No imprime la dirección de la base ni la clave.
set -euo pipefail
umask 077

modo="${1:-}"
raiz="$(cd "$(dirname "$0")/.." && pwd)"
trabajo="${RESPALDO_TRABAJO:-$(mktemp -d)}"
plano="$trabajo/respaldo.dump"
cifrado="${BACKUP_OUTPUT:-$raiz/respaldo.dump.enc}"
mkdir -p "$trabajo"

limpiar() {
  rm -f "$plano"
  if [ "$modo" = "probar" ]; then rm -f "$cifrado"; fi
}
trap limpiar EXIT

exigir() {
  command -v "$1" >/dev/null 2>&1 || { echo "Falta el programa $1." >&2; exit 1; }
}

cifrar() {
  local entrada="${1:-$plano}"
  if [ "${#BACKUP_ENCRYPTION_KEY}" -lt 16 ]; then
    echo "La clave de cifrado tiene que tener al menos 16 caracteres." >&2
    exit 1
  fi
  openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt \
    -in "$entrada" -out "$cifrado" -pass env:BACKUP_ENCRYPTION_KEY
}

descifrar() {
  local abierto="$trabajo/abierto"
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
    -in "$cifrado" -out "$abierto" -pass env:BACKUP_ENCRYPTION_KEY
  local firma
  firma="$(head -c 5 "$abierto" || true)"
  if [ "$firma" = "PGDMP" ]; then
    cp "$abierto" "$plano"
    rm -f "$trabajo/auth.dump"
  else
    tar -xf "$abierto" -C "$trabajo"
    cp "$trabajo/app.dump" "$plano"
  fi
  rm -f "$abierto"
}

preparar_restauracion() {
  # El volcado trae public, private y las filas de auth.users.
  # storage, extensions y el resto de auth no se vuelcan: son del proyecto
  # de Supabase. Sin estos huecos, una vista o una función no se puede crear.
  psql "$1" -v ON_ERROR_STOP=1 <<'SQL'
do $$
declare rol text;
begin
  foreach rol in array array[
    'anon', 'authenticated', 'authenticator',
    'supabase_auth_admin', 'supabase_storage_admin',
    'supabase_realtime_admin', 'dashboard_user', 'pgbouncer'
  ]
  loop
    if not exists (select 1 from pg_roles where rolname = rol) then
      execute format('create role %I nologin', rol);
    end if;
  end loop;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;
create schema if not exists auth;
create schema if not exists storage;
create schema if not exists extensions;
create schema if not exists realtime;
create schema if not exists supabase_functions;
create schema if not exists vault;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
create or replace function auth.role() returns text language sql stable as $$ select 'authenticated'::text $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
create or replace function auth.email() returns text language sql stable as $$ select null::text $$;
create table if not exists storage.buckets (
  id text primary key,
  name text,
  public boolean,
  file_size_limit bigint,
  allowed_mime_types text[]
);
create table if not exists storage.objects (
  id uuid primary key,
  bucket_id text,
  name text,
  owner uuid,
  created_at timestamptz,
  updated_at timestamptz,
  metadata jsonb
);
create or replace function storage.foldername(name text) returns text[]
  language sql immutable as $$ select string_to_array(name, '/') $$;
create or replace function storage.filename(name text) returns text
  language sql immutable as $$ select reverse(split_part(reverse(name), '/', 1)) $$;
create or replace function storage.extension(name text) returns text
  language sql immutable as $$ select reverse(split_part(reverse(storage.filename(name)), '.', 1)) $$;
SQL
}

argumentos_de_esquema() {
  local args="--schema=public"
  if [ "$(psql "$1" -Atqc "select 1 from pg_namespace where nspname = 'private'")" = "1" ]; then
    args="$args --schema=private"
  fi
  printf '%s' "$args"
}

volcar() {
  # La dirección queda en el entorno, no en los argumentos que se imprimen.
  local archivo="${3:-$plano}"
  pg_dump --format=custom --no-owner --no-acl --file="$archivo" ${2:-} "$1"
  if [ ! -s "$archivo" ]; then
    echo "El volcado salió vacío." >&2
    exit 1
  fi
}

volcar_cuentas() {
  # Sin las filas de auth.users, las claves de public (por ejemplo
  # notification_preferences) no se pueden crear. identities entra si existe.
  local args=()
  local tabla
  for tabla in users identities; do
    if [ "$(psql "$1" -Atqc "select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'auth' and c.relname = '${tabla}' and c.relkind = 'r'")" = "1" ]; then
      args+=("--table=auth.${tabla}")
    fi
  done
  rm -f "$trabajo/auth.dump"
  if [ "${#args[@]}" -eq 0 ]; then
    return 0
  fi
  pg_dump --format=custom --no-owner --no-acl --file="$trabajo/auth.dump" "${args[@]}" "$1"
  if [ ! -s "$trabajo/auth.dump" ]; then
    echo "El volcado de las cuentas salió vacío." >&2
    exit 1
  fi
}

empaquetar() {
  if [ -s "$trabajo/auth.dump" ]; then
    tar -C "$trabajo" -cf "$trabajo/paquete.tar" app.dump auth.dump
    printf '%s' "$trabajo/paquete.tar"
  else
    printf '%s' "$trabajo/app.dump"
  fi
}

restaurar() {
  local lista="$trabajo/lista.toc"
  # public ya existe en la base vacía. El resto de los schemas del volcado se crean.
  pg_restore --list "$plano" | grep -v 'SCHEMA - public ' > "$lista"
  # Las funciones en SQL nombran tablas de auth que no hace falta ejecutar ahora.
  PGOPTIONS="${PGOPTIONS:-} -c check_function_bodies=off" \
    pg_restore --use-list="$lista" --no-owner --no-acl --exit-on-error --dbname="$1" "$plano"
}

restaurar_cuentas() {
  # Carga auth.users (y identities) antes que public y private.
  # Deja afuera triggers y claves que apuntan a otras tablas de auth:
  # esas tablas no están en el volcado y el disparador vive en public.
  [ -s "$trabajo/auth.dump" ] || return 0
  local completa="$trabajo/auth-completa.toc"
  local lista="$trabajo/auth.toc"
  local una="$trabajo/auth-una.toc"
  pg_restore --list "$trabajo/auth.dump" > "$completa"
  : > "$lista"
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ""|";"*) printf '%s\n' "$line" >> "$lista"; continue ;;
    esac
    case "$line" in
      *" TRIGGER "*|*" POLICY "*|*" COMMENT "*|*" ACL "*|*" ROW SECURITY "*|*" RULE "*) continue ;;
    esac
    case "$line" in
      *" FK CONSTRAINT "*)
        printf '%s\n' "$line" > "$una"
        local sql ref
        sql="$(pg_restore --use-list="$una" -f - "$trabajo/auth.dump" 2>/dev/null || true)"
        ref="$(printf '%s\n' "$sql" | grep -oiE 'REFERENCES[[:space:]]+(ONLY[[:space:]]+)?[^ (]+' | head -1 || true)"
        case "$ref" in
          *users|*identities|*'"users"'|*'"identities"') printf '%s\n' "$line" >> "$lista" ;;
        esac
        ;;
      *) printf '%s\n' "$line" >> "$lista" ;;
    esac
  done < "$completa"
  PGOPTIONS="${PGOPTIONS:-} -c check_function_bodies=off" \
    pg_restore --use-list="$lista" --no-owner --no-acl --exit-on-error --dbname="$1" "$trabajo/auth.dump"
}

ciclo_aplicacion() {
  local origen="$1"
  local destino="$2"
  volcar "$origen" "$(argumentos_de_esquema "$origen")" "$trabajo/app.dump"
  volcar_cuentas "$origen"
  cifrar "$(empaquetar)"
  rm -f "$trabajo/app.dump" "$trabajo/paquete.tar" "$plano"
  descifrar
  preparar_restauracion "$destino"
  restaurar_cuentas "$destino"
  restaurar "$destino"
}

probar() {
  exigir pg_dump
  exigir pg_restore
  exigir psql
  exigir openssl
  local origen="${ORIGEN_DATABASE_URL:?Falta ORIGEN_DATABASE_URL}"
  local destino="${RESTORE_DATABASE_URL:?Falta RESTORE_DATABASE_URL}"
  if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
    BACKUP_ENCRYPTION_KEY="$(openssl rand -base64 24)"
    export BACKUP_ENCRYPTION_KEY
  fi
  psql "$origen" -v ON_ERROR_STOP=1 <<'SQL'
create table if not exists respaldo_prueba(id int primary key, nota text);
insert into respaldo_prueba(id, nota) values (1, 'anda')
on conflict (id) do update set nota = excluded.nota;
SQL
  local admin="${origen%/*}/postgres"
  psql "$admin" -v ON_ERROR_STOP=1 -c "drop database if exists restauracion;"
  psql "$admin" -v ON_ERROR_STOP=1 -c "create database restauracion;"
  volcar "$origen"
  cifrar
  rm -f "$plano"
  descifrar
  restaurar "$destino"
  local nota
  nota="$(psql "$destino" -Atc "select nota from respaldo_prueba where id = 1")"
  if [ "$nota" != "anda" ]; then
    echo "La restauración no trajo la fila de prueba." >&2
    exit 1
  fi
  echo "Restauración de prueba ok."
}

produccion() {
  if [ -z "${SUPABASE_DB_URL:-}" ]; then
    echo "Falta el secreto SUPABASE_DB_URL. No se volcó nada." >&2
    exit 1
  fi
  if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
    echo "Falta el secreto BACKUP_ENCRYPTION_KEY. No se volcó nada." >&2
    exit 1
  fi
  case "$SUPABASE_DB_URL" in
    *supabase.co*|*pooler.supabase.com*) ;;
    *) echo "SUPABASE_DB_URL no es una base de Supabase. No se volcó nada." >&2; exit 1 ;;
  esac
  case "$SUPABASE_DB_URL" in
    *:6543*|*:6543/*) echo "El puerto 6543 no sirve para pg_dump. Usá la conexión directa o el pooler de sesión." >&2; exit 1 ;;
  esac
  exigir pg_dump
  exigir pg_restore
  exigir psql
  exigir openssl
  local destino="${RESTORE_DATABASE_URL:?Falta RESTORE_DATABASE_URL}"
  if ! ciclo_aplicacion "$SUPABASE_DB_URL" "$destino"; then
    echo "La restauración falló. El archivo cifrado quedó para guardarlo." >&2
    exit 1
  fi
  local tablas
  tablas="$(psql "$destino" -Atc "select count(*) from pg_tables where schemaname = 'public'")"
  if [ "${tablas:-0}" -lt 1 ]; then
    echo "La restauración no creó tablas." >&2
    exit 1
  fi
  echo "Restauración ok: ${tablas} tablas."
}

ensayar() {
  # El mismo volcado que producción (public y private) contra una base local.
  # No toca Supabase. Lo usa la prueba que imita la vista de patient_goal_updates.
  exigir pg_dump
  exigir pg_restore
  exigir psql
  exigir openssl
  local origen="${ORIGEN_DATABASE_URL:?Falta ORIGEN_DATABASE_URL}"
  local destino="${RESTORE_DATABASE_URL:?Falta RESTORE_DATABASE_URL}"
  if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
    BACKUP_ENCRYPTION_KEY="$(openssl rand -base64 24)"
    export BACKUP_ENCRYPTION_KEY
  fi
  ciclo_aplicacion "$origen" "$destino"
  echo "Restauración de ensayo ok."
}

case "$modo" in
  probar) probar ;;
  produccion) produccion ;;
  ensayar) ensayar ;;
  *) echo "Uso: scripts/respaldo-base.sh probar|produccion|ensayar" >&2; exit 2 ;;
esac
