import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const script = 'scripts/respaldo-base.sh';

function run(args: string[], env: Record<string, string>) {
  return execFileSync('bash', [script, ...args], {
    env: { PATH: process.env.PATH ?? '', ...env },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

describe('respaldo de la base', () => {
  it('no vuelca nada si falta el secreto de Supabase', () => {
    expect(() => run(['produccion'], { RESTORE_DATABASE_URL: 'postgres://local/restauracion' })).toThrow(/SUPABASE_DB_URL/);
  });

  it('no vuelca el puerto de transacción ni una base que no es de Supabase', () => {
    expect(() => run(['produccion'], {
      SUPABASE_DB_URL: 'postgres://u:x@db.ejemplo.supabase.co:6543/postgres',
      BACKUP_ENCRYPTION_KEY: 'clave-de-prueba-larga',
      RESTORE_DATABASE_URL: 'postgres://local/restauracion',
    })).toThrow(/6543/);
    expect(() => run(['produccion'], {
      SUPABASE_DB_URL: 'postgres://u:x@localhost:5432/postgres',
      BACKUP_ENCRYPTION_KEY: 'clave-de-prueba-larga',
      RESTORE_DATABASE_URL: 'postgres://local/restauracion',
    })).toThrow(/no es una base de Supabase/);
  });

  it('el script y el workflow no traen una dirección real', () => {
    const texto = `${readFileSync(script, 'utf8')}\n${readFileSync('.github/workflows/respaldo-base.yml', 'utf8')}`;
    expect(texto).toContain('SUPABASE_DB_URL');
    expect(texto).toContain('BACKUP_ENCRYPTION_KEY');
    expect(texto).not.toMatch(/postgres:\/\/[^@\s]+:[^@\s]+@db\.[a-z0-9]+\.supabase\.co/);
  });

  it('vuelca private y deja listos auth, storage y extensions', () => {
    const scriptText = readFileSync(script, 'utf8');
    expect(scriptText).toContain('--schema=private');
    expect(scriptText).toContain("nspname = 'private'");
    expect(scriptText).toContain('create schema if not exists auth');
    expect(scriptText).toContain('create schema if not exists storage');
    expect(scriptText).toContain('create schema if not exists extensions');
    expect(scriptText).toContain('create role service_role');
    expect(scriptText).toContain('--table=auth.${tabla}');
    expect(scriptText).toContain('for tabla in users identities');
    expect(scriptText).toContain('restaurar_cuentas "$destino"');
    const ciclo = scriptText.slice(scriptText.indexOf('ciclo_aplicacion()'));
    expect(ciclo.indexOf('restaurar_cuentas "$destino"')).toBeGreaterThan(-1);
    expect(ciclo.indexOf('restaurar_cuentas "$destino"')).toBeLessThan(ciclo.indexOf('restaurar "$destino"'));
    expect(scriptText).toContain('storage.foldername');
    expect(scriptText).toContain('check_function_bodies=off');
    expect(scriptText).toContain('argumentos_de_esquema');
  });

  it('el archivo cifrado se guarda aunque falle la restauración', () => {
    const workflow = readFileSync('.github/workflows/respaldo-base.yml', 'utf8');
    const paso = workflow.slice(workflow.indexOf('Guardar el archivo cifrado'));
    expect(paso).toContain('if: always()');
    expect(paso).toContain('respaldo.dump.enc');
  });

  it('el cliente y el contenedor de restauración son Postgres 17 en los dos jobs', () => {
    const workflow = readFileSync('.github/workflows/respaldo-base.yml', 'utf8');
    expect(workflow.match(/image: postgres:17/g)).toHaveLength(2);
    expect(workflow.match(/postgresql-client-17/g)?.length).toBeGreaterThanOrEqual(2);
    expect(workflow).toContain('apt.postgresql.org');
    expect(workflow).not.toContain('postgres:16');
    expect(workflow).not.toContain('postgresql-client-16');
    expect(workflow).not.toContain('postgresql-client)');
  });
});
