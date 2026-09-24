import pg from 'pg';
import { spawnSync } from 'node:child_process';

export function disposableDatabaseUrl() {
  return process.env.DISPOSABLE_DATABASE_URL ?? '';
}

export function createDisposableClient(url: string) {
  const pool = new pg.Pool({ connectionString: url, max: 4 });

  async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(sql: string, params: unknown[] = []) {
    return pool.query<T>(sql, params);
  }

  async function asUser<T extends pg.QueryResultRow = pg.QueryResultRow>(user: string, sql: string, params: unknown[] = []) {
    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query('set local role authenticated');
      await client.query('select set_config(\'request.jwt.claim.sub\', $1, true)', [user]);
      const result = await client.query<T>(sql, params);
      await client.query('commit');
      return result.rows;
    } catch (error) {
      await client.query('rollback').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async function rpc(user: string, name: string, args: unknown[] = []) {
    const placeholders = args.map((_, index) => `$${index + 1}`).join(',');
    const rows = await asUser<{ result: unknown }>(user, `select public.${name}(${placeholders}) as result`, args);
    return rows[0]?.result;
  }

  return { pool, query, asUser, rpc };
}

export async function restartDisposablePostgres(url: string) {
  const container = process.env.DISPOSABLE_PG_CONTAINER || 'plan-v-disposable';
  const result = spawnSync('sudo', ['docker', 'restart', container], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'docker restart failed');
  }
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const ready = spawnSync('sudo', ['docker', 'exec', container, 'pg_isready', '-U', 'planv', '-d', 'planv_disposable'], { encoding: 'utf8' });
    if (ready.status === 0) {
      const client = createDisposableClient(url);
      await client.query('select 1');
      return client;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error('disposable postgres did not come back after restart');
}
