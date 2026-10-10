# Mediciones de la ficha (nutricionista) · 2026-10-10

Siguiente apartado del dashboard según `pendientes-dashboard-nutriboost-2026-10-08.md` (puntos 3 y 4) y el plan v3 §4.2
(Nutriboost, visto 1:10–1:30 según ese documento; no se pudo volver a ver el video en esta sesión).

## Qué hay
- En la ficha, pestaña «Registros y evolución», un bloque «Cuerpo y evolución» con tres grupos: Básicas (altura, peso, cintura,
  cadera), Composición corporal (grasa %, masa grasa, músculo %, masa muscular, agua, proteína, grasa visceral, metabolismo basal,
  edad metabólica) y Perímetros (abdominal, hombros, pectoral, brazo, muslo).
- Cada métrica es la tarjeta de estadística del archivo de Nutrigo (`NvMetric`): último valor, fecha y variación. Sin dato dice
  «Sin dato», nunca cero.
- Detalle por métrica: período (todo, 90 o 30 días), mínimo, promedio, máximo, gráfico con descripción en texto e historial con la
  diferencia contra el registro anterior y marca de la última. No mezcla unidades.
- «Cargar mediciones»: un formulario por fecha con todas las métricas; lo vacío no se guarda. Reintento seguro (mismo id).
- Peso, cintura y cadera siguen su camino anterior (registros de seguimiento, que alimentan el progreso de la paciente).
  Las métricas nuevas se guardan juntas, todo o nada, con la función `save_body_metrics`.

## Seguridad
Sólo la profesional asignada puede cargar; hace falta el permiso «medidas» vigente de la paciente; otro consultorio y la
paciente no pueden. Las unidades las fija la base. Pruebas en PostgreSQL descartable: `server/care/body-metrics.postgres.test.ts`.

## Estado
- Migración `20261010120000_body_metrics.sql` **preparada, sin aplicar en producción** (necesita la frase escrita de Facundo).
- Sin tocar la pantalla de la paciente. Sin móvil propio (sólo se adapta a 2 columnas). Academy excluida.
- IMC con el último peso (kg) y la última altura, referencia general (CDC, desde los 20 años) ya existente en Planificación.
- Pendiente de este apartado: medidores de composición con rangos de referencia, importación de PDF de balanza (femmto/InBody) con vista
  previa, columnas configurables en la lista de pacientes. Los valores de referencia necesitan fuente clínica.
