import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { getPatient, resetStore } from './store.js';

function jsonRequest(method: string, body: unknown) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

const todayId = () => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

describe('habit history API flow in memory mode', () => {
  beforeEach(() => {
    resetStore();
  });

  it('upserts today\'s habit log and keeps a single entry per day', async () => {
    const first = await app.request('/api/patients/pat-sofia/habits', jsonRequest('PATCH', { hydration: 5 }));
    const firstBody = await first.json();
    expect(first.status).toBe(200);

    const todayEntry = firstBody.patient.habit_logs.find((h: { date: string }) => h.date === todayId());
    expect(todayEntry.hydration).toBe(5);
    expect(firstBody.patient.hydration).toBe(5);

    const countAfterFirst = firstBody.patient.habit_logs.length;

    const second = await app.request('/api/patients/pat-sofia/habits', jsonRequest('PATCH', { energy: 'Tranquila' }));
    const secondBody = await second.json();
    expect(second.status).toBe(200);
    expect(secondBody.patient.habit_logs).toHaveLength(countAfterFirst);

    const merged = secondBody.patient.habit_logs.find((h: { date: string }) => h.date === todayId());
    expect(merged).toMatchObject({ hydration: 5, energy: 'Tranquila' });
    expect(secondBody.patient.energy).toBe('Tranquila');
    expect(secondBody.patient.adherence_why).toContain('Agua');

    const scoreBeforeSleep = secondBody.patient.adherence_score;
    const third = await app.request('/api/patients/pat-sofia/habits', jsonRequest('PATCH', { sleep_minutes: 450 }));
    const thirdBody = await third.json();
    expect(third.status).toBe(200);
    expect(thirdBody.patient.habit_logs).toHaveLength(countAfterFirst);
    expect(thirdBody.patient.habit_logs.find((h: { date: string }) => h.date === todayId())).toMatchObject({
      hydration: 5,
      energy: 'Tranquila',
      sleep_minutes: 450,
    });
    expect(thirdBody.patient.sleep_minutes).toBe(450);
    expect(thirdBody.patient.adherence_score).toBe(scoreBeforeSleep);
  });

  it('keeps older habit logs of the week for the adherence average', () => {
    const sofia = getPatient('pat-sofia')!;
    const dates = sofia.habit_logs.map((h) => h.date);
    expect(new Set(dates).size).toBe(dates.length);
    expect(sofia.habit_logs.length).toBeGreaterThanOrEqual(7);
    expect(dates).toContain(todayId());
  });
});
