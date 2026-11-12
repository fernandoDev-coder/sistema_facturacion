import { EnglishLegalPage } from "@/components/english-legal-page";
import { getLocale } from "@/lib/i18n";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { contactEmails, contactHref } from "@/lib/beta-config";

export default async function PrivacyPage() {
  if (await getLocale() === "en") return <EnglishLegalPage kind="privacy" />;
  return (
    <LegalPage title="Politica de privacidad" updatedAt="Noviembre 2026">
      <LegalSection title="Responsable">
        <p>
          FaktuDash actua como responsable del tratamiento de los datos necesarios para prestar la beta privada del
          servicio. Para consultas de privacidad puedes escribir a{" "}
          <a href={contactHref(contactEmails.privacy)}>{contactEmails.privacy}</a>.
        </p>
      </LegalSection>
      <LegalSection title="Datos tratados">
        <p>
          Podemos tratar datos de cuenta, email, nombre de perfil, datos de empresa introducidos por el usuario,
          clientes, facturas, presupuestos, gastos, datos de plan y registros tecnicos necesarios para seguridad,
          autenticacion y funcionamiento de la aplicacion.
        </p>
      </LegalSection>
      <LegalSection title="Finalidades">
        <p>
          Usamos los datos para gestionar el acceso a la beta, prestar el servicio de facturacion, aplicar limites de
          plan, atender soporte, mejorar la estabilidad del producto y mantener la seguridad de la plataforma.
        </p>
      </LegalSection>
      <LegalSection title="Datos introducidos por el usuario">
        <p>
          El usuario decide que datos de clientes, documentos y negocio introduce en FaktuDash. Debe contar con una
          base legal adecuada para tratar esos datos y revisar que los documentos emitidos son correctos antes de
          enviarlos o usarlos fiscalmente.
        </p>
      </LegalSection>
      <LegalSection title="Proveedores">
        <p>
          El servicio puede utilizar proveedores tecnicos como Supabase para autenticacion y base de datos, Vercel para
          alojamiento y despliegue, y Stripe solo para preparacion tecnica de pagos o pruebas cuando proceda. Durante
          la beta privada los pagos reales estan desactivados.
        </p>
      </LegalSection>
      <LegalSection title="Conservacion">
        <p>
          Conservaremos los datos mientras la cuenta este activa, mientras sean necesarios para prestar la beta o
          mientras deban conservarse por obligaciones legales, seguridad, resolucion de incidencias o defensa de
          reclamaciones.
        </p>
      </LegalSection>
      <LegalSection title="Derechos">
        <p>
          Puedes solicitar acceso, rectificacion, supresion, oposicion, limitacion y portabilidad cuando proceda,
          escribiendo a <a href={contactHref(contactEmails.privacy)}>{contactEmails.privacy}</a>.
        </p>
      </LegalSection>
      <LegalSection title="Cambios antes del lanzamiento">
        <p>
          Esta politica podra actualizarse antes del lanzamiento comercial para reflejar nuevas funciones, proveedores,
          condiciones de contratacion o informacion legal adicional.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
