21/10 · Cursor · Se trajo main otra vez al boceto del Inicio (`claude/panel-boceto-inicio-900`, [PR #163](https://github.com/Facu42/plan-v/pull/163)) para incorporar la fase A (#162). El Inicio sigue midiendo 900. Solo docs y boceto. Sin juntar.

21/10 · Cursor · Se trajo main al boceto del Inicio (`claude/panel-boceto-inicio-900`, [PR #163](https://github.com/Facu42/plan-v/pull/163)) sin rebase y sin juntar. El Inicio sigue entrando en 1440×900. No se tocó la app.

21/10 · Cursor · Se trajo main a la fase A del armazón (`claude/panel-fase-a-armazon`, [PR #162](https://github.com/Facu42/plan-v/pull/162)) sin rebase y sin juntar. La nutri sigue con el armazón del boceto. La vista previa de suscripciones ya no le pasa al menú un control que ese menú no tiene.

19/10 noche · Cursor · El pago único de la cuota del mes quedó en `cursor/pago-mensual-unico` ([PR #157](https://github.com/Facu42/plan-v/pull/157), borrador contra las pantallas del [PR #156](https://github.com/Facu42/plan-v/pull/156)). Bandera apagada. Migración `20261020143000` escrita y sin aplicar. No se tocó la ficha ni el chat. El débito sigue en el [PR #155](https://github.com/Facu42/plan-v/pull/155). Sin merge y sin producción. Siguiente: ficha y chat desde esta rama.

# Coordinación entre agentes (Claude, Codex, Cursor)

20/10 · Claude · Panel de la nutri: [instrucciones pantalla por pantalla y fases nuevas A a I](panel-nutri-rediseno/instrucciones-boceto.md). El boceto se pasa como código; Claude desarrolla por fases y cada una se junta a main solo con el ok de Facundo.

20/10 · Cursor · Se trajo `origin/main` (`f51f413`) a `cursor/pago-mensual-unico` ([PR #157](https://github.com/Facu42/plan-v/pull/157)) sin rebase. La fase 5 sigue integrada a main. Las correcciones del boceto van en el [PR #158](https://github.com/Facu42/plan-v/pull/158). No se toca `codex/panel-nutri-fase-6`. Sin merge, sin migración aplicada y sin producción. Pruebas: 3.244 aprobadas y 2 omitidas, en 511 archivos. Tipos en verde.

19/10 · Cursor · Fase 5 (Agenda, Cobranzas y Página pública) en `cursor/panel-nutri-fase-5`, [PR #153](https://github.com/Facu42/plan-v/pull/153). Facundo autorizó juntarla. La fase 4 ya está en main por [PR #154](https://github.com/Facu42/plan-v/pull/154). Mercado Pago y Google Calendar muestran «Conectar». WhatsApp salió del panel: los avisos van por la app. Sin SQL remoto.

19/10 · Codex · Fase 4 de Ficha integrada a main por [PR #154](https://github.com/Facu42/plan-v/pull/154). Revisión de código y visual cerradas, seis e2e aprobados y suite estable final verde (3.177 y dos omitidas, 494 archivos). [Informe y límites](panel-nutri-rediseno/fase-4-verificacion.md). Sin SQL remoto.


Una sola página para que los agentes no se pisen. **Leela antes de empezar una tarea y actualizala al
terminarla.** Los agentes no comparten memoria: lo único que todos ven es este repositorio.
Creada el 14/10/2026 por Claude a pedido de Facundo.

## 1. Carriles: quién tiene qué

Un carril es un tema con dueño. Nadie trabaja en el carril de otro sin anotarlo antes acá y sin el
visto bueno de Facundo.

| Carril | Dueño | Dónde vive | Estado |
|---|---|---|---|
| Acceso, cartera completa, teléfono de la paciente | Codex | PR #105 (`codex/nutridesk-release-base`) | Borrador. Falta comparar con Figma y la frase de Facundo |
| Consultas grabadas, borrador privado y resumen revisado | Codex | PR #106 (`codex/nutridesk-release-consultas`) | Borrador, encima de #105. IA externa apagada |
| Importar pacientes y documentos con OCR | Codex | PR #107 (`codex/nutridesk-release-importacion`) | Borrador, encima de #106 |
| Fórmulas, equivalencias, micronutrientes, PDF con marca, USDA | Codex | PR #108 (`codex/nutridesk-release-nutricion`) | Borrador, encima de #107 |
| Ficha clínica, laboratorio y exportaciones en PDF | Codex | PR #115 (encima de #108) | Borrador actualizado: comprobación del permiso y pacing reparados; sesiones reales aprobadas en la pila actual |
| Agenda pública, Google, Mercado Pago, equipo y recepción | Codex | PR #123 (`codex/nutridesk-release-agenda`) | Borrador disponible, encima de #115. Proveedores externos apagados |
| Operaciones, comunicaciones, asistente de cartera y ayuda | Codex | PR #127 (`codex/nutridesk-release-operaciones`) | Entrega 7 verificada localmente, encima de #123; [informe vigente](nutridesk-release-operaciones-2026-10-15.md) |
| Tabla de composición SARA 2 solicitada | Codex | `codex/nutridesk-release-sara2` | Entrega 8 integrada sobre #127 `5c8ea54`; 930 registros y 39 componentes. Suite final 2.999/0/2 en 458 archivos y revisión/QA local aprobados; borrador propio pendiente de subir, sin producción |
| Lo que Codex dejó sin guardar en la PC de Facundo: importar pacientes (otra versión), Equivalencias (otra versión), asistente con IA para la cartera | Codex | solo en la PC (sin respaldo) | Espera la frase de Facundo para respaldarlo |
| Seguridad y operación (vistas de paciente solo lectura, privacidad de la IA, staging, monitoreo, respaldo de archivos) | Claude | ramas `claude/*` | En curso |
| Comparación de #105 con Figma y orden de juntado de la pila de Codex | Claude | `docs/coordinacion/` y comentarios en los PR | #105 comparado el 14/10. Claude no empuja a ramas de Codex |
| Lado paciente que Codex no tocó: ánimo y síntomas, rachas, lista del súper por comercio y compartir, avisos de recurso asignado y plan nuevo, push | Claude | ramas `claude/*` | Ánimo y síntomas publicado (PR #112, 14/10). Recorridos de punta a punta y monitor en main (#114, 15/10). Aviso de recurso indicado en PR propio. El resto, por empezar |
| Alternativas por comida (la paciente elige) | Claude | — | **Espera a que #108 esté en `main`** (usa sus intercambios) |
| Página pública con paquetes, resumen de la mañana para la nutri, Centro de ayuda | — | — | **En espera.** Codex tiene piezas parecidas; Facundo decide cuál sigue |
| Rediseño del panel de la nutri (bocetos aprobados y plan por fases) | Claude desde el 20/10 (fases nuevas A a I); antes Codex (fases 1 a 4) y Cursor (fase 5) | Fases 1 a 5 en main. [Instrucciones y fases nuevas](panel-nutri-rediseno/instrucciones-boceto.md), [plan](panel-nutri-rediseno/plan.md) | Facundo (20/10 04:02) pidió que Claude pase el boceto como código y desarrolle por fases; cada fase se junta a main solo con su ok |
| Suscripciones de pacientes (débito con Mercado Pago de la nutri) | Cursor | Backend `cursor/suscripciones-pacientes-backend` ([PR #155](https://github.com/Facu42/plan-v/pull/155)). Pantallas `cursor/suscripciones-cobranzas-pagina` ([PR #156](https://github.com/Facu42/plan-v/pull/156)). Pago único `cursor/pago-mensual-unico` ([PR #157](https://github.com/Facu42/plan-v/pull/157), borrador contra las pantallas). [Spec](suscripciones-pacientes/spec.md) sección 2.9 | Partes 1, 2 y el pago único listos en borrador. Bandera apagada. Las dos migraciones sin aplicar. Siguiente: ficha y chat desde `cursor/pago-mensual-unico`. Después, el débito en la app y el sandbox. No mergear |

## 2. Reglas para no pisarse

1. **Ramas.** Claude trabaja en `claude/*`, Codex en `codex/*`, Cursor en `cursor/*`. Nadie empuja a
   ramas de otro ni a `respaldo/*`. Un PR por tema. Nada directo a `main`.
2. **Migraciones.** Codex tiene reservado `20261011140000` a `20261014235959` (18 migraciones ya escritas, incluida SARA 2 desde el 14/10).
   Claude usa fechas desde `20261015000000`. Si Codex vuelve, usa fechas posteriores a la última que
   figure en `main` **y** en la tabla de abajo. Nunca se edita una migración ya escrita por otro.
   Solo Facundo autoriza aplicar migraciones en producción, con su frase escrita.
3. **Archivos compartidos.** La pila de Codex toca estos archivos de uso común. Claude los evita o hace
   cambios mínimos y los anota acá:
   `server/index.ts`, `server/store.ts`, `src/store/useAppStore.ts`, `src/types/index.ts`,
   `src/main.tsx`, `vite.config.ts`, `src/components/nutrigo/*` (55 archivos),
   `src/features/nutrigo/*` y las rutas de `care`, `foods` y `targets`.
4. **Orden de juntado.** Primero la pila de Codex, en orden **#105 → #106 → #107 → #108 → #115**, después de
   la prueba con Verónica. Los PR de Claude son chicos: si se juntan antes, Codex hace merge de
   `main` en su pila; si se juntan después, Claude hace merge de `main` en su rama.
5. **Diseño.** La app de la paciente es **igual a Nutrigo, colores incluidos**. Regla fija (Facundo, 14/10).
6. **Al terminar cada tarea**, el agente agrega una línea a la bitácora (sección 5) y actualiza la tabla
   de carriles. Lo largo va en su propio informe en `docs/` y se enlaza.

## 3. Migraciones reservadas o en curso

| Rango o archivo | Dueño | Estado |
|---|---|---|
| `20261011140000_clinical_ai_budget` … `20261013123000_imported_clinical_export` (17 archivos, manifiesto en `docs/deployment/nutridesk-migrations-2026-10-13.json` de la rama de Codex) | Codex | Sin aplicar |
| `20261014180000_sara2_catalog` | Codex | Escrita el 14/10 antes de la regla de fechas nuevas; conservada como entrega 8. Sin aplicar |
| `20261015090000_patient_views_read_only` | Claude | PR #110, en main desde el 14/10. Aplicada en la base el 14/10 con la frase de Facundo (el historial de la base la anota como `20261014215529`) |
| `20261015100000_habit_symptoms` | Claude | PR #112, en main desde el 14/10. Aplicada en la base el 14/10 con la frase de Facundo (el historial la anota como `20261014215543`) |
| `20261015210000_activity_kcal` | Claude | PR #122, en main `9c56854`; ya observada aplicada con alias `20261015173356`. Se conserva como base exacta, no pendiente |
| `20261015*` en adelante | Claude | Se anotan acá al crearlas |
| `20261020120000_patient_subscriptions` | Cursor | Escrita el 19/10. Sin aplicar. Hace falta la frase de Facundo |
| `20261020143000_patient_fee_checkouts` | Cursor | Escrita el 19/10, en `cursor/pago-mensual-unico`. Sin aplicar. Hace falta la frase de Facundo |

## 4. Decisiones vigentes de Facundo (fechadas)

| Fecha | Decisión |
|---|---|
| 22/9 | "Exacto a Nutrigo": si Plan V se aparta del archivo, gana el archivo |
| 11/10 | No se usan mensajes por mail por ahora |
| 14/10 | La app de la paciente es igual a Nutrigo, colores incluidos. Regla fija |
| 14/10 | Claude puede seguir desarrollando por carriles, sin pisar lo de Codex |
| 14/10 | Documentos de producto ordenados en `docs/producto/` |
| 19/10 | Suscripciones de pacientes: sin comisión, sin prueba gratis, solo mensual, la paciente puede darse de baja en la app, cambio de precio con 10 días de aviso, si hay débito activo se apaga la cuota manual, solo la nutri activa (equipo y recepción solo ven), se ofrece en la página pública y por link, todos los medios de pago. Cursor hace backend y pantallas. Detalle en `docs/suscripciones-pacientes/spec.md` |

Pendientes de decidir (con recomendación en `docs/producto/07-decisiones-recomendadas.md`): precio y
prueba gratis, presupuesto de IA en producción, proveedor de correo cuando se use, Android, métricas
del piloto, entidad legal.

## 5. Bitácora de traspaso (la más nueva arriba)

- **21/10 · Cursor · Main en el boceto del Inicio** · Se trajo main (fase A, #162) a `claude/panel-boceto-inicio-900` ([PR #163](https://github.com/Facu42/plan-v/pull/163)). El Inicio sigue midiendo 900. Solo docs y boceto. Sin juntar.
- **19/10 · Cursor · Celular: sección activa y título** · En el [PR #157](https://github.com/Facu42/plan-v/pull/157) la Página pública marca «Más», el título queda una sola vez en la barra del celular, y la captura usa el boceto de la Página pública. 3.244 pruebas y 2 omitidas, tipos en verde. Lo mismo está en el [PR #156](https://github.com/Facu42/plan-v/pull/156). Agenda y Cobranzas del panel real, con capturas nuevas de 390, están en el [PR #158](https://github.com/Facu42/plan-v/pull/158).
- **19/10 · Cursor · Pago único de la cuota, cerrado** · [PR #157](https://github.com/Facu42/plan-v/pull/157), rama `cursor/pago-mensual-unico`, borrador contra `cursor/suscripciones-cobranzas-pagina`. Enlace de un mes, sin suscripción. El cobro entra una vez en Movimientos. Con débito activo no se ofrece. Migración `20261020143000` escrita y sin aplicar. Trae el arreglo de celular del [PR #156](https://github.com/Facu42/plan-v/pull/156): el débito y las cuotas vencidas se leen en columna, Movimientos es una lista en el celular, y el menú inferior queda fijo. Capturas nuevas en `design/suscripciones/`, el celular al lado del boceto de escritorio. 3.243 pruebas y 2 omitidas, tipos en verde. Sin ficha, sin chat, sin merge y sin producción. Lo de Agenda que ya está en main va en [PR #158](https://github.com/Facu42/plan-v/pull/158). Siguiente: `cursor/suscripciones-ficha-chat` desde esta rama.
- **19/10 · Cursor · Celular de las pantallas de suscripciones** · Facu rechazó el celular de 390. En [PR #156](https://github.com/Facu42/plan-v/pull/156) el débito y los movimientos se leen en columna, las pestañas bajan de renglón, Suscribirme queda dentro del marco y el menú inferior queda fijo. Capturas nuevas en `design/suscripciones/`, el celular al lado del boceto de escritorio. 3.230 pruebas y 2 omitidas, tipos en verde. Lo de Agenda y Cobranzas que ya está en main va en otra rama, `cursor/arreglo-mobile-fase5`.
- **19/10 · Cursor · Pago único de la cuota, registrado** · Facu pidió cobrar un mes suelto por Mercado Pago, sin suscripción. Quedó en la spec, sección 2.9, antes de programarlo.
- **19/10 · Cursor · Pantallas de suscripciones** · [PR #156](https://github.com/Facu42/plan-v/pull/156), rama `cursor/suscripciones-cobranzas-pagina`, borrador contra `cursor/suscripciones-pacientes-backend`. Cobranzas, página pública del panel y la página donde la paciente elige el plan. Bandera apagada. 3.228 pruebas y dos omitidas, tipos en verde. Capturas de la app junto al boceto en `design/suscripciones/`. No se tocó la ficha ni el chat. Sin merge, sin migración aplicada y sin producción. La ficha y el chat quedan después del pago único. El sandbox de Mercado Pago sigue pendiente.
- **19/10 · Cursor · Backend de suscripciones** · [PR #155](https://github.com/Facu42/plan-v/pull/155), rama `cursor/suscripciones-pacientes-backend`. Migración `20261020120000_patient_subscriptions` escrita y sin aplicar. Webhook general de Mercado Pago, alta con el token de la nutri, cobro único en Cobranzas, anulación por devolución, conciliación cada 6 horas y links que vencen a los 7 días. Bandera apagada. Sin pantallas del panel. 3.185 pruebas y dos omitidas, tipos y migraciones en verde. La prueba en sandbox de Mercado Pago sigue pendiente. Main (fases 4 y 5) quedó unido a esta rama.
- **19/10 · Cursor · Fase 5 con la fase 4** · Se trajo main (fase 4, #154) a `cursor/panel-nutri-fase-5`. Conviven el armazón, la ficha y Agenda, Cobranzas y Página pública. [PR #153](https://github.com/Facu42/plan-v/pull/153), sin juntar hasta que los controles estén verdes.
- **19/10 · Cursor · Fase 5 comparada y sin WhatsApp** · Capturas en `design/panel-nutri/fase-5/`. [PR #153](https://github.com/Facu42/plan-v/pull/153). WhatsApp salió de Agenda, Cobranzas, Página pública y Conexiones. Los recordatorios abren el chat de la app. El servidor no se tocó.
- **19/10 · Cursor · Cierre fase 5** · Agenda, Cobranzas y Página pública en `cursor/panel-nutri-fase-5`, desde main `6697d28`. [PR #153](https://github.com/Facu42/plan-v/pull/153). Conectar no finge claves. Se conservan transferencias, conciliación, desconectar y el resto de la agenda vieja. Sin SQL remoto. Autorizado por Facundo 19/10 porque Codex sin crédito. La fase 6 sigue pendiente.
- **19/10 · Cursor · Inicio fase 5** · Reserva previa al código en `cursor/panel-nutri-fase-5`, desde main `6697d28`. Agenda, Cobranzas y Página pública. Mercado Pago, Google Calendar y WhatsApp muestran «Conectar» sin fingir conexión. Autorizado por Facundo 19/10 porque Codex sin crédito. Codex sigue con la ficha en `codex/panel-nutri-fase-4`. Sin SQL remoto.
- **19/10 · Codex · Inicio fase 4** · Reserva antes del código en `codex/panel-nutri-fase-4`, desde PR #152. Ficha según boceto: once pestañas conservando las catorce rutas actuales y la lógica de consulta. Dependencia de #152 declarada, un PR propio al cerrar.

- **19/10 · Codex · Inicio fase 3** · Reserva previa al código en `codex/panel-nutri-fase-3`, desde #151 `50c5d21`. Tabla y resumen de pacientes según boceto; se conserva alta/invitación/archivo y permisos. Dependencia declarada de #151 hasta integrarlo; un PR propio al terminar.

- **19/10 · Codex · Cierre fase 2** · [PR #151](https://github.com/Facu42/plan-v/pull/151), `codex/panel-nutri-fase-2`: Inicio conectado con datos reales y metadata autorizada; 3.153 pruebas y dos omitidas, tipos/build/secretos y revisiones independientes aprobados. 13 comprobaciones de navegador y ocho tamaños/temas. [Informe y límites](panel-nutri-rediseno/fase-2-verificacion.md). Sigue fase 3, Pacientes con resumen desplegable. CI en curso, sin SQL remoto.

- **19/10 · Codex · Inicio fase 2** · Reserva previa al código en `codex/panel-nutri-fase-2`, desde main `1f48adf`. #150 integrado con autorización de Facundo; web, API y worker aprobados. Continúa Inicio según el boceto, seguido por las fases restantes, cada una en su rama y PR. Sin cambios de base de producción.

- **19/10 · Codex · Cierre fase 1** · [PR #150](https://github.com/Facu42/plan-v/pull/150), rama `codex/panel-nutri-fase-1`: tema y armazón del boceto #148, submenús reales y menú plegable. 3.132 pruebas y dos omitidas; tipos/build/secretos aprobados; 22 comprobaciones y 72 medidas. [Informe y límites](panel-nutri-rediseno/fase-1-verificacion.md). Sigue fase 2 (Inicio) sobre esta base; sin merge ni producción.

- **19/10 · Codex · Inicio fase 1** · Rama `codex/panel-nutri-fase-1`: reserva del armazón, tema y navegación del panel según #148. Sin tocar PR #147 ni producción. Detalle en [plan y Bitácora](panel-nutri-rediseno/plan.md).

- **19/10 · Claude** · Rama `claude/rediseno-panel-nutri-bocetos-iw3aor`: bocetos del panel nuevo de la nutri (`design/panel-nutri/bocetos.html`, 19 pantallas, 11 pestañas de la ficha, tema oscuro, menú plegable) y plan por fases para que cualquier agente lo desarrolle (`docs/panel-nutri-rediseno/plan.md`). Solo documentos, sin código ni base.

- **16/10 · Codex** · Pedido «dejalo funcional» para videollamadas: comprobado PR131 y SQL de consultas ya publicados; rama nueva `codex/consultas-funcionales` desde main `a2cf37a`. Corrige silencio que bloqueaba resúmenes y último fragmento menor de0,1s. Migración nueva reservada `20261016232547_consultation_silence_summary`, sin modificar las anteriores. Facundo confirmó retención cero activa y Free en Groq; prueba real con dos voces ficticias, transcripción y resumen aprobados. [Informe y habilitación](consultas-habilitacion-2026-10-16.md). Se mantiene el carril de consultas de Codex, sin tocar la integración de otros agentes.

- **16/10 · Claude** · Codex sin saldo: Facundo pidió que Claude ponga al día la pila y la pruebe. Rama `claude/integracion-105` = `codex/nutridesk-release-base` + `main` (`ae19e5c`), sin tocar ramas de Codex. Choques resueltos: teléfono y meta de agua juntos en `server/store.ts` y `ShowroomPatients.tsx`; una prueba de Codex sumó la lectura de la meta de agua. Sigue el mismo método con #106, #107, #108, #115, #123, #127 y #129, cada uno sobre la rama integrada anterior.
- **16/10 · Codex** · Entrega 8 cerrada localmente sobre #127 `5c8ea54`, preservando main `9c56854`, las 25 escenas Nutrigo y guardas de la entrega 7. SARA 2: 930 registros/39 componentes; tres P2 visuales y etiquetas de volumen corregidos con evidencia real 1440/390. Suite propia final **2.999 aprobadas, cero fallos, dos omitidas, 458 archivos**, tipos, build 7,80 s, secretos y manifiesto **18 + tres bases exactas** aprobados. Revisión de código y [QA independiente](sara2-qa-2026-10-16.md) sin P1/P2; 1.787 huellas (`2e5bd04d…`) intactas. [Informe y Regression Guard](sara2-verificacion-2026-10-15.md) e [instructivo vigente](instructivo-plan-v-actualizado-2026-10-15.md). Stash/respaldo conservados. CI de la cabeza propia pendiente de subir el borrador; sin merge, SQL ni proveedores reales. SMTP pospuesto, Groq/ZDR y proveedores pendientes de validación, Kerr manual.
- **15/10 · Codex** · Entrega 8 integrada mediante avance directo sobre #127 `5c8ea54`, conservando main `9c56854`, correo y guardas WhatsApp revisadas, pacing, demo estricto y OCR/CSP. Se recuperaron 930 registros SARA 2 y el control de unidades/definiciones; manifiesto de 18 pendientes + tres bases exactas, sin SQL remoto. Verificación final y revisión independiente en curso; [informe vigente](sara2-verificacion-2026-10-15.md) e [instructivo actualizado](instructivo-plan-v-actualizado-2026-10-15.md). Stash y respaldo permanecen conservados.
- **15/10 · Codex** · Entrega 7 verificada desde #123 `d82c590`, con fuente integrada `b727195`: conserva las cinco mejoras heredadas de demo/pacing, OCR/CSP y todo main hasta `9c56854`. Se cerraron el permiso de correo de la paciente y el bloqueo de WhatsApp incompleto. Suite propia final 2.977/0/2 en 452 archivos, focal 214/28, gates y revisión de código aprobados; QA independiente 1440/390 y 1.789 huellas pos-suite/QA sin cambios. [Estado vigente](nutridesk-release-operaciones-2026-10-15.md). PR115 tiene sesiones reparadas; agenda está en #123, el PR de operaciones queda por crear y SARA 2 sigue separado. Sin merge a main ni activaciones externas.
- **15/10 · Codex** · PR123 hereda el pacing del ensayo revisado: 38 casos focales y tipos/sintaxis/secretos aprobados. Suite de producto con MAIN9c: 2.881/0/2 antes de los tres archivos del ensayo; comparación de1.640 archivos confirma cero cambios del producto. [Informe](main-sync-9c568-2026-10-15.md). Fuente para operaciones con tres excepciones del runner frente a CORE; CI nuevo pendiente.
- **15/10 · Codex** · PR123 actualizado desde su padre revisado para conservar MAIN9c56854, PR119 y122. Suite local actual: 2881 aprobadas, cero fallos, 2 omitidas; 439 archivos. [Informe](main-sync-9c568-2026-10-15.md). Sin merge a main ni SQL remoto.
- **15/10 · Codex** · PR115 hereda el pacing por tráfico real del ensayo signed-auth de PR108, sin tocar límites del producto. Focal propio 38 casos aprobados y tipos/sintaxis/secretos aprobados; CI nuevo pendiente. [Informe](browser-rate-window-2026-10-15.md). Se conserva Historia clínica y el permiso de menú específico.
- **15/10 · Codex** · PR115 actualizado desde su padre revisado para conservar MAIN9c56854, PR119 y122. Focal propio actual: 129 aprobadas, cero fallos; 9 archivos. La suite global actual se verifica en CI; los conteos locales globales anteriores quedan como históricos. [Informe](main-sync-9c568-2026-10-15.md). Sin merge a main ni SQL remoto.
- **15/10 · Codex** · #115 actualizado desde main y la pila: 2.775 pruebas aprobadas, cero fallos y dos omitidas. El fallo del recorrido fue reproducido: comprobaba grabación en lugar de menú. Se corrigieron dos expresiones, conservando permisos separados y bloqueo403; [evidencia](consent-browser-regression-2026-10-15.md). Cabecera clínica y gris original conservados; CI nuevo pendiente. Sin merge a main ni SQL remoto.
- **15/10 · Codex** · PR108: el recorrido de sesiones reales recibió HTTP429 al comprobar una respuesta profesional después de aprobar los treinta casos nativos. Se reemplazó la espera inicial por control del ritmo en todas las ventanas, sólo en el runner local; límites y permisos del producto intactos. Veinte casos propios y treinta y cinco independientes aprobados; fire test detectó la desconexión. [Informe](browser-rate-window-2026-10-15.md). El recorrido completo de CI queda pendiente en la nueva cabeza; se propaga en orden a #115 y #123 antes de separar operaciones.
- **15/10 · Codex** · PR108 actualizado desde su padre revisado para conservar MAIN9c56854, PR119 y122. Focal propio actual: 129 aprobadas, cero fallos; 9 archivos. La suite global actual se verifica en CI; los conteos locales globales anteriores quedan como históricos. [Informe](main-sync-9c568-2026-10-15.md). Sin merge a main ni SQL remoto.
- **15/10 · Codex** · #108 conciliado con main `2d31f9d` y la pila actualizada, preservando síntomas, vistas, avisos, compras, recorridos y el gris original. Suite propia de nutrición: 2.721 aprobadas, cero fallos y dos omitidas; [evidencia](nutridesk-release-nutricion-2026-10-14.md). Sin módulos de agenda/operaciones/SARA ni SQL remoto; CI nuevo pendiente de comprobar sobre su SHA.
- **15/10 · Codex** · PR107 actualizado desde su padre revisado para conservar MAIN9c56854, PR119 y122. Focal propio actual: 126 aprobadas, cero fallos; 8 archivos. La suite global actual se verifica en CI; los conteos locales globales anteriores quedan como históricos. [Informe](main-sync-9c568-2026-10-15.md). Sin merge a main ni SQL remoto.
- **15/10 · Codex** · PR107 incorpora mediante merge la segunda entrega revisada (`88ce8e6`), con main `2d31f9d` y los siete PR nuevos conservados. El único conflicto fue unir exclusiones de OCR local y resultados e2e en .gitignore; se conserva el procesamiento local y su prueba CSP. Informe en `nutridesk-release-importacion-2026-10-13.md`. Sin merge a main ni SQL remoto.
- **15/10 · Codex** · PR106 actualizado desde su padre revisado para conservar MAIN9c56854, PR119 y122. Focal propio actual: 126 aprobadas, cero fallos; 8 archivos. La suite global actual se verifica en CI; los conteos locales globales anteriores quedan como históricos. [Informe](main-sync-9c568-2026-10-15.md). Sin merge a main ni SQL remoto.



- **15/10 · Codex** · PR106 incorpora mediante merge la cabeza revisada de #105 (`a6ab13ae`), con main `2d31f9d` y los siete PR de la paciente/operación conservados. Se repiten los gates propios de consultas y se mantiene Groq apagado y el SMTP pospuesto; informe en `nutridesk-release-consultas-2026-10-13.md`. Sin merge a main ni SQL remoto.
- **15/10 · Codex** · PR105 actualizado a MAIN9c56854 con PR119 y122 preservados; 2.563 pruebas locales aprobadas. Se propaga la misma cabeza por la pila. [Informe](main-sync-9c568-2026-10-15.md). Sin merge a main ni SQL remoto.

- **15/10 · Codex** · Retomada la pila pendiente desde main `2d31f9d`: se preservaron #109, #110, #112, #113, #114, #116 y #117. Primera entrega #105 actualizada con el gris secundario original de Nutrigo y 2.546 pruebas aprobadas; [informe](main-reconciliation-2026-10-15.md). Se propaga en orden hacia #106–#115 y luego agenda/operaciones; sin merge a main ni SQL remoto. La tabla SARA 2 solicitada se implementa en una entrega propia, con 930 registros y 39 componentes; no está publicada ni incluida todavía en esos conteos. La falla de sesiones de #115 se localizó en una comprobación que miraba el permiso de grabación en lugar del de menús; su corrección tendrá evidencia en la cabeza nueva.
- **15/10 · Claude** · Avisos al teléfono (push) de la paciente: tabla nueva `push_subscriptions` (migración `20261015200000`), rutas `/api/push/*`, avisos genéricos desde mensajes de la nutri, plan publicado, recurso indicado y consulta. Toca con una línea `server/messages/routes.ts`, `server/appointments/routes.ts`, `server/plans/routes.ts`, `server/resources/routes.ts`, `public/sw.js` y `patient-notices.tsx`. Apagado sin las claves VAPID. Nada de la pila de Codex.
- **15/10 · Claude** · Cobro a nutricionistas (parte 3): aviso en el panel al vencer; solo lectura únicamente si Facundo la suspende desde /admin (elegido el 15/10, nada automático). Toca `server/index.ts` (dos líneas: el control y la ruta `/api/me/service`) y `NutrigoShowroom.tsx` (una línea, el aviso); el resto en archivos nuevos. Sin migraciones.
- **15/10 · Claude** · Rachas de la paciente en Inicio, en el texto bajo el saludo (`src/features/nutrigo/streak.ts`). Toca con cambios mínimos `src/components/nutrigo/showroom-model.ts` (una línea) y `screens/Home.tsx`; sin migraciones. Facundo pidió seguir con lo propuesto en «Funciones y precios»: próximas acciones, push y cobro a nutricionistas, en PR separados.
- **15/10 · Claude** · Próximas acciones de la nutricionista: la bandeja de Inicio suma «Cuotas vencidas» y «Sin registros hace 7 días». Toca `server/crm/repository.ts`, `src/types/crm-work.ts`, `ProfessionalWorkQueue.tsx` y su CSS (cambios chicos; la pila de Codex no los modifica). Sin migraciones.

- **15/10 · Claude** · #117: lista del súper de la paciente agrupada por comercio (los seis colores del widget del archivo) y «Compartir lista» por WhatsApp o copiada. Solo toca `screens/Shopping.tsx`, `screens/shopping-format.ts` y una traducción; nada de la base ni de la pila de Codex. #116 y #117 juntados a `main` con el «junta el 116 y 117 a main» de Facundo.
- **15/10 · Claude** · Con el «juntalo al main» de Facundo se juntaron #109 (estos documentos) y #114 (recorridos de punta a punta y monitor). Codex dejó un quinto borrador, #115 (ficha clínica, laboratorio y PDF), anotado en carriles. #116: aviso en la campanita de la paciente cuando la nutri le indica un recurso y no lo leyó (el de plan nuevo ya existía). Toca con cambios mínimos `src/features/nutrigo/patient-notices.tsx` y `screens/Resources.tsx`; sin migraciones.
- **14/10 · Claude** · Comparación de #105 con Figma: la app de la paciente queda igual que en `main` (20 pantallas); el panel cambia el gris de textos secundarios. [Informe](coordinacion/comparacion-pr105-figma-2026-10-14.md).
- **14/10 · Claude** · PR #110 (vistas de la paciente solo lectura, migración `20261015090000`). PR #111 (la IA pide `data_collection: deny`) cerrado: Facundo eligió dejar la IA gratis como está. Ninguno toca archivos de la pila de Codex.
- **14/10 · Facundo** · Gris de textos chicos del panel de la nutricionista: **el de Nutrigo (`#8A8C90`)**, no el `#52545B` de #105. Antes de juntar #105, volver ese gris al de Nutrigo (Codex o quien lo junte).
- **14/10 · Claude** · Documentos 01–07 y competencia subidos a `docs/producto/` y corregidos contra
  `main`, los PR, las ramas de Codex y Supabase. Creado este archivo. Comprobado en producción:
  todas las migraciones de `main` aplicadas; las vistas de paciente de turnos, ingreso y mensajes
  siguen aceptando escrituras (arreglo en un PR propio de Claude).
- **13/10 · Codex** · Pila #105–#108 y copia integrada `codex/nutridesk-core` (respaldada como
  `respaldo/codex-nutridesk-core`). Ver `docs/nutridesk-integracion-2026-10-13.md` en esa rama.
- **15/10 · Claude** · PR #112: ánimo y síntomas de la paciente (diálogo «Cómo me siento» en el Diario; la nutri los ve en «Registros y evolución»). Toca con cambios mínimos `server/store.ts`, `src/types/index.ts`, `ShowroomProgress.tsx` y `screens/Diary.tsx`.
- **14/10 · Claude** · Con la frase «aplicá las migraciones de vistas y síntomas en la base» se aplicaron en producción las de #110 y #112. Verificado: las siete vistas de la paciente quedan solo lectura y `habit_logs.symptoms` existe con su regla. Las dos son repetibles sin daño. #110 y #112 siguen sin juntar a main.
- **14/10 · Claude** · Con el «juntalo al main» de Facundo se juntaron #110 y #112. Vercel y Railway publicaron sin errores (API arriba con la base). Nuevo carril de etapa 1: recorridos de punta a punta en modo demo y monitor de producción (rama `claude/recorridos-e2e`); no toca archivos de Codex salvo `package.json`, `vite.config.ts` y `ci.yml` con cambios mínimos.
- **15/10 · Claude** · Rama `claude/actividad-paciente`: actividad y rutina reales en Inicio, pasos en Diario y en la ficha de la nutri. Toca con cambios mínimos `screens/Home.tsx`, `screens/Diary.tsx`, `features/nutrigo/PatientApp.tsx` y `ShowroomProgress.tsx`. Sin migraciones.
- **15/10 · Claude** · Rama `claude/mensajes-al-instante`: la app de la paciente trae mensajes nuevos sola (cada 15 s con el chat abierto, cada 60 s en el resto, y al volver a la pestaña). Nuevo `features/nutrigo/use-live-refresh.ts` y dos líneas en `PatientApp.tsx`. Sin base ni pantallas nuevas.
- **15/10 · Claude** · Rama `claude/recordatorio-consulta-push`: aviso al teléfono «Mañana tenés consulta» 24 h antes de cada consulta agendada. Nuevo `server/push/reminders.ts`, un texto en `server/push/push.ts` y una línea en `server/jobs/worker.ts`. Sin base. Necesita las claves de avisos también en el servicio worker de Railway.
- **16/10 · Claude** · Rama `claude/meta-de-agua`: meta de agua por paciente (4 a 16 vasos) que elige la nutri. Toca con cambios chicos `ShowroomPatients.tsx`, `PatientOverview.tsx`, `screens/Home.tsx`, `Diary.tsx`, `Progress.tsx`, `showroom-model.ts`, `supabase-repo.ts` y `contracts.ts`. Migración `20261016090000_water_goal`, aplicada el 16/10.
- **15/10 · Claude** · Rama `claude/super-unidades-locales`: la lista del súper muestra cantidades como se piden en el comercio (1/2 kg, 1,5 l, 1 docena). Cambia `screens/shopping-format.ts` y una celda de `screens/Shopping.tsx`. Sin base.
- **17/10 · Claude** · Rama `claude/indices-base` (reemplaza al PR #27): migración `20261017010000_performance_indexes`, índices para toda clave foránea de `public` y `private` y 7 reglas con `(select auth.uid())`. Una migración nueva de Codex con claves foráneas tiene que traer su índice (lo exige `server/db-performance.postgres.test.ts`).
