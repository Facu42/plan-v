# Corte 77 — Avisos de próximas consultas

**Fecha:** 2026-09-16

## Qué se hizo

- Campana en la barra superior para paciente y nutricionista.
- Avisos derivados de la próxima ocurrencia publicada (hasta 7 días): En breve / Hoy / Mañana / Esta semana.
- En Inicio, franja si el aviso es hoy, mañana o en breve.
- «Listo» oculta el aviso en ese dispositivo (`localStorage`). No hay push, mail ni timezone distinta a la del navegador.

## Verificación

- Suite: 70 archivos, 360 pruebas.
- `tsc` frontend y servidor.
- Navegador: campana paciente con consulta de Sofía; campana nutricionista con las próximas del consultorio.

## Sigue abierto

- Push, mail, timezone y conflictos.
- Recordatorios de comidas/hábitos.
