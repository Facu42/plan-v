import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readBackupPair, restoreRefusal } from './backup.js';

export function liveRestoreRefusal(env: NodeJS.ProcessEnv = process.env) {
  if (env.RESTORE_DATABASE_URL || env.BACKUP_DATABASE_URL || env.DISPOSABLE_DATABASE_URL) {
    return 'Live restore is disabled. This command never applies SQL to a remote project.';
  }
  return null;
}

const isMainModule = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  const source = process.argv[2];
  const target = process.argv[3];
  if (!source || !target) {
    console.error('usage: tsx server/ops/restore.ts <backup-directory> <restore-report-directory>');
    process.exit(1);
  }
  const live = liveRestoreRefusal();
  if (live) {
    console.error(live);
    process.exit(1);
  }
  const pair = await readBackupPair(source);
  const reason = restoreRefusal({
    appMode: process.env.APP_MODE,
    confirm: process.env.BACKUP_CONFIRM,
    patientCount: 0,
    databaseUrl: process.env.RESTORE_DATABASE_URL,
    pairComplete: pair.pairComplete,
  });
  if (reason) {
    console.error(reason);
    process.exit(1);
  }
  await mkdir(target, { recursive: true });
  await writeFile(join(target, 'restore-report.json'), `${JSON.stringify({
    backup_id: pair.manifest.id,
    db_engine: pair.manifest.db.engine,
    storage_objects: pair.storage.objects.length,
    applied_remote_sql: false,
    applied_remote_storage: false,
    note: 'Ensayo de par conjunto. No se aplicó SQL ni Storage a un proyecto remoto.',
  }, null, 2)}\n`);
  console.log(`Restore rehearsal recorded: ${join(target, 'restore-report.json')}`);
}
