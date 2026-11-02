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
  if [ "${#BACKUP_ENCRYPTION_KEY}" -lt 16 ]; then
    echo "La clave de cifrado tiene que tener al menos 16 caracteres." >&2
    exit 1
  fi
  openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt \
    -in "$plano" -out "$cifrado" -pass env:BACKUP_ENCRYPTION_KEY
}

descifrar() {
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
    -in "$cifrado" -out "$plano" -pass env:BACKUP_ENCRYPTION_KEY
}

preparar_restauracion() {
  psql "$1" -v ON_ERROR_STOP=1 <<'SQL'
create extension if not exists pgcrypto;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
create schema if not exists auth;
create schema if not exists extensions;
create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
create or replace function auth.role() returns text language sql stable as $$ select 'authenticated'::text $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
SQL
}

volcar() {
  # La dirección queda en el entorno, no en los argumentos que se imprimen.
  pg_dump --format=custom --no-owner --no-acl --file="$plano" ${2:-} "$1"
  if [ ! -s "$plano" ]; then
    echo "El volcado salió vacío." >&2
    exit 1
  fi
}

restaurar() {
  local lista="$trabajo/lista.toc"
  pg_restore --list "$plano" | grep -v 'SCHEMA - public' > "$lista"
  pg_restore --use-list="$lista" --no-owner --no-acl --exit-on-error --dbname="$1" "$plano"
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
  volcar "$SUPABASE_DB_URL" "--schema=public"
  cifrar
  rm -f "$plano"
  descifrar
  preparar_restauracion "$destino"
  if ! restaurar "$destino"; then
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

case "$modo" in
  probar) probar ;;
  produccion) produccion ;;
  *) echo "Uso: scripts/respaldo-base.sh probar|produccion" >&2; exit 2 ;;
esac
