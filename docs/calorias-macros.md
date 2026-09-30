# Calorías y macros (Mifflin-St Jeor) — registro

2026-09-30. Pedido de Facundo: que la nutricionista automatice el cálculo de calorías y macronutrientes de cada paciente con la ecuación de Mifflin-St Jeor, y que la paciente lo vea.

## Qué hace
- **Nutricionista** (pantalla Objetivos, debajo del seguimiento): carga sexo, edad, peso, talla, nivel de actividad y objetivo. Ve al instante metabolismo basal, gasto total y la meta con reparto de proteínas, hidratos y grasas. Puede ajustar el % calórico, la proteína por kilo y el % de grasa. "Guardar borrador" o "Confirmar y compartir".
- **Paciente** (pantalla Plan): ve "Tu meta diaria" solo cuando la nutricionista la confirmó. Si la nutricionista cambia datos, la paciente sigue viendo la meta anterior hasta que se confirme de nuevo.

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
- `supabase/migrations/20260930120000_nutrition_targets.sql` (**no aplicada en producción**: espera el OK escrito de Facundo)
- `src/components/nutrigo/ShowroomNutritionTarget.tsx`

## Pendiente
- Aplicar la migración en producción (necesita OK escrito).
- La ficha aún no guarda edad, sexo ni talla de la paciente: hoy se cargan en la calculadora. Guardarlas en la ficha evitaría cargarlas cada vez.
- Estado real de pruebas: 909 pasan, 2 omitidas (suite completa).
