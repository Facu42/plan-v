# Coordinación entre agentes (Claude, Codex, Cursor)

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
| Agenda pública y reservas, varias agendas, Google, Mercado Pago, equipo y recepción, laboratorio, bariátrico, difusiones por WhatsApp, asistente de cartera, ayuda | Codex | rama `respaldo/codex-nutridesk-core` (sin PR) | En código, sin PR. Se separa en entregas cuando Codex vuelva |
| Lo que Codex dejó sin guardar en la PC de Facundo: importar pacientes (otra versión), Equivalencias (otra versión), asistente con IA para la cartera | Codex | solo en la PC (sin respaldo) | Espera la frase de Facundo para respaldarlo |
| Seguridad y operación (vistas de paciente solo lectura, privacidad de la IA, staging, monitoreo, respaldo de archivos) | Claude | ramas `claude/*` | En curso |
| Comparación de #105 con Figma y orden de juntado de la pila de Codex | Claude | `docs/coordinacion/` y comentarios en los PR | #105 comparado el 14/10. Claude no empuja a ramas de Codex |
| Lado paciente que Codex no tocó: ánimo y síntomas, rachas, lista del súper por comercio y compartir, avisos de recurso asignado y plan nuevo, push | Claude | ramas `claude/*` | Por empezar |
| Alternativas por comida (la paciente elige) | Claude | — | **Espera a que #108 esté en `main`** (usa sus intercambios) |
| Página pública con paquetes, resumen de la mañana para la nutri, Centro de ayuda | — | — | **En espera.** Codex tiene piezas parecidas; Facundo decide cuál sigue |

## 2. Reglas para no pisarse

1. **Ramas.** Claude trabaja en `claude/*`, Codex en `codex/*`, Cursor en `cursor/*`. Nadie empuja a
   ramas de otro ni a `respaldo/*`. Un PR por tema. Nada directo a `main`.
2. **Migraciones.** Codex tiene reservado `20261011140000` a `20261014235959` (sus 17 migraciones).
   Claude usa fechas desde `20261015000000`. Si Codex vuelve, usa fechas posteriores a la última que
   figure en `main` **y** en la tabla de abajo. Nunca se edita una migración ya escrita por otro.
   Solo Facundo autoriza aplicar migraciones en producción, con su frase escrita.
3. **Archivos compartidos.** La pila de Codex toca estos archivos de uso común. Claude los evita o hace
   cambios mínimos y los anota acá:
   `server/index.ts`, `server/store.ts`, `src/store/useAppStore.ts`, `src/types/index.ts`,
   `src/main.tsx`, `vite.config.ts`, `src/components/nutrigo/*` (55 archivos),
   `src/features/nutrigo/*` y las rutas de `care`, `foods` y `targets`.
4. **Orden de juntado.** Primero la pila de Codex, en orden **#105 → #106 → #107 → #108**, después de
   la prueba con Verónica. Los PR de Claude son chicos: si se juntan antes, Codex hace merge de
   `main` en su pila; si se juntan después, Claude hace merge de `main` en su rama.
5. **Diseño.** La app de la paciente es **igual a Nutrigo, colores incluidos**. Regla fija (Facundo, 14/10).
6. **Al terminar cada tarea**, el agente agrega una línea a la bitácora (sección 5) y actualiza la tabla
   de carriles. Lo largo va en su propio informe en `docs/` y se enlaza.

## 3. Migraciones reservadas o en curso

| Rango o archivo | Dueño | Estado |
|---|---|---|
| `20261011140000_clinical_ai_budget` … `20261013123000_imported_clinical_export` (17 archivos, manifiesto en `docs/deployment/nutridesk-migrations-2026-10-13.json` de la rama de Codex) | Codex | Sin aplicar |
| `20261015090000_patient_views_read_only` | Claude | PR #110, sin aplicar: espera la frase de Facundo |
| `20261015*` en adelante | Claude | Se anotan acá al crearlas |

## 4. Decisiones vigentes de Facundo (fechadas)

| Fecha | Decisión |
|---|---|
| 22/9 | "Exacto a Nutrigo": si Plan V se aparta del archivo, gana el archivo |
| 11/10 | No se usan mensajes por mail por ahora |
| 14/10 | La app de la paciente es igual a Nutrigo, colores incluidos. Regla fija |
| 14/10 | Claude puede seguir desarrollando por carriles, sin pisar lo de Codex |
| 14/10 | Documentos de producto ordenados en `docs/producto/` |

Pendientes de decidir (con recomendación en `docs/producto/07-decisiones-recomendadas.md`): precio y
prueba gratis, presupuesto de IA en producción, proveedor de correo cuando se use, Android, métricas
del piloto, entidad legal.

## 5. Bitácora de traspaso (la más nueva arriba)

- **14/10 · Claude** · Comparación de #105 con Figma: la app de la paciente queda igual que en `main` (20 pantallas); el panel cambia el gris de textos secundarios. [Informe](coordinacion/comparacion-pr105-figma-2026-10-14.md).
- **14/10 · Claude** · PR #110 (vistas de la paciente solo lectura, migración `20261015090000`) y PR #111 (la IA pide `data_collection: deny`; espera decisión de Facundo). Ninguno toca archivos de la pila de Codex.
- **14/10 · Claude** · Documentos 01–07 y competencia subidos a `docs/producto/` y corregidos contra
  `main`, los PR, las ramas de Codex y Supabase. Creado este archivo. Comprobado en producción:
  todas las migraciones de `main` aplicadas; las vistas de paciente de turnos, ingreso y mensajes
  siguen aceptando escrituras (arreglo en un PR propio de Claude).
- **13/10 · Codex** · Pila #105–#108 y copia integrada `codex/nutridesk-core` (respaldada como
  `respaldo/codex-nutridesk-core`). Ver `docs/nutridesk-integracion-2026-10-13.md` en esa rama.
