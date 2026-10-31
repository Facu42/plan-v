import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LoginScreen } from './LoginScreen';
import { AuthEntry, shouldSkipWelcome } from './WelcomeScreen';

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

describe('pantalla de ingreso', () => {
  it('junta el visual, el logo sin fondo y todas las formas de entrar', () => {
    auth.loading = false;
    auth.demoAllowed = false;
    auth.googleAvailable = false;
    const html = renderToStaticMarkup(<AuthEntry darkMode={false} onToggleTheme={vi.fn()} />);
    expect(html).toContain('login-pin');
    expect(html).toContain('nutridash-mark-navy');
    expect(html).toContain('>Nutridash<');
    expect(html).toContain('panel-mobile');
    expect(html).toContain('claro');
    expect(html).toContain('Soy paciente');
    expect(html).toContain('Soy nutricionista');
    expect(html).not.toContain('Una vos más sana.');
    expect(html).toContain('Entrar');
    expect(html).toContain('Continuar con Google');
    expect(html).toContain('Continuar con Apple');
    expect(html).toContain('Olvidé mi contraseña');
    expect(html).toContain('Crear cuenta');
    expect(html).toContain('placeholder="Email"');
    expect(html).toContain('entry-actions');
    expect(html).not.toContain('nutridash-logo-256');
    expect(html).not.toContain('mcp-nutrigo');
    expect(html).not.toContain('Fraunces');
    expect(html).not.toContain('Continuar en modo demo');
  });

  it('el registro y la invitación siguen en la misma pantalla', () => {
    const signup = renderToStaticMarkup(
      <LoginScreen darkMode={false} onToggleTheme={vi.fn()} initialMode="signup" />,
    );
    expect(signup).toContain('Crear cuenta');
    expect(signup).toContain('login-pin');
    expect(signup).toContain('Soy nutricionista');

    expect(shouldSkipWelcome('', inviteId)).toBe(true);
    expect(shouldSkipWelcome(`?invite=${inviteId}`, null)).toBe(true);
    expect(shouldSkipWelcome('', null)).toBe(false);
  });
});
