import { Component, type ErrorInfo, type ReactNode } from 'react';
import './app-status.css';

/** Pantalla de carga de la app: el primer cuadro que ve quien entra mientras baja el consultorio. */
export function LoadingScreen({ label = 'Cargando tu espacio…' }: { label?: string }) {
  return <div className="app-status" role="status" aria-live="polite">
    <span className="app-status-spinner" aria-hidden="true" />
    <p>{label}</p>
  </div>;
}

/** Pantalla de error: lo que se ve si algo falla al dibujar, en lugar de una página en blanco. */
export function ErrorScreen({ onReload }: { onReload: () => void }) {
  return <div className="app-status" role="alert">
    <h1>Algo salió mal</h1>
    <p>No pudimos mostrar esta pantalla. Lo que ya tenías guardado sigue ahí. Volvé a cargar la app para seguir.</p>
    <button type="button" onClick={onReload}>Volver a cargar</button>
  </div>;
}

type BoundaryState = { failed: boolean };

/**
 * Atrapa cualquier falla al dibujar la app, incluida la de bajar una parte nueva
 * después de una actualización, y ofrece volver a cargar.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Falla al dibujar la app', error, info.componentStack);
  }

  render() {
    return this.state.failed ? <ErrorScreen onReload={() => window.location.reload()} /> : this.props.children;
  }
}
