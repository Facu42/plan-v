import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { findSource, type SourceNode } from '../../features/nutrigo/SourceView';
import dashboard from '../../features/nutrigo/source/12-792.json';
import calendar from '../../features/nutrigo/source/84-1666.json';
import messages from '../../features/nutrigo/source/84-2565.json';
import insights from '../../features/nutrigo/source/263-6588.json';
import { EntryStatus } from './entry-shell';
import { EntryStage } from './entry-stage';
import pieces from './entry-source.json';
import { LoginScreen } from './LoginScreen';

const auth = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  enterDemoMode: vi.fn(),
  signInWithGoogle: vi.fn(),
  loading: false,
  demoAllowed: false,
  googleAvailable: false,
}));

vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth }));

const byId = (node: SourceNode, id: string) => findSource(node, (item) => String(item.props['data-node-id']) === id);

describe('piezas de ingreso', () => {
  it('usa los nodos del archivo, sin redibujarlos', () => {
    const stored = pieces as Record<string, SourceNode>;
    expect(stored.logo).toEqual(byId(dashboard as SourceNode, 'I12:793;2:4498'));
    expect(stored.field).toEqual(byId(dashboard as SourceNode, '2:4491'));
    expect(stored.segmented).toEqual(byId(calendar as SourceNode, '217:6464'));
    expect(stored.primary).toEqual(byId(messages as SourceNode, '207:7100'));
    expect(stored.secondary).toEqual(byId(insights as SourceNode, '265:8068'));
    expect(String((stored.segmented.children[2] as SourceNode).props.className)).toContain('bg-[#c2e66e]');
    expect(String(stored.primary.props.className)).toContain('rounded-[12px]');
  });
});

describe('pantalla de ingreso', () => {
  it('muestra el ingreso pin con todas las opciones y sin el estilo viejo ni la demo', () => {
    auth.loading = false;
    auth.demoAllowed = false;
    auth.googleAvailable = false;
    const html = renderToStaticMarkup(<LoginScreen darkMode={false} onToggleTheme={vi.fn()} />);
    expect(html).toContain('login-pin');
    expect(html).toContain('>Nutridash<');
    expect(html).toContain('Entrar');
    expect(html).toContain('Continuar con Google');
    expect(html).toContain('Continuar con Apple');
    expect(html).toContain('Olvidé mi contraseña');
    expect(html).toContain('Crear cuenta');
    expect(html).toContain('placeholder="Email"');
    expect(html).toContain('entry-actions');
    expect(html).not.toContain('Continuar en modo demo');
    expect(html).not.toContain('Instalar Nutridash');
    expect(html).not.toContain('auth-card');
    expect(html).not.toContain('loading-card');
    expect(html).not.toContain('Fraunces');
    expect(html).not.toContain('New Message');
    expect(html).not.toContain('Search anything');
    expect(html).not.toContain('f08ac.svg');
    expect(html).not.toContain('mcp-nutrigo');
  });

  it('muestra las dos entradas y el copy de pacientes por defecto', () => {
    auth.loading = false;
    const html = renderToStaticMarkup(<LoginScreen darkMode={false} onToggleTheme={vi.fn()} />);
    expect(html).toContain('login-pin');
    expect(html).toContain('Soy paciente');
    expect(html).toContain('Soy nutricionista');
    expect(html).toContain('Entrá a tu plan y a tu progreso.');
    expect(html).toContain('placeholder="Email"');
    expect(html).toContain('entry-actions');
    expect(html).not.toContain('Tipo de cuenta');
    expect(html).not.toContain('entry-screen--split');
  });

  it('la escena de nutricionistas habla de las funciones del panel', () => {
    const html = renderToStaticMarkup(<EntryStage entrada="nutri" />);
    expect(html).toContain('Tu consultorio, simple.');
    expect(html).toContain('Tu agenda se ordena sola');
    expect(html).toContain('Cobros y avisos en automático.');
    expect(html).not.toMatch(/kilos|bajá de peso|adelgaz/i);
  });

  it('la cuenta sin vincular usa la misma tarjeta y el botón verde', () => {
    const html = renderToStaticMarkup(
      <EntryStatus title="Tu cuenta todavía no está vinculada" subtitle="Cuando aceptes la invitación de tu nutricionista vas a ver tu plan. No se listan pacientes de otras cuentas." action={{ label: 'Cerrar sesión', onClick: vi.fn() }} />,
    );
    expect(html).toContain('Tu cuenta todavía no está vinculada');
    expect(html).toContain('Cerrar sesión');
    expect(html).toContain('data-node-id="207:7100"');
    expect(html).toContain('bg-[#c2e66e]');
    expect(html).not.toContain('loading-card');
  });
});
