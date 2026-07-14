# Security Cleanup

## Informacion sensible encontrada

- Correos reales asociados a privilegios (`super_admin`, plan `enterprise`, plan `premium` y acceso vitalicio) en codigo y documentacion.
- Una contrasena concreta de usuario seed en documentacion y `.env.example`.
- Variables sensibles documentadas con ejemplos demasiado parecidos a credenciales reales.
- Scripts con `SUPABASE_SERVICE_ROLE_KEY` capaces de crear usuarios, resetear contrasenas y modificar planes sin guardas suficientes de entorno.

## Credenciales que deben rotarse

- Cualquier contrasena seed que haya estado publicada en el repositorio.
- `SUPABASE_SERVICE_ROLE_KEY` si estuvo expuesta fuera de entornos privados.
- `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` si estuvieron en commits, logs o sistemas no confiables.
- Credenciales SMTP/Resend si fueron usadas en archivos versionados o logs.

## Usuarios seed a revisar en Supabase

- Elimina usuarios de prueba que ya no necesites.
- Cambia la contrasena de cualquier usuario seed creado con valores publicados.
- Revisa perfiles con `role`, `plan`, `is_super_admin` o `has_lifetime_access` asignados historicamente por correo.
- Revisa suscripciones asociadas a usuarios seed antes de ejecutar nuevos datos demo.

## Variables administrativas actuales

- `SUPER_ADMIN_EMAIL` y `LIFETIME_PREMIUM_EMAIL` solo deben existir en entornos privados.
- Ejecuta `npm run sync:special-access` manualmente y solo contra el proyecto Supabase esperado.
- No guardes valores reales en `.env.example`, README, tests o issues publicos.

## Limpieza de historial

No se ha reescrito el historial automaticamente. Para eliminar datos antiguos de commits, usa `git filter-repo` en una copia local y revisa el resultado antes de hacer push.

Ejemplo orientativo:

```bash
git filter-repo --path README.md --path .env.example --path lib/profiles.ts --path scripts/sync-special-access.mjs --replace-text replacements.txt
```

`replacements.txt` debe mapear cada valor sensible antiguo a un marcador inocuo. Revisa la documentacion de `git filter-repo` antes de usarlo.

## Impacto de reescribir historial

- Requiere `git push --force-with-lease`.
- Todos los colaboradores deberan volver a clonar o sincronizar sus ramas.
- Pull requests abiertos pueden necesitar recrearse.
- Los secretos deben rotarse igualmente: eliminarlos del historial no los vuelve seguros.
