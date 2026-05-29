import { LegalPage, LegalSection } from "@/components/legal-page";

export default function TermsPage() {
  return (
    <LegalPage title="Terminos y condiciones" updatedAt="Mayo 2026">
      <LegalSection title="Servicio">
        <p>
          FaktuFlow permite gestionar clientes, facturas, presupuestos, datos de empresa y planes de uso desde una
          aplicacion web.
        </p>
      </LegalSection>
      <LegalSection title="Planes">
        <p>
          El plan Gratis incluye limites de uso. El plan Pro tiene un precio de 7,90 EUR al mes + IVA e incluye
          clientes ilimitados, documentos ilimitados, facturacion mensual masiva y logo en documentos.
        </p>
      </LegalSection>
      <LegalSection title="Pagos y cancelacion">
        <p>
          Los pagos del plan Pro se gestionan mediante Stripe. El usuario podra cancelar o gestionar su suscripcion
          desde el area de plan cuando este disponible en su cuenta.
        </p>
      </LegalSection>
      <LegalSection title="Uso correcto">
        <p>
          El usuario se compromete a usar la herramienta de forma licita y a revisar los datos fiscales, importes,
          impuestos y textos incluidos en los documentos emitidos.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
