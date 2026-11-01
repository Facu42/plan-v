# Mails de Auth de Supabase · Nutridash

Listos para cargar a mano en el panel de Supabase. **Este PR no los aplica a producción.**

En Authentication → Email Templates, reemplazá el HTML de fábrica (inglés) por el de acá:

| Plantilla del panel | Archivo | Asunto sugerido |
|---|---|---|
| Confirm signup | `confirmation.html` | Confirmá tu mail · Nutridash |
| Reset password | `recovery.html` | Recuperá tu clave · Nutridash |
| Magic link | `magic_link.html` | Tu enlace para entrar · Nutridash |

Los tres usan `{{ .ConfirmationURL }}` (variable de GoTrue). Marca Nutridash, castellano con voseo, botón lima `#c5e46d`.

Para un proyecto local de CLI, en `config.toml`:

```toml
[auth.email.template.confirmation]
subject = "Confirmá tu mail · Nutridash"
content_path = "./templates/confirmation.html"

[auth.email.template.recovery]
subject = "Recuperá tu clave · Nutridash"
content_path = "./templates/recovery.html"

[auth.email.template.magic_link]
subject = "Tu enlace para entrar · Nutridash"
content_path = "./templates/magic_link.html"
```

No pegues esto en el `config.toml` de un proyecto vinculado a producción.
