import { useEffect, useRef, useState, type FormEvent } from 'react';
import { assistantApi } from '../../api/assistant';
import { isAbortError } from '../../api/client';
import { friendlyError } from '../../lib/error-messages';
import { ASSISTANT_NOTICE, ASSISTANT_QUESTION_MAX, ASSISTANT_SUGGESTIONS, type AssistantAnswer } from '../../types/assistant';
import { Icon } from '../shared/Icon';
import { NvBadge, NvButton } from './primitives';
import './portfolio-assistant.css';

export type AssistantTurn =
  | { id: string; question: string; status: 'loading' }
  | { id: string; question: string; status: 'done'; answer: AssistantAnswer }
  | { id: string; question: string; status: 'error'; error: string };

function openLink(href: string, onOpen: (href: string) => void) {
  return (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpen(href);
  };
}

function AnswerBody({ answer, onOpen }: { answer: AssistantAnswer; onOpen: (href: string) => void }) {
  return <>
    <p className="pa-summary">{answer.summary}</p>
    {answer.cards.length > 0 && <section className="pa-cards" aria-label="Pacientes a mirar">
      <h3><Icon name="users" size={16} />Pacientes a mirar</h3>
      <ul>{answer.cards.map(card => <li key={card.patient_id}>
        <span className="pa-avatar" aria-hidden="true">{card.patient_name.trim().charAt(0).toLocaleUpperCase('es-AR')}</span>
        <div><p className="pa-name">{card.patient_name} <NvBadge tone={card.priority === 'alta' ? 'coral' : 'gold'}>{card.priority === 'alta' ? 'Alta' : 'Media'}</NvBadge></p>
          <p className="pa-reason">{card.reason}</p></div>
        <a className="nv-button nv-soft" href={card.action.href} onClick={openLink(card.action.href, onOpen)} aria-label={`${card.action.label}: ${card.patient_name}`}>{card.action.label}<Icon name="chevron" size={14} /></a>
      </li>)}</ul>
    </section>}
    {answer.sources.length > 0 && <p className="pa-sources">Fuentes: {answer.sources.join(' · ')}{answer.summary_by === 'ia' ? ' · Resumen redactado con IA gratuita' : ''}</p>}
  </>;
}

export function AssistantThread({ turns, onOpen, onRetry }: { turns: AssistantTurn[]; onOpen: (href: string) => void; onRetry: (turn: AssistantTurn) => void }) {
  return <ol className="pa-thread" aria-live="polite">{turns.map(turn => <li key={turn.id}>
    <p className="pa-question">{turn.question}</p>
    <div className="pa-answer">
      <span className="pa-bot" aria-hidden="true"><Icon name="sparkle" size={15} /></span>
      <div>
        {turn.status === 'loading' && <p className="pa-thinking" role="status">Pensando…</p>}
        {turn.status === 'error' && <div className="pa-error" role="alert"><p><strong>No pudimos responder.</strong> {turn.error}</p><NvButton className="nv-soft" onClick={() => onRetry(turn)}>Reintentar</NvButton></div>}
        {turn.status === 'done' && <AnswerBody answer={turn.answer} onOpen={onOpen} />}
      </div>
    </div>
  </li>)}</ol>;
}

/**
 * Asistente IA sobre la cartera. Cada respuesta se calcula de nuevo con los datos
 * vigentes del consultorio; la conversación no se guarda (al recargar empieza vacía).
 */
export function PortfolioAssistant({ professionalName, onOpen }: { professionalName?: string; onOpen: (href: string) => void }) {
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const [draft, setDraft] = useState('');
  const controller = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const busy = turns.some(turn => turn.status === 'loading');
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => { endRef.current?.scrollIntoView?.({ block: 'end' }); }, [turns]);

  const run = (id: string, question: string) => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    assistantApi.ask(question, current.signal)
      .then(answer => setTurns(list => list.map(turn => turn.id === id ? { id, question, status: 'done', answer } : turn)))
      .catch(reason => {
        if (isAbortError(reason)) return;
        setTurns(list => list.map(turn => turn.id === id ? { id, question, status: 'error', error: friendlyError(reason) } : turn));
      });
  };
  const ask = (text: string) => {
    const question = text.trim().slice(0, ASSISTANT_QUESTION_MAX);
    if (!question || busy) return;
    const id = `turno-${++sequence.current}`;
    setTurns(list => [...list, { id, question, status: 'loading' }]);
    setDraft('');
    run(id, question);
  };
  const retry = (turn: AssistantTurn) => {
    if (busy) return;
    setTurns(list => list.map(item => item.id === turn.id ? { id: turn.id, question: turn.question, status: 'loading' } : item));
    run(turn.id, turn.question);
  };
  const submit = (event: FormEvent) => { event.preventDefault(); ask(draft); };

  return <section className="pa-assistant" aria-label="Asistente IA">
    <header className="pa-head">
      <span className="pa-head-icon" aria-hidden="true"><Icon name="sparkle" size={18} /></span>
      <div><h2>Asistente IA</h2><p>Conversá sobre todos tus pacientes: preguntale lo que necesites.</p></div>
    </header>
    <div className="pa-body">
      {turns.length === 0 ? <div className="pa-welcome">
        <span className="pa-welcome-icon" aria-hidden="true"><Icon name="leaf" size={30} /></span>
        <h3>Hola, {professionalName?.trim() || 'Nutricionista'}</h3>
        <p>Soy tu asistente del consultorio. Uso los pendientes, los registros de la semana y las sugerencias de cada ficha para ayudarte a decidir a quién atender.</p>
        <div className="pa-suggestions" aria-label="Preguntas sugeridas">{ASSISTANT_SUGGESTIONS.map(text => <button key={text} type="button" onClick={() => ask(text)}>{text}</button>)}</div>
      </div> : <>
        <AssistantThread turns={turns} onOpen={onOpen} onRetry={retry} />
        {!busy && <div className="pa-suggestions pa-suggestions-inline" aria-label="Otras preguntas">{ASSISTANT_SUGGESTIONS.map(text => <button key={text} type="button" onClick={() => ask(text)}>{text}</button>)}</div>}
      </>}
      <div ref={endRef} />
    </div>
    <form className="pa-composer" onSubmit={submit}>
      <label className="pa-sr-only" htmlFor="pa-question">Pregunta para el asistente</label>
      <input id="pa-question" value={draft} maxLength={ASSISTANT_QUESTION_MAX} onChange={event => setDraft(event.target.value)} placeholder="Preguntale al asistente sobre tus pacientes…" autoComplete="off" />
      <button type="submit" className="pa-send" disabled={busy || !draft.trim()} aria-label="Enviar pregunta"><Icon name="arrow" size={16} /></button>
    </form>
    <p className="pa-notice">{ASSISTANT_NOTICE}</p>
  </section>;
}
