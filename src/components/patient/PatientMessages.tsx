import { useState } from 'react';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import type { Patient } from '../../types';
import { Icon, Mark } from '../shared/Icon';

export function PatientMessages({ patient }: { patient: Patient }) {
  const refreshPatient = useAppStore((s) => s.refreshPatient);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.sendMessage(patient.id, text.trim(), 'patient');
      setText('');
      await refreshPatient(patient.id);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="patient-shell patient-subpage messages-page">
      <header className="patient-topbar">
        <div className="brand-lockup"><Mark /><span>Mensajes</span></div>
      </header>

      <section className="subpage-hero compact">
        <div className="avatar avatar-vero large">VT</div>
        <h1>Verónica Trenti</h1>
        <p>Tu nutricionista. Escribile cuando necesites.</p>
      </section>

      <div className="thread">
        {patient.messages.length === 0 && (
          <p className="empty-state">Todavía no hay mensajes. Verónica te escribe cuando corresponde.</p>
        )}
        {patient.messages.map((msg) => (
          <div key={msg.id} className={`bubble ${msg.from === 'vero' ? 'from-vero' : 'from-patient'}`}>
            {msg.from === 'vero' && <span className="bubble-label">Verónica</span>}
            <p>{msg.text}</p>
          </div>
        ))}
      </div>

      <div className="compose-bar">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribí un mensaje…"
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button type="button" className="primary-button" disabled={sending || !text.trim()} onClick={send}>
          <Icon name="message" size={16} />
        </button>
      </div>
    </main>
  );
}
