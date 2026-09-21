import { pathToFileURL } from 'node:url';
import { startJobWorker } from './worker.js';
import { writeOpsLog } from '../ops/log.js';
import { assertSecretBoundary, inspectSecrets } from '../ops/secrets.js';

const isMainModule = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  assertSecretBoundary(process.env);
  const secrets = inspectSecrets(process.env);
  if (!secrets.ok) {
    writeOpsLog('error', 'startup_refused', { missing: secrets.missing.join(',') || 'secret_boundary' });
    process.exit(1);
  }
  startJobWorker();
  writeOpsLog('info', 'worker_listen', { worker: 'external' });
}
