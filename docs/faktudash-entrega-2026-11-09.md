# FaktuDash: entrega local y preparación del push

Rama: `feat/faktudash-contexto`. Base: `ec1ce57bd62caa8101f37fffb9ec60594511abbd`.
Node: 24.12.0. No se han publicado cambios, activado pagos, enviado correos ni aplicado migraciones remotas.

Fernando ha confirmado que solo existe un proyecto de producción.
El archivo `.env.test.local` existente **no constituye un entorno de pruebas aislado**.
Las pruebas con escrituras sobre Supabase quedan deshabilitadas hasta identificar un proyecto diferente.

## Código preparado

| Bloque | Archivos principales | Resultado |
| --- | --- | --- |
| Contacto | `lib/beta-config.ts`, `scripts/check-launch.mjs`, footer, contacto y legales | El correo confirmado se guarda en `.env.local` para las tres variables. Sin dirección válida no se crea un `mailto:` vacío. Comprobación previa al lanzamiento. |
| Formulario | `components/contact-form.tsx`, `autosave-form.tsx`, `textarea-autosize.tsx` | Validación después de recortar espacios, envío manual explicado, copia con errores reales, bloqueo de doble preparación, borradores conservados, exclusión de secretos y ajuste de altura al escribir/restaurar. |
| Presentación | portada, precios, demo, `lib/i18n.ts`, CSS y SVG | Demo accesible desde dos CTA, tabla de planes, CSV descrito de acuerdo con el endpoint, sin promoción de Stripe ni cita del equipo presentada como prueba social. Tipografía del sistema, superficies mates, sin degradados/sombras y foco con outline. Legales ES/EN. |
| Interacción | `experience-tools.tsx`, `mobile-navigation.tsx`, errores | Flechas y encierro/devolución de foco, Escape, atajos protegidos al escribir, volver arriba a partir de 400 px, tema antes de hidratar, separación del FAB respecto al final de página, compartir URLs públicas sin consultas ni rutas privadas. |
| Sesiones | `lib/supabase/session-cookies.ts`, `proxy.ts`, `server.ts`, `reauthenticate.ts` | Cookies HttpOnly, Secure en HTTPS/producción, SameSite=Lax; sesión de navegador o persistencia máxima de 30 días. Migración de cookies antiguas por fragmentos, borrados y protecciones de caché preservados. Adaptador de navegador sin uso eliminado. Reautenticación de contraseña sin sustituir la sesión aal2. |
| MFA | `app/auth/mfa`, `app/actions/mfa.ts`, `lib/supabase/mfa.ts` | Alta TOTP, desafío, confirmación de cambios con contraseña/código nuevo, retirada y cierre de sesión. Servidor y RLS impiden acceso protegido con aal1 si hay factor activo o administración. Recuperación de contraseña vuelve a su formulario tras MFA. Recuperación por pérdida de dispositivo exige intervención controlada. |
| Límites | `lib/rate-limit.ts`, acciones, CSV, callback, administración | Contadores atómicos compartidos en PostgreSQL, caducidad, identidad validada o IP de ingreso confiable, mensajes de reintento y 429/503 con Retry-After en APIs. |
| Cierre mensual | `create-month-form.tsx`, `monthly-demo.tsx`, acción y RPC | Demo Premium de tres comunidades: 120 €, 150 € + 30 € extra y una omitida. Dos borradores, base 300 €, IVA 63 €, total 363 €. Reiniciable, sin escrituras ni documentos fiscales. Lote real transaccional e idempotente, con confirmación independiente para facturas adicionales. |
| Webhook | ruta Stripe y migración de lease | Firma y registro del evento preservados. Exclusión de procesamiento simultáneo, respuesta duplicada para eventos completados y reintento tras fallo o caducidad del lease. Pagos siguen desactivados. |
| Aislamiento | `lib/supabase/environment.ts`, layouts y pruebas | En Vercel Preview, Auth y service_role se bloquean salvo que se configure un proyecto de pruebas distinto. La parte pública y la demo siguen disponibles. |

## Verificación local

