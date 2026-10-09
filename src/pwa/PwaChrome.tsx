import { useEffect } from 'react';
import { InstallBanner } from './InstallBanner';
import { captureInstallPrompt } from './install-offer';
import { OfflineNotice } from './OfflineNotice';
import { ShellUpdateNotice } from './ShellUpdateNotice';

/** `install={false}`: la pantalla ofrece instalar en su propio lugar (la tarjeta del menú de Nutrigo), sin franja arriba. */
export function PwaChrome({ install = true }: { install?: boolean } = {}) {
  useEffect(() => { captureInstallPrompt(); }, []);
  return <>
    <OfflineNotice />
    <ShellUpdateNotice />
    {install && <InstallBanner />}
  </>;
}
