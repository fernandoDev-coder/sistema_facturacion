# Facturación para comunidades

Aplicación SaaS sencilla con Next.js App Router, TypeScript, Tailwind CSS y Supabase. Permite registrar usuarios, guardar comunidades, crear facturas individuales o mensuales y abrir una plantilla A4 imprimible desde el navegador.

## Requisitos

- Node.js compatible con Next.js 16.
- Cuenta en Supabase.
- Cuenta en Vercel para despliegue.

## Instalación

```bash
npm install
cp .env.example .env.local
```

Rellena `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPER_ADMIN_EMAILS=tu-email@ejemplo.com
```

No se usa `SUPABASE_SERVICE_ROLE_KEY`; las operaciones funcionan con Supabase Auth, cookies SSR y Row Level Security.
`SUPER_ADMIN_EMAILS` es opcional y permite dar acceso total a una o varias cuentas separando los correos por comas.

## Crear proyecto Supabase

1. Crea un proyecto en Supabase.
2. En `Authentication > Providers`, activa Email.
3. Si quieres que el registro entre directamente sin email de confirmación, desactiva temporalmente `Confirm email`.
4. Copia `Project URL` y `anon public key` en `.env.local`.

## Ejecutar SQL

Abre `SQL Editor` en Supabase y ejecuta el contenido de:

```bash
supabase/schema.sql
```

El script crea las tablas `profiles`, `company_settings`, `communities` e `invoices`, índices, triggers de `updated_at`, trigger de perfil al registrar usuario y políticas RLS para que cada usuario solo lea y modifique sus propias filas.
También añade roles básicos en `profiles`, un flag de `super_admin`, acceso vitalicio, estado de onboarding y permisos para que un super admin pueda ver el listado de usuarios registrados.

## Desarrollo local

```bash
npm run dev
```

Abre `http://localhost:3000`.

## Flujo de uso

1. Registra un usuario o inicia sesión.
2. Si el proyecto tiene verificación por email activa, confirma el correo y vuelve a iniciar sesión.
3. Completa el onboarding inicial en `/welcome`.
4. Completa `/settings/company`.
5. Crea comunidades en `/communities/new`.
6. Crea una factura individual en `/invoices/new` o facturas mensuales en `/invoices/create-month`.
7. Abre `/invoices/[id]/print` desde el botón `Imprimir`.

## Despliegue en Vercel

1. Sube el proyecto a un repositorio Git.
2. Importa el repositorio en Vercel.
3. Añade estas variables en `Project Settings > Environment Variables`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Despliega.

La aplicación está preparada para Vercel y no requiere claves privadas en el servidor para esta versión.
