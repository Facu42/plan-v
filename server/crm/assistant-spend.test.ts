import {expect,it} from 'vitest';
import {sumAssistantSpend} from './assistant-spend';
it('cuenta sólo operaciones propias del mes y conserva reservas inciertas',()=>{
 const rows=[{operation_key:'plan-assistant:own',month:'2026-10',status:'charged',reserved_micros:1000,charged_micros:300},{operation_key:'portfolio:owner:1',month:'2026-10',status:'uncertain',reserved_micros:700,charged_micros:0},{operation_key:'plan-assistant:foreign',month:'2026-10',status:'charged',reserved_micros:900000,charged_micros:900000},{operation_key:'portfolio:foreign:1',month:'2026-10',status:'charged',reserved_micros:800000,charged_micros:800000},{operation_key:'portfolio:owner:2',month:'2026-09',status:'reserved',reserved_micros:10000,charged_micros:0},{operation_key:'portfolio:owner:3',month:'2026-10',status:'released',reserved_micros:20000,charged_micros:0}];
 expect(sumAssistantSpend(rows,new Set(['plan-assistant:own']),'portfolio:owner:','2026-10')).toBe(1000);
});
it('un dato ilegible no se convierte en gasto cero',()=>{
 expect(()=>sumAssistantSpend([{operation_key:'own',month:'2026-10',status:'charged',reserved_micros:1000,charged_micros:'bad'}],new Set(['own']),'portfolio:owner:','2026-10')).toThrow();
});
