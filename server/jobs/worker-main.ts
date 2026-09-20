import { pathToFileURL } from 'node:url';
import { startJobWorker } from './worker.js';
import { writeOpsLog } from '../ops/log.js';

const isMainModule = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  startJobWorker();
  writeOpsLog('info', 'worker_listen', { queue: 'durable-memory-or-pg' });
}
