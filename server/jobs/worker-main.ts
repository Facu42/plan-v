import { pathToFileURL } from 'node:url';
import { startJobWorker } from './worker.js';

const isMainModule = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  startJobWorker();
  console.log('Plan V worker en marcha (cola durable, sin Redis).');
}
