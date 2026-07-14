# FaktuDash

Aplicacion SaaS con Next.js App Router, TypeScript, Tailwind CSS, Supabase y Stripe para gestionar clientes, facturas y presupuestos.

## Estado

Beta privada/pre-lanzamiento. La aplicacion incluye una arquitectura inicial orientada a VeriFactu y esta en proceso de adaptacion a requisitos fiscales, pero no garantiza cumplimiento completo ni debe presentarse como software certificado u homologado.

## Desarrollo

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configura `.env.local` con valores propios. No publiques credenciales, correos personales, contrasenas, claves de servicio, secretos de Stripe, secretos SMTP/Resend ni datos de usuarios reales.

## Scripts

```bash
npm run lint
npm test
npm run build
```

Los scripts administrativos y de seed estan protegidos por variables privadas y guardas de entorno. Ejecutalos solo contra proyectos de desarrollo o test.

## Seguridad

- No hay cuentas privilegiadas hardcodeadas.
- Los roles, planes, acceso vitalicio y campos de billing se gestionan desde base de datos y service role.
- Los usuarios normales no deben poder modificar sus campos de privilegios.
- Los webhooks de Stripe validan firma.
- El repositorio ejecuta lint, tests, build, audit y escaneo de secretos en CI.

La documentacion operativa con detalles de despliegue, rotacion, runbooks, proyectos o procedimientos internos debe mantenerse fuera del repositorio publico o en rutas locales ignoradas por git.