- `npm ci`: correcto con Node 24 y el lockfile. Después se añadió `@electric-sql/pglite` como dependencia **de desarrollo** para ejecutar las migraciones y las pruebas SQL localmente.
- `npm run lint`: comprobado; el resultado final figura al final de este documento.
- `npm test`: incluye pruebas existentes, cookies fragmentadas, aislamiento de preview y SQL real mediante PostgreSQL en WASM.
- `npm run build`: compilación de producción de Next 16.4.3; se leyó su documentación incluida en `node_modules/next/dist/docs`.
- `npm run check:launch`: verifica las tres variables de contacto sin imprimir claves.
- `npm audit --audit-level=high`: termina correctamente. Permanecen 8 avisos moderados de desarrollo relacionados con minimatch/ESLint, ya presentes en la base. No se aplicó un downgrade incompatible de Next/ESLint.
- Navegador Chromium: portada, precios, demo, contacto, registro y 404 a 320/390/768/1440 px; ES/EN y claro/oscuro con movimiento reducido. Pruebas de totales/reinicio de demo, trim, borradores, autoaltura, atajos, foco y compartir/cancelar/error. Evidencia en `evidence/2026-11-09/`.
- Las pruebas SQL ejecutan el esquema y las migraciones completas, con roles y tablas Auth/Storage simulados. Comprueban N+1, TTL, actores independientes, propietario, escalada de permisos, MFA/RPC, reintentos del lote, rollback parcial y leases de webhook. PGlite serializa conexiones: **no sustituye una prueba multiconexión contra Supabase**.

### Pruebas pendientes de infraestructura

Las tres pruebas existentes de integración con Supabase se omiten. Ahora requieren `APP_ENV=test`,
`SECURITY_TEST_ALLOW_WRITES=true`, referencias explícitas de producción/pruebas distintas y cuentas ficticias.
No se cargan automáticamente las credenciales de `.env.test.local`.

Pendiente en un proyecto aislado:

1. Alta real, recepción/confirmación de email, PKCE y recuperación en el mismo navegador y en otro dispositivo.
2. TOTP habilitado en Supabase; alta, código erróneo/caducado/reutilizado, bloqueo temporal, pérdida del dispositivo, cambio y retirada de factor. El endpoint público de ajustes no informa de la disponibilidad de TOTP.
3. Cookies observadas en navegador autenticado limpio, ambos modos de persistencia, renovación concurrente, logout y separación de respuestas entre usuarios.
4. Anónimo/usuario/superadmin por UI, POST directo y API de Supabase; CSV por plan y menú privado con teclado/tacto.
5. Cierre mensual concurrente entre conexiones reales y reintento después de perder la respuesta. El SQL ya garantiza transacción y bloqueo por propietario; falta demostrarlo en el servicio alojado.
6. Webhooks firmados en modo test, reintentos y lease caducado. Sin Stripe live.
7. Dispositivos táctiles reales, teclado virtual, lectura asistida, impresión A4 autenticada y errores de red del área privada.

Solo se consultó en producción `/auth/v1/settings` en modo lectura: registro habilitado y confirmación por email obligatoria. No se creó ninguna cuenta ni se envió ningún mensaje.

## Migraciones y orden de activación

Las cuatro migraciones nuevas están en `supabase/migrations/`:

1. `20261109180000_request_limits.sql`: contador atómico y función exclusiva de service_role.
2. `20261109181000_mfa_enforcement.sql`: funciones de comprobación, políticas restrictivas, administrador con aal2 y protección de RPC fiscal.
3. `20261109182000_monthly_atomic.sql`: operaciones idempotentes, validación de plan/propietario y lote transaccional.
4. `20261109183000_webhook_lease.sql`: exclusión concurrente y finalización de eventos.

Para un proyecto nuevo: esquema base, migraciones anteriores y estas cuatro en orden. La suite SQL reproduce ese orden.
Para uno existente: aplicar solo las migraciones pendientes. No ejecutar de nuevo `schema.sql` sobre producción.

**No promover esta rama a producción sin las migraciones.** El código rechaza acceso protegido si faltan las funciones de seguridad.
Aplicar la migración de MFA antes de desplegar su interfaz también puede bloquear temporalmente administradores actuales.
La publicación requiere una ventana coordinada: copia de seguridad, build preparado, migraciones y publicación inmediata,
seguida de la verificación de acceso de una cuenta administradora. No forma parte de esta entrega.

Transición de administración: una cuenta sin factor solo podrá configurar/verificar TOTP y cerrar sesión hasta completar aal2.
Antes del cambio debe existir un operador autorizado con acceso al panel de Supabase para recuperación.
Si se pierde el dispositivo, verificar la identidad por un procedimiento acordado, registrar el caso, revocar sesiones y
restablecer los factores desde el panel administrativo. No eliminar factores basándose únicamente en un correo recibido.
El administrador deberá volver a enrolarse; la cuenta no obtiene acceso protegido sin un factor válido.
La política comprueba también que `session_id` siga presente en `auth.sessions`, de modo que una sesión revocada
no conserve acceso a las tablas protegidas con un JWT anterior. Administradores necesitan un factor verificado actual,
incluso si el JWT todavía indica aal2. Las sesiones antiguas sin `session_id` requieren volver a iniciar sesión.

