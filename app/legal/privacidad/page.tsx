import { LegalPage, LegalSection } from "@/components/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage title="Politica de privacidad" updatedAt="Mayo 2026">
      <LegalSection title="Responsable">
        <p>
          Responsable pendiente de completar con los datos reales del titular de FaktuFlow y un email de contacto para
          privacidad.
        </p>
      </LegalSection>
      <LegalSection title="Datos tratados">
        <p>
          Podemos tratar datos de cuenta, email, datos de empresa, clientes, facturas, presupuestos, datos de plan y
          eventos tecnicos necesarios para prestar el servicio.
        </p>
      </LegalSection>
      <LegalSection title="Finalidades">
        <p>
          Gestionar el acceso a la aplicacion, prestar el servicio de facturacion, aplicar limites de plan, gestionar
          pagos, atender soporte y mantener la seguridad de la plataforma.
        </p>
      </LegalSection>
      <LegalSection title="Proveedores">
        <p>
          El servicio puede utilizar proveedores como Supabase para autenticacion/base de datos, Stripe para pagos y
          Vercel para despliegue y alojamiento.
        </p>
      </LegalSection>
      <LegalSection title="Derechos">
        <p>
          Los usuarios pueden solicitar acceso, rectificacion, supresion, oposicion, limitacion y portabilidad cuando
          proceda, escribiendo al email de contacto que se indique antes del lanzamiento.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
