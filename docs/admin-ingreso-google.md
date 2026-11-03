# El admin de la plataforma entra al centro de mando

3/11/2026. Quien está en `platform_admins` y entra con Google caía en la raíz. El perfil dice paciente y no tiene ficha, así que veía «Tu cuenta todavía no está vinculada».

## Qué hace ahora

- La vuelta de Google queda en el mismo sitio desde el que se salió. El camino tiene que ser interno (empieza con `/`). Un destino de otro sitio se descarta.
- Si `is_platform_admin()` responde que sí, y la cuenta no es de una nutricionista, la app la lleva a `/admin`.
- Si además tiene consultorio, se queda en el panel y ve el acceso «Admin».
- La paciente que no administra sigue viendo la pantalla de cuenta sin vincular.
- `/admin` sigue pidiendo el código de la app antes de mostrar el centro. El tema oscuro se conserva en esa espera y en el centro.

No hay migración. No se tocó la base de producción.

## Paso 10

- Flujos críticos verificados: ingreso con Google y vuelta interna (✅), admin de plataforma a `/admin` (✅), paciente sin ficha en la pantalla actual (✅), nutri en su panel (✅), nutri que también administra ve «Admin» (✅), `/admin` sigue exigiendo el código (✅, prueba ya existente del camino).
- Regresiones cubiertas: el admin con perfil de paciente ya no se queda en «sin vincular». La vuelta no acepta otro sitio.
- Contratos revisados: el navegador llama a `is_platform_admin()` (ya concedida a la sesión iniciada). No cambia la API ni la base.
- Áreas frágiles: el ingreso. Si la lista de direcciones permitidas de Supabase solo acepta la raíz exacta, la vuelta con camino puede rechazarse; igual queda guardado el camino y, al caer en la raíz, se restaura. Un paciente espera esa consulta antes de ver su pantalla: si tarda o falla, a los 5 segundos sigue como hasta ahora.
- Migraciones: no aplica.
- Fire test: se apagó a propósito el desvío al centro. La prueba «manda al admin de plataforma a /admin» falló. Se revirtió. ✅
- Automatizaciones nuevas: la decisión de pantalla y la vuelta segura tienen prueba automática. No hay un paso manual nuevo.
- Veredicto: HOLD para que Facundo lo vea. Sin merge y sin producción.
