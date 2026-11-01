# Respaldos de la base

La base de Nutridash está en Supabase. Hay dos formas de recuperarla, y no se reemplazan.

## Lo que ya da Supabase

En el proyecto, Database → Backups.

- **Copia diaria.** Supabase guarda copias automáticas. En el plan gratis duran poco. En el plan Pro duran más. Se restaura el proyecto entero, no una tabla sola.
- **PITR (volver a un momento).** Es un extra de pago del plan Pro o superior. Guarda el diario de cambios y permite volver la base a un minuto elegido, dentro de la ventana que se contrató (por ejemplo 7 días). También restaura el proyecto entero. No está prendido hasta que Facundo lo contrate en el panel de Supabase. No se activa desde este repositorio.

Esas copias las administra Supabase. Si el proyecto se borra o la cuenta se cierra, no alcanzan.

## La copia de este repositorio

El workflow `.github/workflows/respaldo-base.yml` corre todos los días a las 03:30 de Argentina.

1. Hace `pg_dump` de la base, solo el esquema `public`.
2. Cifra el archivo (AES-256, la clave no está en el repo).
3. Lo restaura en un Postgres vacío de la misma corrida y comprueba que haya tablas.
4. Guarda solo el archivo cifrado como artifact de GitHub, 14 días.

En cada pull request corre la misma prueba con una base vacía de mentira. No usa secretos y no toca Supabase.

El archivo en claro se borra al terminar. No se commitea.

## Qué tiene que cargar Facundo

En GitHub → Settings → Secrets and variables → Actions. No van en el repo ni en Railway.

- `SUPABASE_DB_URL`: la cadena de conexión **directa** de Supabase (Database → Connection string → URI, puerto 5432). Tiene que incluir `sslmode=require`. El puerto 6543 (pooler de transacción) no sirve para `pg_dump`. El pooler de sesión, si el puerto no es 6543, sí.
- `BACKUP_ENCRYPTION_KEY`: una frase larga, de al menos 16 caracteres, inventada por él. Guardala también en el administrador de contraseñas. Sin esa frase no se puede abrir el archivo. Si se pierde, las copias de GitHub no se pueden leer.

Sin esos dos secretos, la corrida diaria falla y no hay copia. La prueba de cada PR sigue en verde.

## Cómo abrir una copia

1. Bajar el artifact `respaldo-supabase-…` de la corrida de Actions.
2. Descifrar. Exportá `BACKUP_ENCRYPTION_KEY` en esa terminal y no la pegues en el comando:

```bash
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in respaldo.dump.enc -out respaldo.dump -pass env:BACKUP_ENCRYPTION_KEY
```

3. Restaurar en un Postgres vacío de tu máquina, nunca en producción. `RESTORE_DATABASE_URL` es esa base local:

```bash
pg_restore --no-owner --no-acl --dbname="$RESTORE_DATABASE_URL" respaldo.dump
```

Eso trae datos de pacientes. No lo subas a ningún chat ni lo dejes en una carpeta compartida.

## Qué no hace

- No reemplaza el PITR si Facundo lo contrata: el PITR vuelve a un minuto; esta copia es una por día.
- No respalda los archivos de Storage (fotos). Solo la base.
- No se aplica solo. Nadie restaura producción desde este workflow.
