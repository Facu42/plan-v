import { mkdir, readdir, readFile } from 'node:fs/promises';

const dir = new URL('../supabase/migrations/', import.meta.url);
await mkdir(dir, { recursive: true });
const files = (await readdir(dir)).filter((name) => name.endsWith('.sql'));
const unsafe = [];
for (const name of files) {
  const text = await readFile(new URL(name, dir), 'utf8');
  if (/DRAFT|DO NOT APPLY|NO CORRER/i.test(text)) unsafe.push(name);
}
if (unsafe.length) {
  console.error('Review-only SQL is in the migration chain:', unsafe.join(', '));
  process.exitCode = 1;
}
