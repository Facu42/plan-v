# Consolidación del workspace

## Fuente canónica

`plan-v/` es la única aplicación activa. Contiene su propio repositorio Git, la interfaz de paciente, el Centro profesional, la API local y el contrato vigente de Supabase.

## Snapshot preservado

El contenido del prototipo anterior se conservó en:

```text
../archive/legacy-prototype-2026-09-04/
```

Se movió sin mezclar implementaciones:

- `src/`, `package.json`, `supabase/` y archivos de build del prototipo anterior.
- Documentación funcional, diseño, marca, contenido y marketing anteriores.
- Tickets locales, skills clonadas y capturas de referencia.

## Regla de migración

No copiar módulos del snapshot directamente al código activo: los dos árboles tenían modelos de datos, rutas y dependencias diferentes. Antes de reutilizar una idea, diseño o contrato:

1. Validar que siga vigente para la experiencia actual.
2. Adaptarlo al modelo de `plan-v/src/types.ts` y al cliente `plan-v/src/api/client.ts`.
3. Añadir una prueba o una verificación de navegador antes de integrarlo.
4. Mantener los límites de privacidad descritos en `docs/supabase-setup.md`; no aplicar el draft SQL legado.

Los cambios locales existentes en el repositorio activo no se modificaron durante esta consolidación.
