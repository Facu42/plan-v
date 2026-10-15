import { unreadCount } from '../nutrigo/message-receipts';
import { useFigmaPatient } from './FigmaPatientIdentity';

export function FigmaPatientUnreadBadge({ variant, className, nodeId }: { variant: 'nav' | 'dot'; className: string; nodeId: string }) {
  const patient = useFigmaPatient();
  const count = unreadCount(patient.messages ?? [], 'patient');
  if (count === 0) return null;
  return <div className={className} data-node-id={nodeId} data-name="Badge" aria-label={`${count} mensajes sin leer`}>
    {variant === 'nav'
      ? <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0"><span className="font-['Poppins:Regular'] leading-[1.35] text-[10px] text-center text-white">{count > 9 ? '9+' : count}</span></div>
      : <div className="bg-[#ffa257] relative rounded-[14px] shrink-0 size-[8px]" />}
  </div>;
}
