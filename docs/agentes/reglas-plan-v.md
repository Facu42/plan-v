# Reglas de Plan V para los agentes

Todos los agentes de `.claude/agents/` vienen de
[agency-agents](https://github.com/msitarzewski/agency-agents) (licencia MIT, copia en
`.claude/agents/LICENSE-agency-agents`). Su texto está en inglés y es genérico. En Plan V
mandan estas reglas por encima de lo que diga cada agente.

## Cómo se usan

- Cualquier sesión de Claude Code abierta en este repositorio los ve. Se llaman por nombre:
  "usá el agente `appsec-engineer` para revisar…", o desde la herramienta de subagentes.
- Cada apartado de `docs/plan-apartados.md` tiene un agente que lo lidera y otros de apoyo.
  El hilo que toma un apartado trabaja con esos agentes y con nadie más, salvo que lo justifique.
- Al terminar, el agente `reality-checker` revisa que lo hecho funciona de verdad, y
  `code-reviewer` revisa el cambio antes del PR.

## Reglas del proyecto

1. **Idioma.** Toda la app y todo lo que lee Facundo va en español simple, sin jerga ni
   nombres de variables. Los agentes pueden pensar en inglés, pero lo que escriben para
   personas va en español.
2. **Diseño exacto al archivo de Nutrigo** (Figma `OTolnKfsxUFjaZOhhdb04i`). Si Plan V se
   aparta del archivo, gana el archivo, sin preguntar. Los valores se leen del archivo con
   `get_design_context`, nunca de capturas ni a ojo. Lo que el archivo no dibuja se resuelve
   con un default razonable y se dice cuál. Ver `design/nutrigo-fidelity.md`.
3. **Tablet no se desarrolla** por ahora (decidido el 2026-09-22). Escritorio 1440 y móvil 390.
4. **Producción.** La web (Vercel), la API y el worker (Railway) se publican solos en cada
   merge a `main`. La base es Supabase, proyecto `plan-v-app`. Cualquier cambio en la base
   de producción, en la configuración de producción o en servicios pagos necesita antes el
   OK escrito de Facundo.
5. **Una rama y un PR por apartado.** Nada directo a `main`. Antes del PR: `npm test`,
   `npm run check` y, si hay migraciones, `npm run check:migrations`.
6. **Registrar siempre.** Cada hilo anota lo avanzado y lo analizado en su sección de
   `docs/plan-apartados.md` (o en un archivo propio enlazado desde ahí). El archivo
   `docs/registro-producto-listo.md` es del hilo "Plan V listo para el mercado": no se edita
   desde otros hilos.
7. **Datos de salud.** Lo que cargan las pacientes es información de salud. Nunca se copia a
   herramientas externas, capturas públicas ni publicidad sin permiso.
8. **Antes de pedirle algo a Facundo, comprobarlo uno mismo.** Después se le pide una sola
   cosa exacta, con el valor listo para pegar.
