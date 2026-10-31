import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LoginScreen } from './LoginScreen';
import { AuthEntry, shouldSkipWelcome, WelcomeScreen } from './WelcomeScreen';

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

const inviteId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

describe('pantalla de bienvenida', () => {
  it('muestra la foto, el logo sin fondo, el nombre y las acciones en español', () => {
    const html = renderToStaticMarkup(<WelcomeScreen onStart={() => {}} onSignIn={() => {}} />);
    expect(html).toContain('welcome__photo');
    expect(html).toContain('welcome-bg');
    expect(html).toContain('nutridash-mark');
    expect(html).toContain('>Nutridash<');
    expect(html).toContain('Mejores hábitos.');
    expect(html).toContain('Una vos más sana.');
    expect(html).toContain('>Empezar<');
    expect(html).toContain('Iniciar sesión');
    expect(html).not.toContain('nutridash-logo-256');
    expect(html).not.toContain('Get Started');
    expect(html).not.toContain('Sign In');
    expect(html).not.toContain('mcp-nutrigo');
    expect(html).not.toContain('Fraunces');
  });
});

describe('entrada con bienvenida', () => {
  it('arranca en la bienvenida y deja el formulario de ingreso intacto', () => {
    auth.loading = false;
    const welcome = renderToStaticMarkup(<AuthEntry darkMode={false} onToggleTheme={vi.fn()} />);
    expect(welcome).toContain('>Empezar<');
    expect(welcome).toContain('>Nutridash<');
    expect(welcome).not.toContain('mcp-nutrigo');

    const form = renderToStaticMarkup(<LoginScreen darkMode={false} onToggleTheme={vi.fn()} />);
    expect(form).toContain('mcp-nutrigo');
    expect(form).toContain('Iniciar sesión');
    expect(form).toContain('>Entrar<');
    expect(form).toContain('data-node-id="207:7100"');
  });

  it('Empezar abre el registro y una invitación salta el recibimiento', () => {
    const signup = renderToStaticMarkup(
      <LoginScreen darkMode={false} onToggleTheme={vi.fn()} initialMode="signup" />,
    );
    expect(signup).toContain('Crear cuenta');
    expect(signup).toContain('mcp-nutrigo');

    expect(shouldSkipWelcome('', inviteId)).toBe(true);
    expect(shouldSkipWelcome(`?invite=${inviteId}`, null)).toBe(true);
    expect(shouldSkipWelcome('', null)).toBe(false);
  });
});
