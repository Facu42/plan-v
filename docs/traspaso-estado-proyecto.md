# Traspaso del proyecto (2026-10-01)

Una sola página para que cualquier agente (Claude, Codex u otro) siga sin tener el chat.
Los detalles de cada tema están en los archivos que se nombran. Este archivo se actualiza
cuando cambia algo de lo de abajo. Sin claves ni secretos: esos los tiene Facundo.

## Qué es y cómo se trabaja

- Plan V: app para que nutricionistas acompañen a sus pacientes (plan, comidas, medidas, turnos,
  mensajes, cobranzas). Facundo la desarrolla y la vende; **no** es nutricionista ni paciente:
  ningún flujo debe pedirle convertir su cuenta. Su cuenta de Google es paciente y administradora.
- Se comunica en español y quiere respuestas simples, sin jerga. Si hay algo para comprobar, se
  comprueba solo (con conectores o navegador) y recién después se le pide **una** cosa exacta, con el
  valor listo para pegar.
- Reglas completas: `docs/agentes/reglas-plan-v.md`. Las más importantes: diseño exacto al archivo
  de Nutrigo (Figma `OTolnKfsxUFjaZOhhdb04i`; si Plan V se aparta, gana el archivo); escritorio 1440 y
  móvil 390 (tablet no); una rama y un PR por tema; nada directo a `main`; todo cambio en la base de
  producción o en servicios pagos necesita su frase escrita (un "ok" suelto no alcanza).
- Antes de un PR: `npm test`, `npm run check` y, si hay migraciones, `npm run check:migrations`.
  Para ver la app con datos de ejemplo: `npm install`, `npm run local` y "Continuar en modo demo".

## Dónde vive todo

- Código: https://github.com/Facu42/plan-v. Cada merge a `main` publica solo la web (Vercel,
  https://plan-v-eight.vercel.app) y la API con su worker (Railway, ambos desde `main`).
- Base: Supabase, proyecto `plan-v-app` (Pro desde el 30/9, copia diaria de 7 días). La API solo
  acepta los orígenes de `CORS_ORIGINS` (Railway).
- Panel de administración: https://plan-v-eight.vercel.app/admin (entra con su Google).

## Lo hecho (publicado en `main`)

- Producto listo para usar de punta a punta, diseño Nutrigo en 13 pantallas: `docs/registro-producto-listo.md`.
- Seguridad y privacidad: términos y privacidad, 34 funciones internas cerradas en la base:
  `docs/seguridad-privacidad.md`, `docs/legal/`.
- Correcciones posteriores al PR #40 ya aplicadas en la base: datos corporales y
  metas cerrados tras el retiro, validación y cálculo dentro de la base y meses
  pagados corregidos. Dos migraciones verificadas, sin contratar recursos:
  `docs/correcciones-funciones-sensibles-2026-10-01.md`.
- Diseño y movimiento, carga y errores, primer uso de la nutricionista, accesibilidad, botones del
  celular: `docs/diseno-movimiento.md`.
- Ingreso con Google y pantalla "Antes de seguir": `docs/autenticacion.md`.
- Cobranzas, Pagos de la paciente y Panel del servicio (altas, cuentas de prueba, actividad):
  `docs/cobros-y-panel.md`.
- Calorías y macros (Mifflin-St Jeor) con migración aplicada: `docs/calorias-macros.md`.

## Lo pendiente

- Seguridad, punto 4: prueba con cuatro sesiones reales en Supabase temporal de
  GitHub realizada. Se encontró lectura de notas profesionales por una política
  legacy de paciente. Migración `20261001193156_close_legacy_patient_row_access.sql`
  preparada y probada, **sin aplicar en producción**: requiere autorización escrita
  para el cierre y comprobación posterior. Ver `docs/sesiones-aislamiento-2026-10-01.md`.
  La prueba con navegador y app publicada sigue pendiente. El punto 3 está
  clasificado: las 16 tablas están cerradas al acceso directo; 38 pruebas locales
  nuevas lo protegen. Ver `docs/clasificacion-tablas-internas-2026-10-01.md`.
  Las 34 funciones internas siguen cerradas y las 116 públicas coinciden con la
  lista actual. Las tres correcciones confirmadas de los puntos 1 y 2 están
  aplicadas; evidencia anterior y posterior en los informes de funciones sensibles.

- Abiertos sin juntar: #27 base de datos (63 índices; en verde, necesita su frase "aplicá índices en la
  base"), #24 marketing (borrador, no toca la app), #25 documentación.
- Trabajo local del 27/9 en la PC de Facundo (Consejos, detalle de consejo, ficha de receta, Menú
  saludable): rama `codex/pv47-recetas-consejos`, sin juntar con `main`.
- Cobro a nutricionistas (prueba gratis y, sin pago, solo lectura sin borrar nada): falta que
  Facundo cargue el precio mensual y decida los días de prueba (30 por defecto).
- Prueba real de punta a punta con una nutricionista y una paciente.
- Mails: confirmar cómo se mandan (Supabase sin costo o Resend con marca propia).
- Calorías: aviso al pedir los datos (hoy solo dentro de la app) y revisión del consentimiento con abogado.
- Revisión legal (13 puntos en `docs/legal/revision-legal.md`).
- App para tiendas (Android primero, empaquetando la web), calidad en producción, publicidad paga y
  página pública con precios (espera el precio). Plan: `docs/plan-apartados.md`.

## Lo que espera de Facundo

- Probar con las cuentas de prueba (ver abajo): panel, Cobranzas, Pagos, calorías.
- Cargar el precio mensual y decidir los días de prueba.
- Elegir cómo mandar mails y si Marketing promociona desde cuenta nueva (`@planv.app`) o desde `@planv.nutricion`.
- Google: generar un secreto nuevo del cliente, completar "Información de marca" y publicar la app.
- Marketing: autorización de Verónica y créditos de Higgsfield.

## Cómo probar con cuentas de prueba

1. Entrar a `/admin` con su cuenta de Google, pestaña "Cuentas de prueba".
2. Escribir su mail y una clave de 10 o más caracteres. Se crean, ya confirmadas y vinculadas, una
   nutricionista (`usuario+plan-v-nutri@dominio`) y una paciente (`usuario+plan-v-paciente@dominio`),
   la paciente con datos de ejemplo y sin cargo.
3. Entrar en https://plan-v-eight.vercel.app con esos mails y esa clave (no hace falta abrir el mail;
   con Gmail llegan a la misma casilla). La primera vez pide aceptar términos ("Antes de seguir").
   Para ver el primer uso de una nutricionista vacía, crear otra desde la pestaña de altas ("Crear con clave").

## Cómo se registra

- Cada tema anota lo avanzado en su archivo de `docs/` (arriba) o en `docs/plan-apartados.md`.
- El estado resumido del proyecto vive además en la memoria compartida del proyecto en Claude; este
  archivo es la copia para quien no la tiene.
