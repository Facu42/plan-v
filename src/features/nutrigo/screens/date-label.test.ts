import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { dateLabel } from './date-label';

describe('fechas civiles e instantes del seguimiento', () => {
  it.each(['America/Argentina/Buenos_Aires', 'America/Los_Angeles', 'Asia/Tokyo'])('conserva el día de una medida o un plan en %s', zone => {
    const script = "import { dateLabel } from './src/features/nutrigo/screens/date-label.ts'; console.log(JSON.stringify({ civil: dateLabel('2026-10-03'), instant: dateLabel('2026-10-03T01:00:00Z') }));";
    const result = JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', script], { env: { ...process.env, TZ: zone }, encoding: 'utf8' }));
    expect(result.civil).toBe('3/10/2026');
    expect(result.instant).toBe(zone === 'Asia/Tokyo' ? '3/10/2026' : '2/10/2026');
  });
  it('conserva valores inválidos en lugar de fabricar una fecha', () => {
    expect(dateLabel('sin fecha')).toBe('sin fecha');
    expect(dateLabel('2026-02-30')).toBe('2026-02-30');
  });
});
