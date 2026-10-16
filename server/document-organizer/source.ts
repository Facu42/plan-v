import { createHash } from 'node:crypto';
import type { OrganizerItem } from '../../src/types/document-organizer.js';
function canonical(value:unknown):unknown {if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,v])=>[key,canonical(v)]));return value;}
export const documentSourceHash=(items:OrganizerItem[])=>createHash('sha256').update(JSON.stringify(canonical(items))).digest('hex');
