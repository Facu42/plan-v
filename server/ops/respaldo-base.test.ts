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
});
