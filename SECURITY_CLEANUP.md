# Security Cleanup

## Incidente de PostCSS — 2026-10-29

La actualización forzada de `master` de `368f462500d1e5283c58d595fe48117f04d1a839`
a `3e7a0f57186dcdb9da448a0d861ae41c488e3ddf` añadió un cargador ofuscado únicamente
en `postcss.config.mjs`. Los dos commits tienen los mismos padres; sus campos de
autor no permiten atribuir quién realizó la modificación o el push forzado.
La rama SSR `9ab06304b18592b960b87d0294cbfdc2387bd7c8` contiene el mismo bloque.

El análisis estático, sin importar la configuración ni ejecutar el código
recuperado, identifica consultas JSON-RPC a Ethereum/BSC, decodificación de datos
de transacciones y ejecución del resultado con `eval`. No se consultaron esos
endpoints ni se recuperó la carga remota. El cargador es malicioso; la extracción
de secretos y el contenido ejecutado en cada momento siguen sin determinarse.

Evidencia de ejecución de builds afectados:

- [CI de la PR #10](https://github.com/fernandoDev-coder/sistema_facturacion/actions/runs/40819044954):
  el checkout fue `3da97a8387916a4e409e8bc570cf249ff2afa851`, merge de los SHA
  afectados. Lint mostró identificadores del bloque y el build terminó. Audit
  falló; Secret scan quedó omitido. Checkout persistía un token temporal con
  `contents: read`. El workflow no declara secretos de aplicación para el build.
- [Build de producción en Vercel](https://vercel.com/fernandos-projects-b73bb94e/faktudash/HeL6MJXqHMFmKJpsgzPsMca5MKHc):
  sus metadatos y logs confirman `3e7a0f5`, compilación, despliegue y creación de
  caché. Tratar las credenciales disponibles durante ese build, sus artefactos y
  su caché como potencialmente comprometidos. No se modificó el despliegue.

Se preservaron un bundle de Git, refs, reflogs, diffs, logs y la decodificación
como texto fuera del repositorio, en `sistema_facturacion-evidence-20261029`.
El checkout local inicial `493a5fa` no contiene el bloque; no se encontraron sus
marcadores en los JavaScript de su `.next`. Esto no descarta otras ejecuciones.

La reparación restaura la configuración mínima original. Una prueba compara su
contenido con una lista exacta permitida, sin importarlo, y CI la ejecuta antes
de instalar dependencias. Checkout deja de persistir credenciales de Git.

### Contención y rotación pendientes

1. Investigar el push forzado con los registros de seguridad de GitHub; revisar
   accesos, tokens, claves de despliegue, webhooks y protecciones de ramas.
2. Inventariar las variables disponibles en los builds afectados con una cuenta
   autorizada. El conector devolvió `403` incluso solicitando solo metadatos sin
   descifrar; no se ha confirmado el inventario de producción.
3. Rotar/revocar las credenciales expuestas desde un equipo confiable: claves
   privilegiadas de Supabase, secretos de Stripe y webhooks, tokens de proveedores,
   bypass de Vercel y contraseñas de cuentas seed/prueba, según el inventario real.
   Revisar registros de uso e invalidar sesiones afectadas. Si hubo exposición de
   una clave JWT de firma, planificar además la migración/revocación y su impacto.
4. Preparar un build revisado en un worker nuevo sin reutilizar la caché afectada.
   Sustituir producción solo con autorización y tras validar la reparación y la
   rotación. Conservar primero los registros necesarios para la investigación.
5. Verificar las credenciales nuevas, revocar las anteriores y registrar responsables,
   fechas y comprobantes. No se ha realizado ninguna rotación ni revocación automática.

No se deben ejecutar los fixtures RLS contra el proyecto actual sin confirmar
su aislamiento: `.env.test.local` apunta al mismo Supabase que `.env.local`, y
el propietario no pudo confirmar que sea exclusivamente de integración.
Login/logout, callback, renovación y persistencia de cookies, la opción de no
recordar sesión y RLS requieren validación en un proyecto de prueba identificado.
Los checks remotos `verify` y `Secret scan` de los nuevos commits requieren su
publicación autorizada; las comprobaciones locales no sustituyen ese resultado.

## Revalidación de dependencias — 2026-11-03

Next y eslint-config-next quedan coordinados en `16.4.3`; source-map-js en
`1.2.2` y Zod en `4.6.7`. La auditoría del 29 de octubre devolvió cero avisos.
Al retomar el trabajo apareció el aviso moderado
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), incorporado
a la base de advisories el 30 de octubre, para `minimatch <11.0.1`.

Se inspeccionaron las cadenas reales y los metadatos actuales del registro:
`@eslint/config-array`, `@eslint/eslintrc`, `@typescript-eslint/typescript-estree`,
`eslint`, `eslint-plugin-import`, `eslint-plugin-jsx-a11y` y `eslint-plugin-react`.
Sus últimas versiones publicadas siguen requiriendo minimatch 3 o 10. No hay
una actualización de esas cadenas que satisfaga el aviso sin salir de sus
contratos de dependencia. Además, los plugins actuales no declaran soporte
para ESLint 10; subir únicamente ESLint tampoco elimina el aviso.

Queda pendiente una actualización compatible de los paquetes ascendentes o
una reparación específica de compatibilidad, revisada y probada por separado.
No se fuerza minimatch 11 sobre consumidores de APIs antiguas, ni se silencia
el aviso. Se conserva `npm audit --audit-level=high`; un código de salida cero
con ese umbral no equivale a ausencia de vulnerabilidades moderadas.

## Reparacion de sesiones para la puesta en produccion

La renovacion de sesiones se realiza en `proxy.ts`, antes de los Server
Components, y propaga las cookies renovadas y las cabeceras de no cache.
La preferencia de recordar sesion se conserva entre login, renovacion en
servidor/navegador y callback PKCE. Sin preferencia explicita se usan cookies
de sesion; las eliminaciones conservan su caducidad. El callback valida el
destino tras normalizar la URL y transmite el identificador de flujo PKCE.

Las pruebas usan el SDK real con transporte simulado y credenciales sinteticas:
login, logout, renovacion, cookies fragmentadas, persistencia y callback.
No equivalen a pruebas con cuentas reales. Los tres tests RLS siguen pendientes:
no se ha confirmado un proyecto exclusivo de integracion. No se ejecutan
fixtures que escriben datos contra el proyecto compartido con `.env.local`.

El inventario de variables de Vercel devuelve HTTP 403. La rotacion de
credenciales potencialmente expuestas sigue pendiente de acceso administrativo;
una compilacion limpia no revoca credenciales ni demuestra ausencia de exfiltracion.

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
