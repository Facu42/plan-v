# Plan V — contexto confirmado

Dashboard web de la nutricionista y espacio de la paciente. Este hilo desarrolla el consultorio web; dashboard móvil y Academy quedan fuera de alcance por decisión de Facundo.

La profesional gestiona pacientes, ficha, ingreso, registros, objetivos, planificación, versiones de planes, turnos, mensajes, alimentos, recetas, recursos, modelos y cobranzas. Las acciones usan la API y los permisos existentes. La IA propone; la profesional revisa antes de publicar. Datos ficticios en capturas de desarrollo.

Objetivo: comodidad diaria, información legible, acciones funcionales y diseño agradable con movimiento breve. Referencia funcional: Nutriboost, contrastado antes de desarrollar. Identidad visual confirmada: Nutrigo original, Poppins y sus componentes/colores. ECC exige pruebas primero y revisión.

Registro semanal separa días registrados, comidas y agua. Ausencia no equivale a incumplimiento. Pendientes son registros sin revisar. Agua sin registro es desconocida; cero declarado es dato válido. No exigir peso numérico para objetivos. Aplicar modelos crea borrador conservando anterior; recomendaciones se agregan sin duplicados.

Funciones futuras se muestran con estado explícito y alcance del plan, sin formularios que aparenten estar operativos. Producción y servicios pagos requieren autorización específica. El plan completo se mantiene en docs/plan-apartados.md y documentos enlazados.

## Platform
web