## Variables para Vercel

La configuración local usa `faktudash@gmail.com` en:

```dotenv
NEXT_PUBLIC_SUPPORT_CONTACT_EMAIL=faktudash@gmail.com
NEXT_PUBLIC_LEGAL_CONTACT_EMAIL=faktudash@gmail.com
NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL=faktudash@gmail.com
```

Mantener los valores fuera del código. Estas variables públicas necesitan un nuevo build para reflejar sus valores.

Preview con acceso autenticado:

```dotenv
APP_ENV=test
SUPABASE_PRODUCTION_PROJECT_REF=<referencia-del-proyecto-de-produccion>
SUPABASE_TEST_PROJECT_REF=<referencia-del-nuevo-proyecto>
NEXT_PUBLIC_SUPABASE_URL=https://<referencia-del-nuevo-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clave-publica-del-proyecto-de-pruebas>
SUPABASE_SERVICE_ROLE_KEY=<secreto-del-proyecto-de-pruebas>
NEXT_PUBLIC_SITE_URL=<url-de-la-preview>
BETA_MODE=true
PAYMENTS_ENABLED=false
STRIPE_LIVE_ENABLED=false
```

Configurar las URL de callback autorizadas en Auth y confirmar las opciones TOTP y envío de emails del proyecto de pruebas.
No copiar la clave service_role de producción a ese entorno. `RATE_LIMIT_LOCAL_BYPASS=true` solo se admite fuera de producción;
no permite saltarse las políticas MFA ni el aislamiento de previews.

El proyecto Vercel `faktudash` está vinculado a `fernandoDev-coder/sistema_facturacion` y usa Node 24.
Las previews están protegidas por autenticación de Vercel. La herramienta devuelve 403 al listar sus variables y no hay CLI
Vercel instalada como alternativa; **las variables remotas no se han comprobado ni cambiado**.
El repositorio ejecuta CI en pull requests y pushes a master/main; conviene subir esta rama y abrir PR para obtener el resultado de CI.
Antes de publicar, revisar la rama de producción y los despliegues automáticos en Vercel: la consulta de proyecto disponible no muestra esa rama.

## Políticas de límites

| Superficie | Actor | Umbral / ventana | Fallo del almacén |
| --- | --- | --- | --- |
| Lecturas protegidas | Usuario validado | 300 / minuto | Bloqueo y reintento |
| Mutaciones de clientes, documentos, gastos, empresa, cuenta y billing | Usuario validado | 60 / minuto | Bloqueo y reintento |
| Login | IP de ingreso | 10 / 10 minutos | Bloqueo y reintento |
| Registro | IP de ingreso | 5 / hora | Bloqueo y reintento |
| Reenvío/recuperación | IP de ingreso | 5 / 15 minutos | Bloqueo y reintento |
| MFA | Usuario validado | 5 / 5 minutos | Bloqueo y reintento |
| CSV | Usuario validado | 10 / minuto | 503; exceso: 429 |
| Cierre mensual | Usuario validado | 5 / minuto | Bloqueo y reintento |
| Administración | Superadmin con aal2 | 30 / minuto | Bloqueo y reintento |
| Callback | IP de ingreso | 30 / minuto | 503; exceso: 429 |
| Webhook | Fuente firmada | 120 / minuto y un lease por evento | 503/429 para reintento; completados duplicados: 200 |
| Idioma | IP de ingreso | 60 / minuto | Se permite cambiar la preferencia |
| Logout | Sesión | Sin contador propio | Se comunica el fallo; no anuncia una salida falsa |
| Contacto/demo | Navegador | Sin envío HTTP de formulario | Estado local; no envío directo |

Se confía en `x-vercel-forwarded-for` únicamente cuando `VERCEL=1`; fuera de Vercel, las solicitudes anónimas comparten un
contador conservador. No se acepta un `X-Forwarded-For` arbitrario. Se almacenan hashes de claves y contadores con caducidad,
con limpieza acotada de entradas vencidas. Estos límites cubren la aplicación; deben revisarse también las cuotas de Auth/API
de Supabase y la protección de ingreso, porque el endpoint público de Supabase es una superficie independiente.

## Medición y reproducción

