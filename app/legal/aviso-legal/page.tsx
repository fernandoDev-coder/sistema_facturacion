import { LegalPage, LegalSection } from "@/components/legal-page";

export default function LegalNoticePage() {
  return (
    <LegalPage title="Aviso legal" updatedAt="Mayo 2026">
      <LegalSection title="Titular del servicio">
        <p>
          FaktuDash es una aplicacion SaaS de facturacion para autonomos y pequenos negocios. Antes de publicar,
          sustituye este texto por los datos reales del titular: nombre o razon social, NIF/CIF, domicilio y email
          de contacto.
        </p>
      </LegalSection>
      <LegalSection title="Objeto">
        <p>
          Este sitio permite conocer FaktuDash, crear una cuenta, gestionar clientes, facturas, presupuestos y planes
          de uso del servicio.
        </p>
      </LegalSection>
      <LegalSection title="Propiedad intelectual">
        <p>
          La marca FaktuDash, el diseno, textos, codigo y elementos visuales del servicio pertenecen a su titular o se
          usan con autorizacion. No se permite su copia, distribucion o explotacion sin permiso.
        </p>
      </LegalSection>
      <LegalSection title="Responsabilidad">
        <p>
          El servicio se ofrece como herramienta de apoyo administrativo. El usuario es responsable de revisar la
          exactitud fiscal, legal y contable de los documentos que emite.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
