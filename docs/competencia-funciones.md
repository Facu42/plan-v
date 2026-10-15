# Competencia: funciones y precios (Nutriboost · NutriDesk · Plan V)
Relevado 14/10/2026. Fuentes: NutriDesk → https://nutrideskapp.com/ (home completa, leída con curl) y https://www.nutripass.net/recursos/software-nutricionistas-argentina-comparacion (comparativa de un competidor, usar con cuidado). Nutriboost → https://nutriboost.ar (texto en `/workspace/nutriboost/page.txt`) + demo Loom (`/workspace/nutriboost/funciones-nutriboost.md`). Plan V → `01-PRD.md`.
Leyenda Plan V: ✅ en prod · 🟡 parcial · 🔜 en código/PR · ❌ planeado. "s/d" = no encontrado en las fuentes (no quiere decir que no exista).
Ojo: **getnutridesk.app** (iPhone, inglés) y **nutridesk.net** (ruso) son otras apps. La nuestra es nutrideskapp.com (@nutrideskapp, AR).

## Video explicativo de NutriDesk
- "NutriDesk por dentro, en 1 minuto": video propio en la home, https://nutrideskapp.com/landing-hero-720.mp4 (MP4, 4,5 MB; HTTP 200 verificado). Arranca en silencio (botón "Activar sonido"). No es de YouTube, así que no hay subtítulos automáticos ni transcripción; no se transcribió.
- No se encontró canal ni demo de NutriDesk en YouTube. También hay un testimonio de 20 s (Lic. Hebe Gomez Bequi) en `/screenshots/testimonios/video/hebe-gomez.mp4`.