Los archivos `performance-before.json` y `performance-after.json` guardan tres mediciones móviles por ruta.
Comparación local, mismo Node, Chromium, Lighthouse, viewport y throttling simulado. Son datos de laboratorio, no INP de campo
ni percentiles de usuarios reales. El informe debe leerse junto a las limitaciones del equipo local y a la ausencia de sesión.
Ambas versiones se miden con `next build --webpack`: el checkout de referencia reutiliza dependencias mediante una junction,
que Turbopack rechaza por estar fuera de su raíz. La rama actual también compila correctamente con el comando predeterminado.
Las mediciones definitivas se ejecutan en serie, sin compilaciones ni suites de pruebas concurrentes.

Medianas de tres ejecuciones por ruta (antes → después):

| Ruta | LCP, ms | CLS | TBT, ms | JavaScript transferido, bytes |
| --- | ---: | ---: | ---: | ---: |
| `/` | 3419 → 1133 | 0 → 0 | 4509 → 1544 | 154613 → 155681 |
| `/pricing` | 1005 → 890 | 0 → 0 | 4209 → 706 | 154027 → 154843 |
| `/demo` | 4389 → 893 | 0 → 0 | 4256 → 717 | 154027 → 160101 |

El LCP mediano mejora y no se observan desplazamientos de diseño. El JS aumenta, especialmente en la demo interactiva.
El TBT sigue alto en esta simulación local; los resultados individuales varían mucho y no permiten atribuir toda la mejora
a un cambio concreto. Repetir en la preview con un dispositivo representativo y recoger INP de campo cuando exista muestra.
No se han cambiado la caché ni la renovación de Auth basándose en estos números.

Para las herramientas de navegador, instalar `playwright` y `lighthouse` en una carpeta externa y definir
`FAKTUDASH_BROWSER_TOOLS` con esa carpeta y `CHROME_PATH` con el ejecutable Chromium. Los scripts solo aceptan localhost.

```powershell
npm ci
npm run lint
npm test
npm run build
npm run check:launch
npm run start -- --port 3100 --hostname 127.0.0.1
# En otra terminal, con FAKTUDASH_BROWSER_TOOLS y CHROME_PATH definidos:
node scripts/verify-ui.mjs
# PERF_BASE_URL=http://127.0.0.1:3100 y PERF_LABEL=after:
node scripts/measure-performance.mjs
```

Referencias consultadas: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/advanced-guide),
[Supabase TOTP](https://supabase.com/docs/guides/auth/auth-mfa/totp),
[sesiones y revocación](https://supabase.com/docs/guides/auth/sessions),
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[cabeceras de Vercel](https://vercel.com/docs/headers/request-headers).

## Resultado final y siguiente paso

- Lint: correcto. Build predeterminado y build Webpack: correctos.
- Suite: 49 pruebas, **46 correctas, 3 omitidas**, 0 fallos. Las omitidas requieren Supabase aislado.
- UI: **96 combinaciones de ruta, tamaño, idioma y tema**, más interacciones, correctas y sin errores de ejecución.
- Contactos: 16 combinaciones de ruta e idioma revisadas; todos los mailto presentes apuntan al buzón autorizado. La demo no incluye mailto.
- Aislamiento: 5 recorridos en navegador con `VERCEL_ENV=preview` y sin proyecto de pruebas, ejecutados localmente.
  Login, registro y MFA muestran el aviso; dashboard conduce a login; demo permanece accesible. No es una preview remota.
- `check:launch` y `git diff --check`: correctos. Audit sin avisos altos/críticos; quedan los 8 moderados de desarrollo indicados arriba.

Para revisar en GitHub: crear el commit de esta rama y hacer push a `feat/faktudash-contexto`, abrir PR y revisar CI.
No incluir `.env.local`, `.env.test.local` ni el cambio previo ajeno de `.next-dev.out.log`.
El commit y la PR incluyen código, pruebas, migraciones e instrucciones; su publicación no aplica las migraciones a Supabase.
Las capturas y los resultados JSON de `docs/evidence/` se conservan localmente y se pueden regenerar con los scripts incluidos;
no forman parte del commit. Las medianas y los resultados resumidos figuran en este informe.
El documento de encargo original permanece fuera del commit.

Una preview puede mostrar ya el diseño y la demo. El acceso con cuenta permanecerá bloqueado hasta configurar el proyecto
Supabase de pruebas, aplicar las migraciones y sus variables de Preview. Después ejecutar los siete recorridos pendientes.
La activación pública requiere además revisar las variables de Production y coordinar migraciones/despliegue.
