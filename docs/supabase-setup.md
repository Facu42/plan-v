# Supabase setup — Plan V

## 1. Crear proyecto

Usá el proyecto existente (`acevlqrkvdinelgxnaki`) o creá uno nuevo en [supabase.com](https://supabase.com).

## 2. Aplicar migración

En **SQL Editor** de Supabase, pegá y ejecutá el contenido de:

```
supabase/migrations/20260901000000_plan_v_v0.sql
```

## 3. Variables de entorno

Copiá `.env.example` → `.env` y completá:

| Variable | Dónde |
|---|---|
| `VITE_SUPABASE_URL` | Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role (solo servidor) |

El anon key ya está en `src/utils/supabase/info.tsx` como fallback.

## 4. Auth

- **Registro nutricionista**: elegí rol "Nutricionista" → al iniciar sesión se crea fila en `nutritionists`
- **Registro paciente**: rol "Paciente" → debe vincularse a un `patients.user_id` (invite v1)
- **Modo demo**: sigue funcionando sin Supabase (datos en memoria)

## 5. Seed de pacientes demo

Después de que Verónica se registre, ejecutá en SQL Editor (reemplazá `NUTRI_ID`):

```sql
insert into patients (nutritionist_id, full_name, initials, tone, stage, status, goal, ...)
values ('NUTRI_ID', 'Sofía R.', 'SR', 'peach', ...);
```

Ver plantilla en `supabase/seed.sql`.

## 6. Correr local

```bash
npm run dev
```

Con service role configurado, la API persiste en Postgres. Sin él, usa memoria + auth en frontend.
