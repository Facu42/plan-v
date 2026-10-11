# Cobros por paciente (10/10/2026)

Pedido: «Nuevo cobro», «Asignar programa» y «Copiar link» por paciente, como se vio en Nutriboost
(ver `docs/inicio-seguimiento-vs-nutriboost-2026-10-10.md`; solo se vio en pantalla, no se probó que ande allá).
Plan V sigue sin mover plata ni conectar pasarelas: la paciente le paga directo a su nutricionista.

## Diseño elegido (el más simple)
- **Sobre lo que ya había**: Cobranzas usa `patient_fees`, `patient_charges` y `patient_payments`. No hay modelo paralelo.
- **Nuevo cobro**: un cobro suelto con concepto, monto y vencimiento (`patient_charges.kind = 'extra'`).
  Puede haber varios el mismo día. Cambiar la cuota mensual no los borra. Se pueden perdonar y se cubren con pagos como cualquier cuota.
  Suma a lo que la paciente debe en Pagos y le queda un aviso con el concepto en su línea de tiempo.
- **Asignar programa**: la nutricionista arma programas (nombre y monto por mes, tabla `nutritionist_programs`) y los asigna;
  la cuota de la paciente toma ese monto y guarda el nombre del programa. Borrar un programa no cambia la cuota de quienes ya lo tienen.
  «Quitar programa» saca la cuota. Cambiar la cuota a mano limpia el nombre del programa.
- **Copiar link**: copia un mensaje listo para pegar con el concepto, el monto, el vencimiento y el link y/o alias de pago
  que la nutricionista ya cargó en «Datos de cobro». No se arma un link distinto por cobro (eso necesita una pasarela). Si no hay link ni alias, el botón queda apagado y explica por qué. Solo se copian links que empiezan con https.

## Permisos
Solo la nutricionista asignada a la paciente y con permiso de cobranzas (`edit_billing`) crea cobros y asigna programas; los programas son por nutricionista
(la tabla solo se lee con su cuenta). La paciente y otra nutricionista reciben 403/42501. Pruebas: `server/fees-charges-flow.integration.test.ts`,
`server/fees-charges.postgres.test.ts` (permisos cruzados incluidos) y `src/components/nutrigo/cobros-por-paciente.test.tsx`.

## Migración (sin aplicar)
`supabase/migrations/20261010150000_charges_programs.sql`. Agrega columnas a `patient_charges` y `patient_fees`, una tabla nueva y cuatro funciones;
redefine las que arman la cuenta para sumar `kind`, `concept` y `program_name`. No se aplicó en producción: espera la frase escrita de Facundo.
Hasta entonces, la web con este cambio muestra los botones pero crear cobros o programas responde «requieren instalar la migración» (501); el resto de Cobranzas sigue igual.

## Falta / no se hizo
- Link de cobro propio por cobro (Mercado Pago u otra pasarela): necesita cuenta y credenciales; fuera de alcance.
- Pagos de la paciente todavía no lista cobro por cobro (solo el total que debe y el aviso en su línea de tiempo): conviene sumarlo si Facundo lo pide.
- Comparación contra Figma: Nutrigo no dibuja Cobranzas; se armó con los componentes del archivo (`NvButton`, `NvCard`, estilos de `cobranzas-fig.css`).
