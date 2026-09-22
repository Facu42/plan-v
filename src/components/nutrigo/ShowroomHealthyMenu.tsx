import { useMemo, useState } from 'react';
import { Icon } from '../shared/Icon';
import { MealThumbnail } from './PatientOverview';
import { mealSlotTone, NvBadge, NvButton, NvState } from './primitives';
import type { ShowroomPage } from './ShowroomPanels';
import type { ShowroomPatient } from './showroom-model';
import './showroom-healthy-menu.css';

type HealthyMenuItem = {
  title: string;
  slots: string[];
  days: string[];
  occurrences: number;
  order: number;
};

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-AR');

export function buildHealthyMenu(patient: Pick<ShowroomPatient, 'weekPlan'>) {
  const indexed = new Map<string, HealthyMenuItem>();
  const slots: string[] = [];
  let totalAssignments = 0;
  let order = 0;

  patient.weekPlan.forEach((day) => day.meals.forEach((meal) => {
    const title = meal.title.trim().replace(/\s+/g, ' ');
    if (!title) return;
    totalAssignments += 1;
    if (!slots.includes(meal.slot)) slots.push(meal.slot);
    const key = normalize(title);
    const current = indexed.get(key);
    if (current) {
      current.occurrences += 1;
      if (!current.days.includes(day.day)) current.days.push(day.day);
      if (!current.slots.includes(meal.slot)) current.slots.push(meal.slot);
      return;
    }
    indexed.set(key, { title, slots: [meal.slot], days: [day.day], occurrences: 1, order: order++ });
  }));

  const items = [...indexed.values()].sort((a, b) => b.occurrences - a.occurrences || a.order - b.order);
  return { items, slots, totalAssignments };
}

export function ShowroomHealthyMenu({ patient, query, onNavigate }: {
  patient: ShowroomPatient;
  query: string;
  onNavigate: (page: ShowroomPage) => void;
}) {
  const menu = useMemo(() => buildHealthyMenu(patient), [patient]);
  const [slot, setSlot] = useState('Todas');
  const term = normalize(query);
  const items = menu.items.filter((item) =>
    (slot === 'Todas' || item.slots.includes(slot))
    && (!term || normalize(`${item.title} ${item.slots.join(' ')} ${item.days.join(' ')}`).includes(term)));
  const featured = items[0];

  if (!menu.items.length) return <section className="nvm-menu" aria-label="Menú saludable">
    <NvState title="Tu menú está en preparación" description="Cuando tu nutricionista publique el plan semanal, vas a encontrar acá sus títulos organizados." />
  </section>;

  return <section className="nvm-menu" aria-label="Menú saludable">
    <div className="nvm-layout">
      <div className="nvm-main">
        <header className="nvm-hero">
          <div><span>TU MENÚ</span><h2>Preparaciones de tu plan</h2><p>Una vista rápida de los títulos que tu nutricionista publicó para esta semana.</p></div>
          <span className="nvm-hero-icon"><Icon name="leaf" size={23} /></span>
        </header>

        <div className="nvm-filters" aria-label="Filtrar por momento">
          {['Todas', ...menu.slots].map((value) => <button type="button" key={value} aria-pressed={slot === value} onClick={() => setSlot(value)}>{value}</button>)}
        </div>

        {featured ? <>
          <article className="nvm-featured">
            <div className="nvm-featured-image"><MealThumbnail slot={featured.slots[0]} /><small>Imagen ilustrativa</small></div>
            <div className="nvm-featured-copy">
              <NvBadge tone="green">Más presente en tu semana</NvBadge>
              <h3>{featured.title}</h3>
              <p>{featured.occurrences} {featured.occurrences === 1 ? 'vez' : 'veces'} esta semana · {featured.days.join(', ')}</p>
              <div className="nvm-slot-list">{featured.slots.map((value) => <NvBadge key={value} tone={mealSlotTone(value)}>{value}</NvBadge>)}</div>
              <NvButton onClick={() => onNavigate('plan')}>Ver en plan semanal <Icon name="arrow" size={15} /></NvButton>
            </div>
          </article>

          <section className="nvm-all" aria-label="Preparaciones disponibles">
            <header><div><span>SEMANA ACTUAL</span><h3>Preparaciones disponibles</h3></div><small>{items.length} {items.length === 1 ? 'resultado' : 'resultados'}</small></header>
            <div className="nvm-list">{items.map((item) => <article key={normalize(item.title)}>
              <MealThumbnail slot={item.slots[0]} />
              <div><strong>{item.title}</strong><small>{item.days.join(' · ')}</small><span>{item.occurrences} {item.occurrences === 1 ? 'vez' : 'veces'} esta semana</span></div>
              <div className="nvm-card-slots">{item.slots.map((value) => <NvBadge key={value} tone={mealSlotTone(value)}>{value}</NvBadge>)}</div>
            </article>)}</div>
          </section>
        </> : <NvState title="Sin coincidencias" description="Probá con otro título, día o momento de comida." />}
      </div>

      <aside className="nvm-aside" aria-label="Resumen del menú">
        <section>
          <span>ESTA SEMANA</span><h3>Resumen del plan</h3>
          <dl><div><dt>Títulos únicos</dt><dd>{menu.items.length}</dd></div><div><dt>Asignaciones</dt><dd>{menu.totalAssignments}</dd></div><div><dt>Momentos</dt><dd>{menu.slots.length}</dd></div></dl>
        </section>
        <section><span>MOMENTOS</span><h3>En tu plan</h3><div className="nvm-moments">{menu.slots.map((value) => {
          const count = menu.items.filter((item) => item.slots.includes(value)).length;
          return <button type="button" key={value} onClick={() => setSlot(value)}><span className="nvm-moment-icon"><Icon name="leaf" size={16} /></span><span><strong>{value}</strong><small>{count} {count === 1 ? 'título' : 'títulos'}</small></span><Icon name="chevron" size={14} /></button>;
        })}</div></section>
        <NvButton className="nvm-shopping" onClick={() => onNavigate('compras')}><Icon name="check" size={16} /> Abrir lista de compras</NvButton>
      </aside>
    </div>
    <p className="nvm-note"><Icon name="list" size={16} /> No son recetas completas; sólo reúne los títulos publicados por tu nutricionista.</p>
  </section>;
}
