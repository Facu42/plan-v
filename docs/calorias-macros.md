# Calorías y macros (Mifflin-St Jeor) — registro

2026-09-30. Pedido de Facundo: que la nutricionista automatice el cálculo de calorías y macronutrientes de cada paciente con la ecuación de Mifflin-St Jeor, y que la paciente lo vea.

## Qué hace
- **Nutricionista** (pantalla Objetivos, debajo del seguimiento): carga sexo, edad, peso, talla, nivel de actividad y objetivo. Ve al instante metabolismo basal, gasto total y la meta con reparto de proteínas, hidratos y grasas. Puede ajustar el % calórico, la proteína por kilo y el % de grasa. "Guardar borrador" o "Confirmar y compartir".
- **Paciente** (pantalla Plan): ve "Tu meta diaria" solo cuando la nutricionista la confirmó. Si la nutricionista cambia datos, la paciente sigue viendo la meta anterior hasta que se confirme de nuevo.

## Datos de la paciente (ajuste pedido por Facundo, 2026-09-30)
Los datos corporales (sexo, fecha de nacimiento, talla, peso) los carga la **paciente**, no la nutricionista:
- al terminar el onboarding (pantalla "Ya estás en tu espacio"),
- desde Inicio, con la tarjeta "Tus datos para el plan" y el botón Actualizar, cuando ella quiera,
- cuando la nutricionista toca "Pedir que los cargue o actualice" en la calculadora: a la paciente le aparece el formulario abierto en Inicio hasta que guarda.
La calculadora se completa sola con esos datos (edad calculada de la fecha de nacimiento) y la nutricionista puede corregirlos.
Migración: tablas `patient_body_data` y `patient_body_data_requests`, funciones `save_my_body_data` y `request_body_data`.

## Cómo se calcula (fórmula fija, sin modelo de lenguaje)
- GEB = 10 × peso + 6,25 × talla − 5 × edad + 5 (varón) o −161 (mujer).
- Gasto total = GEB × factor (1,2 / 1,375 / 1,55 / 1,725 / 1,9).
- Meta = gasto total × (1 + ajuste). Por defecto: bajar −15 %, mantener 0, subir +10 %. Mínimo 1200 kcal (mujer) o 1500 (varón), con aviso.
- Proteína = g/kg × peso (1,8 al bajar o subir, 1,4 al mantener); grasa = % de la meta ÷ 9; hidratos = el resto ÷ 4.
- El servidor recalcula siempre; no confía en cifras del navegador. Menores de 18: aviso.

## Sobre "con IA"
La automatización es el cálculo en sí. No se usó un modelo de lenguaje para inventar cifras. Una sugerencia de reparto de macros con IA, para que la nutricionista la revise, queda como paso siguiente y necesitaría autorización de gasto/clave.

## Archivos
- `src/lib/nutrition-target.ts` (fórmula y validación, compartida por servidor y pantalla)
- `server/targets/` (rutas `GET/PUT /api/patients/:id/nutrition-target`, memoria en demo, RPC en producción)
- `supabase/migrations/20260930190000_nutrition_targets.sql` (**no aplicada en producción**: espera el OK escrito de Facundo)
- `src/components/nutrigo/ShowroomNutritionTarget.tsx`

## Pendiente
- ~~Aplicar la migración en producción~~ Hecho el 2026-10-01 con la frase escrita de Facundo ("aplicá la migración de calorías y datos corporales en la base de producción"). Comprobado en la base: 3 tablas con seguridad por filas y 2 reglas cada una; 3 funciones (`save_nutrition_target`, `save_my_body_data`, `request_body_data`) con permiso solo para usuarios con sesión (no anónimos). Falta mergear el PR #28 para que la app publicada use las rutas nuevas.
- Aviso push o mail cuando la nutricionista pide actualizar: hoy el pedido aparece dentro de la app (Inicio); falta enviarlo por el sistema de notificaciones.
- Decisión abierta: estos datos no exigen el consentimiento "measurement" del módulo de seguimiento. Conviene revisarlo con el abogado (docs/legal/revision-legal.md).
- Estado de pruebas: 913 pasan, 2 omitidas (suite completa).
