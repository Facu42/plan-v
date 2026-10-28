import type {PatientPayment} from '../../types/fees';

const MESES_CORTOS=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const MESES_LARGOS=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

export type PagoMes={clave:string;rotulo:string;total:number};

const confirmados=(pagos:readonly PatientPayment[])=>pagos.filter(pago=>pago.status==='confirmed');

/** Suma de lo cobrado por mes, de los últimos `cantidad` meses hasta el de `hoy` (AAAA-MM-DD). */
export function pagosPorMes(pagos:readonly PatientPayment[],hoy:string,cantidad=8):PagoMes[]{
 const [anio,mes]=hoy.split('-').map(Number);
 return Array.from({length:cantidad},(_,i)=>{
  const indice=anio*12+(mes-1)-(cantidad-1-i);
  const clave=`${Math.floor(indice/12)}-${String(indice%12+1).padStart(2,'0')}`;
  const total=confirmados(pagos).filter(pago=>pago.paid_on.startsWith(clave)).reduce((suma,pago)=>suma+pago.amount,0);
  return {clave,rotulo:MESES_CORTOS[indice%12],total};
 });
}

export const rangoDeMeses=(meses:readonly PagoMes[])=>meses.length?`${MESES_LARGOS[MESES_CORTOS.indexOf(meses[0].rotulo)]} a ${MESES_LARGOS[MESES_CORTOS.indexOf(meses[meses.length-1].rotulo)]}`:'';
export const montoCorto=(monto:number)=>monto>=1000?`$${Math.round(monto/1000)} mil`:`$${monto}`;
/** Día y mes (10/11), como lo dibuja el boceto. */
export const diaYMes=(fecha:string)=>fecha.split('-').reverse().slice(0,2).join('/');

export type ParteMedio={medio:string;porcentaje:number};
/** Reparto de los pagos confirmados por medio de pago, en porcentaje. */
export function repartoPorMedio(pagos:readonly PatientPayment[]):ParteMedio[]{
 const ok=confirmados(pagos);
 if(!ok.length)return [];
 const cuentas=new Map<string,number>();
 for(const pago of ok)cuentas.set(pago.method,(cuentas.get(pago.method)??0)+1);
 return [...cuentas.entries()].sort((a,b)=>b[1]-a[1]).map(([medio,n])=>({medio,porcentaje:Math.round(n/ok.length*100)}));
}
