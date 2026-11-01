import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';

const script = readFileSync(new URL('../../scripts/product-browser.local.mjs', import.meta.url), 'utf8');
const phase = script.slice(script.indexOf("phase='consulta en curso'"));
const sequence = phase.slice(phase.indexOf("await B('reload')"), phase.indexOf("check(true,'paciente mantiene"));

it.each(['2026-10-31', '2026-11-01'])('abre el día real de la consulta en curso %s después de recargar', async day => {
  let month = '2026-11';
  let selected = '2026-11-01';
  await runInNewContext(`(async()=>{${sequence}})()`, {
    ongoing: { day },
    B: async (command: string, selector?: string, value?: string) => {
      if (command === 'fill' && selector === '[aria-label="Elegir mes"]') month = value!;
      if (command === 'click' && selector === `[data-calendar-date="${day}"]`) {
        expect(month).toBe(day.slice(0, 7));
        selected = day;
      }
      return 'true';
    },
    until: async () => { expect(selected).toBe(day); },
    check: (value: boolean) => { expect(value).toBe(true); },
  });
});
