import { useState } from 'react';
import type { Patient } from '../../types';
import { Icon, Mark } from '../shared/Icon';

export function PatientPlan({ patient }: { patient: Patient }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const shopping = [...new Set([...patient.todayPlan.map((m) => m.title), ...patient.weekPlan.flatMap((d) => d.meals.map((m) => m.title))])];

  const toggle = (item: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  return (
    <main className="patient-shell patient-subpage">
      <header className="patient-topbar">
        <div className="brand-lockup"><Mark /><span>Mi plan</span></div>
      </header>

      <section className="subpage-hero">
        <p className="eyebrow">Esta semana</p>
        <h1>Tu menú</h1>
        <p>Lo que Verónica armó para vos. Sin presión de perfección.</p>
      </section>

      <section className="plan-week">
        {patient.weekPlan.length > 0 ? patient.weekPlan.map((day) => (
          <article key={day.day} className="plan-day-card">
            <h3>{day.day}</h3>
            {day.meals.map((m) => (
              <p key={`${day.day}-${m.slot}`}><b>{m.slot}</b> · {m.title}</p>
            ))}
          </article>
        )) : (
          patient.todayPlan.map((m) => (
            <article key={m.slot} className="plan-day-card today-only">
              <h3>{m.slot} · hoy</h3>
              <p>{m.title}</p>
              <time>{m.time}</time>
            </article>
          ))
        )}
      </section>

      <section className="shopping-section">
        <div className="section-heading">
          <div><p className="eyebrow">Lista de compras</p><h2>Para esta semana</h2></div>
        </div>
        <ul className="shopping-list">
          {shopping.map((item) => (
            <li key={item}>
              <button type="button" className={checked.has(item) ? 'checked' : ''} onClick={() => toggle(item)}>
                <span className="check-box">{checked.has(item) && <Icon name="check" size={12} />}</span>
                {item}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="plan-b-banner">
        <Icon name="heart" size={18} />
        <div>
          <strong>Tu Plan B</strong>
          <p>{patient.plan_b}</p>
        </div>
      </div>
    </main>
  );
}
