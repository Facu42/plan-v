import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';

export const BACKUP_CONFIRM = 'I_UNDERSTAND_DISPOSABLE_ONLY';

export type BackupGuardInput = {
  appMode?: string;
  confirm?: string;
  patientCount: number | null;
  databaseUrl?: string;
};

export type BackupPair = {
  id: string;
  created_at: string;
  app_mode: string;
  db: { file: string; engine: 'postgres' | 'memory' };
  storage: { file: string; object_count: number };
};

export function backupRefusal(input: BackupGuardInput): string | null {
  if (input.appMode === 'production') return 'Refusing backup while APP_MODE=production.';
  if (input.confirm !== BACKUP_CONFIRM) return 'Set BACKUP_CONFIRM=I_UNDERSTAND_DISPOSABLE_ONLY.';
  if (input.patientCount == null) return 'Could not inspect public.patients.';
  if (input.patientCount > 0) return `Refusing backup: public.patients already has ${input.patientCount} row(s).`;
  if (input.databaseUrl && /prod(?:uction)?/i.test(input.databaseUrl)) {
    return 'Refusing a database URL that looks like production.';
  }
  return null;
}

export function restoreRefusal(input: BackupGuardInput & { pairComplete: boolean }): string | null {
  const base = backupRefusal(input);
  if (base) return base.replace('backup', 'restore');
  if (!input.pairComplete) return 'Restore requires the joint DB + Storage pair (manifest, db snapshot and storage inventory).';
  return null;
}

export function isCompletePair(manifest: BackupPair, files: Iterable<string>) {
  const set = new Set(files);
  return set.has('manifest.json') && set.has(manifest.db.file) && set.has(manifest.storage.file);
}

export async function writeBackupPair(directory: string, input: {
  appMode: string;
  engine: 'postgres' | 'memory';
  dbContents: string;
  storageObjects: Array<{ bucket: string; name: string }>;
}) {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const manifest: BackupPair = {
    id,
    created_at: createdAt,
    app_mode: input.appMode,
    db: { file: 'db.sql', engine: input.engine },
    storage: { file: 'storage.json', object_count: input.storageObjects.length },
  };
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(join(directory, 'db.sql'), input.dbContents.endsWith('\n') ? input.dbContents : `${input.dbContents}\n`);
  await writeFile(join(directory, 'storage.json'), `${JSON.stringify({
    backup_id: id,
    objects: input.storageObjects,
  }, null, 2)}\n`);
  return manifest;
}

export async function readBackupPair(directory: string) {
  const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8')) as BackupPair;
  const db = await readFile(join(directory, manifest.db.file), 'utf8');
  const storage = JSON.parse(await readFile(join(directory, manifest.storage.file), 'utf8')) as {
    backup_id: string;
    objects: Array<{ bucket: string; name: string }>;
  };
  const pairComplete = isCompletePair(manifest, ['manifest.json', manifest.db.file, manifest.storage.file])
    && storage.backup_id === manifest.id;
  return { manifest, db, storage, pairComplete };
}

const isMainModule = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  const target = process.argv[2];
  const reason = backupRefusal({
    appMode: process.env.APP_MODE,
    confirm: process.env.BACKUP_CONFIRM,
    patientCount: 0,
    databaseUrl: process.env.BACKUP_DATABASE_URL,
  });
  if (reason) {
    console.error(reason);
    process.exit(1);
  }
  if (!target) {
    console.error('usage: tsx server/ops/backup.ts <directory>');
    process.exit(1);
  }
  if (process.env.BACKUP_DATABASE_URL) {
    console.error('Live database dump is disabled in this command. Use a disposable empty schema with apply:disposable first; this CLI only writes a joint inventory in demo/test.');
    process.exit(1);
  }
  const manifest = await writeBackupPair(target, {
    appMode: process.env.APP_MODE || 'demo',
    engine: 'memory',
    dbContents: '-- Plan V demo snapshot. No Postgres dump. Do not apply this file to a project with patients.\n',
    storageObjects: [],
  });
  console.log(`Backup pair written: ${target} (${manifest.id})`);
}
