# FaktuDash

Aplicacion SaaS sencilla con Next.js App Router, TypeScript, Tailwind CSS y Supabase. Permite registrar usuarios, guardar clientes, crear facturas individuales o mensuales y abrir una plantilla A4 imprimible desde el navegador.

## Requisitos

- Node.js compatible con Next.js 16.
- Cuenta en Supabase.
- Cuenta en Stripe.
- Cuenta en Vercel para despliegue.

## Instalacion

```bash
npm install
cp .env.example .env.local
```

Rellena `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPER_ADMIN_EMAILS=tu-email@ejemplo.com
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_PREMIUM_PRICE_ID=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

`SUPABASE_SERVICE_ROLE_KEY` solo se usa en servidor para el webhook de Stripe y para actualizar campos sensibles de billing.
`SUPER_ADMIN_EMAILS` es opcional y permite dar acceso total a una o varias cuentas separando los correos por comas.
`NEXT_PUBLIC_SITE_URL` debe coincidir con la URL publica de la app. En local usa `http://localhost:3000`; en produccion usa la URL de Vercel o tu dominio, por ejemplo `https://faktudash-drab.vercel.app`.
`STRIPE_PRO_PRICE_ID` debe ser el Price recurrente del plan Pro creado en Stripe.
`STRIPE_PREMIUM_PRICE_ID` debe ser el Price recurrente del plan Premium creado en Stripe.

## Crear proyecto Supabase

1. Crea un proyecto en Supabase.
2. En `Authentication > Providers`, activa Email.
3. Si quieres que el registro entre directamente sin email de confirmacion, desactiva temporalmente `Confirm email`.
4. En `Authentication > URL Configuration`, configura `Site URL` y `Redirect URLs` con la misma URL que `NEXT_PUBLIC_SITE_URL`. Para desarrollo local, anade `http://localhost:3000/**`.
5. Si personalizas la plantilla de confirmacion, conserva el enlace `{{ .ConfirmationURL }}` o usa correctamente `{{ .Token }}` con un flujo OTP.
6. Copia `Project URL`, `anon public key` y `service_role key` en `.env.local`.
7. Para produccion, configura `Authentication > SMTP Settings` con tu proveedor de correo y dominio propio. El SMTP por defecto de Supabase no es adecuado para registros publicos en produccion.

## Ejecutar SQL

Abre `SQL Editor` en Supabase y ejecuta el contenido de:

```bash
supabase/schema.sql
```

El script crea las tablas `profiles`, `company_settings`, `communities`, `invoices`, `invoice_items`, `subscriptions` y `billing_events`, indices, triggers de `updated_at`, trigger de perfil al registrar usuario y politicas RLS.
Tambien anade roles basicos en `profiles`, un flag de `super_admin`, acceso vitalicio, estado de onboarding y campos Stripe. La actualizacion de columnas sensibles de perfil queda restringida a la service role.
Tambien crea el bucket publico `company-logos` en Supabase Storage para que cada usuario pueda subir su logo en una carpeta propia. Los logos se limitan a PNG, JPG o WebP de hasta 2 MB.

## Monetizacion con Stripe

1. Crea productos o precios recurrentes para `Pro` y `Premium` en Stripe.
2. Copia el Price ID de Pro en `STRIPE_PRO_PRICE_ID`.
3. Copia el Price ID de Premium en `STRIPE_PREMIUM_PRICE_ID`.
4. Copia la secret key en `STRIPE_SECRET_KEY`.
5. Crea un webhook apuntando a:

```bash
https://tu-dominio.com/api/stripe/webhook
```

Eventos recomendados:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

6. Copia el signing secret del webhook en `STRIPE_WEBHOOK_SECRET`.

El plan Gratis permite 5 clientes, 25 documentos creados al mes y no permite logo ni facturacion mensual masiva. El plan Pro permite 15 clientes, 50 documentos al mes y logo de empresa en facturas y presupuestos. El plan Premium elimina esos limites y permite facturacion mensual masiva.

## Desarrollo local

```bash
npm run dev
```

Abre `http://localhost:3000`.

## Verificacion de seguridad

```bash
npm audit --audit-level=moderate
npm run lint
npm test
npm run build
```

`npm test` ejecuta comprobaciones estaticas de acciones, politicas RLS y dependencias. Tambien incluye una prueba de aislamiento real entre dos usuarios de Supabase; se omite si no existen estas variables:

```bash
SECURITY_TEST_USER_A_EMAIL=
SECURITY_TEST_USER_A_PASSWORD=
SECURITY_TEST_USER_B_EMAIL=
SECURITY_TEST_USER_B_PASSWORD=
SEED_FREE_USER_EMAIL=test-gratis@faktudash.local
SEED_FREE_USER_PASSWORD=TestGratis2026!
SEED_PRO_USER_EMAIL=
SEED_PRO_USER_PASSWORD=
SEED_PREMIUM_USER_EMAIL=
SEED_PREMIUM_USER_PASSWORD=
```

Las dos cuentas deben existir en el proyecto Supabase configurado en `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Para crear o resetear los usuarios de prueba en el Supabase configurado en `.env.local`:

```bash
npm run seed:free-user
npm run seed:pro-user
npm run seed:premium-user
```

## Flujo de uso

1. Registra un usuario o inicia sesion.
2. Si el proyecto tiene verificacion por email activa, confirma el correo y vuelve a iniciar sesion.
3. Completa el onboarding inicial en `/welcome`.
4. Completa `/settings/company`.
5. Crea clientes en `/clients/new`.
6. Crea una factura individual en `/invoices/new` o facturas mensuales en `/invoices/create-month`.
7. Gestiona el plan en `/settings/billing`.
8. Abre `/invoices/[id]/print` desde el boton `Imprimir`.

## Despliegue en Vercel

1. Sube el proyecto a un repositorio Git.
2. Importa el repositorio en Vercel.
3. Anade estas variables en `Project Settings > Environment Variables`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRO_PRICE_ID`
   - `STRIPE_PREMIUM_PRICE_ID`
   - `STRIPE_WEBHOOK_SECRET`
4. Despliega.

La aplicacion esta preparada para Vercel. Manten `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` solo como variables de servidor.
