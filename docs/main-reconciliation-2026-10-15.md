# Conciliación con el trabajo ya integrado en main · 15/10/2026

Revisión contra `2d31f9ddc70d08dead50c26295a409bde16ac960`, sin escribir en main ni aplicar SQL remoto. Se conservaron los PR 110 (vistas de paciente de solo lectura), 112 (ánimo y síntomas), 109 (coordinación y documentos), 113 (guías), 114 (recorridos y monitor), 116 (aviso de recurso indicado) y 117 (compras por comercio y compartir).

La comprobación independiente encontró 71 archivos cambiados por esos PR: 65 idénticos a main en esta entrega y seis contratos compartidos ampliados de forma compatible con teléfono, paginación y recuperación. Los 25 JSON originales de Nutrigo permanecen intactos. No se recuperaron copias antiguas encima de los cambios nuevos de la paciente.

El gris secundario del panel vuelve al token original `--nv-muted` (`#8A8C90`), conforme a la indicación registrada el 14/10. Se conservaron los usos previos legítimos del otro gris; la regresión comprueba los textos secundarios concretos. Fire test: restaurar temporalmente el cambio de gris anterior produce un fallo; al volver al CSS correcto, siete pruebas de tema y monitor aprueban.

Las dos migraciones de main fueron observadas ya aplicadas en Supabase el 14/10: `20261015090000_patient_views_read_only.sql` bajo el alias `20261014215529`, y `20261015100000_habit_symptoms.sql` bajo `20261014215543`. Esa comprobación fue de metadatos, sin leer fichas clínicas. No deben ofrecerse otra vez como SQL pendiente. El manifiesto de la entrega integrada las controla por identidad y hash separados del paquete nuevo.

## Regression Guard · primera entrega actualizada

- Flujos: hábitos/síntomas, vistas de paciente, avisos y compras conservados; acceso, cartera completa, teléfono y fotos cubiertos por la suite. Recepción de correo externo sigue pendiente del remitente pospuesto por el usuario.
- Regresiones y contratos: conservación de síntomas al editar otro hábito, vistas sin escritura, aislamiento de consultorio, paginación completa y gris original. Revisión independiente: 67 casos de servidor aprobados; el falso positivo inicial del test de estilo quedó acotado y aprobado.
- Migraciones: archivos de main intactos y ya aplicados; teléfono continúa aditivo y pendiente de autorización para producción. Ninguna modificación remota realizada por esta conciliación.
- Verificación propia: **2.546 aprobadas, cero fallos y dos omitidas; 374 archivos**. Tipos web/servidor/recorridos, compilación (7,28 s), migraciones y límites de secretos aprobados. Siete casos focales de estilo y monitor aprobados. No hay script de lint. Las advertencias de tamaño del bundle permanecen.
- Automatización: las pruebas heredadas protegen los cambios de los otros PR y el manifiesto integrado distingue SQL aplicada de pendiente. La prueba del monitor se ejecuta con Vitest; una invocación exploratoria con el ejecutor de Node no era compatible y no requirió cambiar el producto.
- Veredicto: primera entrega preparada para revisión, sin publicación. Las siguientes ramas deben incorporar esta cabeza en orden; sus números de pruebas anteriores siguen siendo históricos hasta repetir su verificación.

Evidencia local: `%TEMP%/planv-release1-main-latest-20261015.json`, `planv-main-sync-independent-proof-20261015.json`, `planv-nutrigo-gray-targeted-red-20261015.json` y `planv-nutrigo-gray-monitor-green-20261015.json`. No contienen claves ni datos de pacientes reales.
