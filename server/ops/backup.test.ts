import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BACKUP_CONFIRM, backupRefusal, restoreRefusal, writeBackupPair, readBackupPair } from './backup.js';
import { liveRestoreRefusal } from './restore.js';

describe('respaldos conjuntos DB + Storage', () => {
  it('rehúsa producción, pacientes y URLs de aspecto productivo', () => {
    expect(backupRefusal({ appMode: 'production', confirm: BACKUP_CONFIRM, patientCount: 0 })).toMatch(/production/);
    expect(backupRefusal({ appMode: 'demo', confirm: 'no', patientCount: 0 })).toMatch(/BACKUP_CONFIRM/);
    expect(backupRefusal({ appMode: 'demo', confirm: BACKUP_CONFIRM, patientCount: null })).toMatch(/inspect/);
    expect(backupRefusal({ appMode: 'demo', confirm: BACKUP_CONFIRM, patientCount: 3 })).toMatch(/patients/);
    expect(backupRefusal({
      appMode: 'staging',
      confirm: BACKUP_CONFIRM,
      patientCount: 0,
      databaseUrl: 'postgres://x@db.prod.supabase.co/postgres',
    })).toMatch(/production/);
  });

  it('rehúsa restaurar si falta el par conjunto', () => {
    expect(restoreRefusal({
      appMode: 'demo',
      confirm: BACKUP_CONFIRM,
      patientCount: 0,
      pairComplete: false,
    })).toMatch(/joint DB \+ Storage/);
  });

  it('escribe y lee un par conjunto en un directorio descartable', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'plan-v-backup-'));
    try {
      const manifest = await writeBackupPair(dir, {
        appMode: 'demo',
        engine: 'memory',
        dbContents: '-- disposable\n',
        storageObjects: [{ bucket: 'meal-photos', name: 'pat-sofia/demo.png' }],
      });
      const files = await readdir(dir);
      expect(files.sort()).toEqual(['db.sql', 'manifest.json', 'storage.json']);
      const pair = await readBackupPair(dir);
      expect(pair.pairComplete).toBe(true);
      expect(pair.manifest.id).toBe(manifest.id);
      expect(pair.storage.objects).toHaveLength(1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('el CLI aborta en producción sin tocar un directorio', () => {
    expect(backupRefusal({
      appMode: 'production',
      confirm: BACKUP_CONFIRM,
      patientCount: 0,
    })).toMatch(/production/);
  });

  it('el CLI de restore no aplica SQL remoto aunque haya una URL', () => {
    expect(liveRestoreRefusal({
      APP_MODE: 'demo',
      BACKUP_CONFIRM: BACKUP_CONFIRM,
      DISPOSABLE_DATABASE_URL: 'postgres://example.supabase.co/postgres',
    })).toMatch(/Live restore is disabled/);
  });
});
