import { InstallBanner } from './InstallBanner';
import { OfflineNotice } from './OfflineNotice';
import { ShellUpdateNotice } from './ShellUpdateNotice';

export function PwaChrome() {
  return <>
    <OfflineNotice />
    <ShellUpdateNotice />
    <InstallBanner />
  </>;
}
