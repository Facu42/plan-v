export type InstallPlatform = 'ios' | 'android' | 'desktop' | 'standalone';

export function detectInstallPlatform(input: {
  userAgent: string;
  standalone?: boolean;
  displayModeStandalone?: boolean;
}): InstallPlatform {
  if (input.standalone || input.displayModeStandalone) return 'standalone';
  if (/iPhone|iPad|iPod/i.test(input.userAgent)) return 'ios';
  if (/Android/i.test(input.userAgent)) return 'android';
  return 'desktop';
}

export const INSTALL_COPY: Record<Exclude<InstallPlatform, 'standalone'>, { title: string; body: string; action: string }> = {
  ios: {
    title: 'Agregar a pantalla de inicio',
    body: 'En Safari: tocá Compartir y después Agregar a pantalla de inicio. No uses las instrucciones de Android.',
    action: 'Entendido',
  },
  android: {
    title: 'Instalar Plan V',
    body: 'Podés instalar la app en este teléfono. Los datos clínicos no se guardan sin conexión.',
    action: 'Instalar',
  },
  desktop: {
    title: 'Instalar Plan V',
    body: 'En Chrome o Edge podés instalar el consultorio o la app como una ventana propia.',
    action: 'Instalar',
  },
};
