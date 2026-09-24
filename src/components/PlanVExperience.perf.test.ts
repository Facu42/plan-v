import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourceUrl = new URL('./PlanVExperience.tsx', import.meta.url);

async function source() {
  return readFile(fileURLToPath(sourceUrl), 'utf8');
}

describe('PlanVExperience initial-load boundary', () => {
  it('loads patient and CRM surfaces only on demand', async () => {
    const component = await source();

    expect(component).toMatch(/const PatientApp = lazy\(\(\) => import\('\.\/patient\/PatientApp'\)\.then/);
    expect(component).toMatch(/const CrmDashboard = lazy\(\(\) => import\('\.\/crm\/CrmDashboard'\)\.then/);
    expect(component).toContain('<Suspense');
    expect(component).not.toContain("import { PatientApp } from './patient/PatientApp';");
    expect(component).not.toContain("import { CrmDashboard } from './crm/CrmDashboard';");
  });
});