## Lado nutricionista
| Función | Nutriboost | NutriDesk | Plan V |
|---|---|---|---|
| Tablero de inicio | ✅ resumen + "próximas acciones" con IA | ✅ citas del día, planes pendientes, pacientes activos, ingresos del mes | 🟡 sin indicadores (PR #67) |
| Asistente IA / resumen diario | ✅ resumen de la mañana con prioridades | Lía, asistente IA 24/7 (Pro); no dice si es para la nutri o el paciente | ❌ (es el diferencial del brief) |
| Insights de riesgo de abandono | ✅ | s/d | ❌ |
| Historia clínica / anamnesis | ✅ | ✅ antecedentes, objetivos, notas por consulta | 🟡 ficha con pestañas, Planificación ✅ |
| Importar fichas viejas (Excel/Word/PDF/fotos) con IA | s/d | ✅ | ❌ (en "Externo": importador CSV) |
| Laboratorios leídos por IA | s/d | ✅ | ❌ |
| Notas de consulta grabadas/transcriptas con IA | s/d | ✅ "Notas Pro" | ❌ |
| Antropometría (pliegues, perímetros, 5 componentes Kerr) | s/d (mediciones con gráficos) | ✅ + PDF para el paciente | 🔜 (#89) |
| PDF de balanza / bioimpedancia autocargado | ✅ InBody, Femto | ✅ con segmental | ❌ (fase 2) |
| Seguimiento bariátrico | s/d | ✅ (Pro) | ❌ |
| Editor de plan con macros en vivo | ✅ semana, micros | ✅ +2.000 alimentos, totales por comida | ✅ semanal, versiones, publicar |
| Plan por intercambios / equivalencias | ✅ equivalencias | ✅ intercambios por grupo; el paciente elige | ❌ (página "Equivalencias") |
| Plan generado con IA (con OK de la nutri) | ✅ "la IA hace el trabajo pesado" | ✅ (Pro) | ❌ |
| Base de alimentos | SARA 2, ArgenFoods, USDA | +2.000 alimentos (origen s/d) | catálogo propio ✅ |
| Recetas | +850/1.000 recetas argentinas | ✅ menú semanal y recetas | ✅ (solo por link) |
| Plantillas/modelos de plan | ✅ | ✅ | ✅ |
| PDF del plan con marca | ✅ con logo | ✅ logo, teléfono, Instagram | 🟡 impresión sin logo |
| Revisión de comidas del paciente | ✅ feed de fotos con "me gusta" | s/d (sí ve el diario con foto) | ✅ confirmar/ajustar |
| Adherencia / progreso global de cartera | ✅ | ✅ "estadísticas de tu consultorio" (detalle s/d) | 🔜 (#93) |
| Agenda | s/d detalle | ✅ varias agendas, tipos de consulta, bloqueos, Google Calendar y Meet | 🟡 solo lectura |
| Reserva online por link | ✅ desde página pública | ✅ + cobro de seña o total | ❌ (fase 4) |
| Recordatorios de turno | ✅ prometido | mail (Inicial), WhatsApp con confirmación de un botón (Pro) | ❌ (correo D3; WhatsApp fuera de alcance) |
| Cobros | ✅ Mercado Pago, efectivo, transferencia, link y recurrente | ✅ Mercado Pago o transferencia, tarifas por tipo de consulta | ✅ manual · Mercado Pago ❌ |
| Mensajes / difusiones | ✅ chat | difusiones a todos (Pro); chat 1 a 1 s/d | 🟡 sin tiempo real |
| Página pública (bio de IG) | ✅ paquetes con precio | link de reserva | ❌ |
| Equipo / multi-profesional | ✅ plan Consultorio | ✅ cada uno ve sus pacientes + rol recepción | ❌ (tablas existen) |
| Formación / ayuda | Academy + centro de ayuda | soporte por WhatsApp con los desarrolladores | ❌ |

## Lado paciente
| Función | Nutriboost | NutriDesk | Plan V |
|---|---|---|---|
| Cómo accede | app en Google Play y App Store (según su home) | portal web instalable, "sin instalar nada" | PWA solo por invitación ✅ |
| Ver plan, menú y recetas | ✅ | ✅ | ✅ |
| Diario de comidas con foto | ✅ | ✅ | ✅ (IA opcional; texto sin IA PR #101) |
| Revisión de la nutri visible para el paciente | s/d | s/d | ✅ pendiente/confirmada/ajustada |
| Elegir alternativas | s/d ("muchos reemplazos" en insights) | ✅ elige de la lista de cada grupo | ❌ (la landing lo promete) |
| Lista del súper desde el plan | ✅ diferencial: por comercio y en unidades locales | ✅ (Pro) | 🟡 sin agrupar ni compartir |
| Agua, peso, ánimo | ✅ agua, peso, ánimo | evolución visible; registros s/d | agua/sueño/pasos 🟡 · peso ✅ · ánimo ❌ |
| Rachas | ✅ | s/d | ❌ |
| Chat con la nutri | ✅ | s/d | 🟡 |
| Reservar y pagar turnos | s/d | ✅ | 🟡 confirmar / pedir cambio |
| Archivos y estudios | s/d | ✅ | ✅/🟡 |
| Asistente IA para el paciente | s/d | Lía 24/7 (Pro) — destinatario s/d | ❌ |
| Objetivo y su estado | s/d | s/d | 🔜 (D1) |
| Ejercicio / rutina | metas en "Recomendaciones" | s/d | 🟡 |
| Cuota y "avisé que pagué" | s/d | paga turnos online | ✅ (impaga no bloquea) |
| Push | s/d (tiene app de tiendas) | s/d | ❌ |

## Precios publicados (ARS por mes)
| Producto | Planes | Condiciones | Fuente |
|---|---|---|---|
| Nutriboost | Individual $15.000 (hasta 10 pacientes nuevos/mes) · Profesional $47.000 (ilimitado, app + lista, IA completa) · Consultorio $57.000 | Anual 50% off al crear la cuenta; garantía de 7 días | https://nutriboost.ar (relevado sep/oct 2026, `nutriboost/funciones-nutriboost.md`) |
| NutriDesk | Inicial $35.000 (hasta 50 pacientes activos, recordatorios por mail) · Pro $64.800 (ilimitado, Lía, planes con IA, WhatsApp, difusiones, bariátrico) · varios profesionales: $64.800 el primero + $35.000 cada uno | Anual −20%; sin permanencia; "garantía de cumplimiento" (devolución si no hace lo prometido); pago por Mercado Pago, sin prueba gratis (según NutriPass); fuera de AR, activación manual | https://nutrideskapp.com/ |
| Plan V | s/d — decisión abierta | suscripción manual hoy | `01-PRD.md` §6 |

Métricas que NutriDesk publica (oct 2026, no verificables): +250 profesionales, +6.000 pacientes, +43.100 comidas registradas, +8.200 mediciones, +6.700 turnos. Fundadores: Lic. Camila S. Revuelta (nutricionista) y Santiago (desarrollador).
