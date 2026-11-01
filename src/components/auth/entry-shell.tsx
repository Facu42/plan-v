import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../shared/Icon';
import { planVBrandBinding } from '../../features/nutrigo/branding';
import { SourceView, nodeName, type SourceNode } from '../../features/nutrigo/SourceView';
import { translateSource } from '../../features/nutrigo/translation';
import '../../features/nutrigo/nutrigo.css';
import '../../features/nutrigo/nutrigo.generated.css';
import pieces from './entry-source.json';
import './entry-shell.css';

/**
 * Figma no dibuja el ingreso. Estas pantallas se arman con nodos del archivo
 * (src/features/nutrigo/source, copiados en entry-source.json):
 * Logo del escritorio, título 22 y bajada 12 del Inicio, Segmented Button de la
 * agenda, Input-search del encabezado y el botón verde de Mensajes.
 * La tarjeta (blanco, radio 16, sombra del archivo, ancho 420) es el default:
 * el archivo no tiene un marco para entrar. El campo no muestra la lupa porque
 * no es una búsqueda, y su relleno es el gris de campos del archivo: el nodo es
 * blanco porque en el Inicio se apoya sobre crema. El tema oscuro se deriva.
 */
const nodes = pieces as {
  logo: SourceNode;
  title: SourceNode;
  subtitle: SourceNode;
  segmented: SourceNode;
  field: SourceNode;
  primary: SourceNode;
  secondary: SourceNode;
};

function asNode(value: SourceNode | string | number): SourceNode {
  if (typeof value !== 'object') throw new Error('La pieza del archivo no es un nodo.');
  return value;
}

const idlePicker = asNode(nodes.segmented.children[1]);
const activePicker = asNode(nodes.segmented.children[2]);

export function EntryChrome({ title, subtitle, onToggleTheme, darkMode = false, role, stage, children }: {
  title: string;
  subtitle?: string;
  onToggleTheme?: () => void;
  darkMode?: boolean;
  role?: 'alert' | 'status';
  /** Lado oscuro con la escena de cada entrada. Sin él, la tarjeta va sola al centro. */
  stage?: ReactNode;
  children?: ReactNode;
}) {
  const card = (
      <section className="entry-card" role={role} aria-label={role ? title : undefined}>
        <header className="entry-head">
          <div className="entry-logo">
            <SourceView source={nodes.logo} resolve={planVBrandBinding} translate={translateSource} />
          </div>
          {onToggleTheme && (
            <button type="button" className="entry-theme" aria-label={darkMode ? 'Usar tema claro' : 'Usar tema oscuro'} aria-pressed={darkMode} onClick={onToggleTheme}>
              <Icon name={darkMode ? 'sun' : 'moon'} size={18} />
            </button>
          )}
        </header>
        <div className="entry-copy">
          <SourceView source={nodes.title} resolve={() => ({ tag: 'h1', text: title })} translate={translateSource} />
          {subtitle ? <SourceView source={nodes.subtitle} resolve={() => ({ text: subtitle })} translate={translateSource} /> : null}
        </div>
        {children}
      </section>
  );
  if (!stage) return <div className="mcp-nutrigo entry-screen">{card}</div>;
  return (
    <div className="mcp-nutrigo entry-screen entry-screen--split">
      {stage}
      <div className="entry-pane">{card}</div>
    </div>
  );
}

export function EntrySegments({ label, options }: {
  label: string;
  options: { id: string; label: string; active: boolean; onClick: () => void }[];
}) {
  return (
    <div className={String(nodes.segmented.props.className)} data-node-id={String(nodes.segmented.props['data-node-id'])} data-name="Segmented Button" role="group" aria-label={label}>
      {options.map((option) => (
        <SourceView key={option.id} source={option.active ? activePicker : idlePicker} resolve={(node) => {
          if (nodeName(node) === 'Button Picker') return { onClick: option.onClick, props: { 'aria-pressed': option.active } };
          if (node.tag === 'p') return { text: option.label };
          return undefined;
        }} translate={translateSource} />
      ))}
    </div>
  );
}

/** El contenedor es el Input-search del archivo. Sin la lupa: estos campos no buscan. */
export function EntryField({ label, ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <SourceView source={nodes.field} resolve={(node) => {
      if (nodeName(node) === 'Icon') return { hidden: true };
      if (node.tag === 'p') return {
        tag: 'input',
        props: {
          ...input,
          'aria-label': input['aria-label'] ?? label,
          placeholder: input.placeholder ?? label,
        },
      };
      return undefined;
    }} translate={translateSource} />
  );
}

export function EntryButton({ label, tone = 'primary', type = 'button', disabled, onClick }: {
  label: string;
  tone?: 'primary' | 'secondary';
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  disabled?: boolean;
  onClick?: () => void;
}) {
  const source = tone === 'primary' ? nodes.primary : nodes.secondary;
  return (
    <SourceView source={source} resolve={(node) => {
      if (nodeName(node) === 'Button') return { tag: 'button', props: { type, disabled, onClick } };
      if (node.tag === 'p') return { text: label };
      return undefined;
    }} translate={translateSource} />
  );
}

export function EntryStatus({ title, subtitle, action, role, hint }: {
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
  role?: 'alert' | 'status';
  hint?: ReactNode;
}) {
  return (
    <EntryChrome title={title} subtitle={subtitle} role={role ?? 'status'}>
      {hint}
      {action ? <div className="entry-actions"><EntryButton label={action.label} onClick={action.onClick} /></div> : null}
    </EntryChrome>
  );
}
