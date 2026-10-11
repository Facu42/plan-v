import { pathToFileURL } from 'node:url';
import pg from 'pg';
import {
  assertLocalDatabaseUrl,
  formatPublicViewGrantReport,
  openMigratedDatabase,
  publicViewGrantProblems,
} from './public-view-grants.js';

const rehearse = process.argv.includes('--rehearse-failure');

async function database() {
  const configured = process.env.CHECK_VIEWS_DATABASE_URL;
  if (rehearse && configured) {
    throw new Error('El ensayo de una vista mala solo corre en la base temporal de prueba.');
  }
  if (configured) {
    const connectionString = assertLocalDatabaseUrl(configured);
    const pool = new pg.Pool({ connectionString, max: 1 });
    return {
      query: (sql: string, params?: unknown[]) => pool.query(sql, params),
      close: () => pool.end(),
    };
  }
  const db = await openMigratedDatabase();
  if (rehearse) {
    await db.exec(`
      create view public.demo_bad_patient_view as
        select id, user_id from public.patients;
      grant insert, update, delete on public.demo_bad_patient_view to anon, authenticated;
    `);
  }
  return { query: db.query.bind(db), close: () => db.close() };
}

async function main() {
  const db = await database();
  try {
    const problems = await publicViewGrantProblems(db);
    const report = formatPublicViewGrantReport(problems);
    if (rehearse) {
      if (!problems.some((problem) => problem.includes('public.demo_bad_patient_view'))) {
        console.error('El ensayo no detectó la vista mala.');
        process.exitCode = 1;
        return;
      }
      console.error(report);
      process.exitCode = 1;
      return;
    }
    if (problems.length) {
      console.error(report);
      process.exitCode = 1;
      return;
    }
    console.log(report);
  } finally {
    await db.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'error';
    console.error(message.replace(/postgres(?:ql)?:\/\/\S+/gi, '[URL omitida]'));
    process.exitCode = 1;
  });
}
