import { LegalPage, LegalSection } from "@/components/legal-page";
import { contactEmails } from "@/lib/beta-config";

export default function TermsPage() {
  return (
    <LegalPage title="Terminos y condiciones" updatedAt="Junio 2026">
      <LegalSection title="Servicio en beta privada">
        <p>
          FaktuDash permite gestionar clientes, facturas, presupuestos, gastos, datos de empresa y planes de uso desde
          una aplicacion web. Actualmente el servicio esta en beta privada y puede cambiar antes del lanzamiento
          comercial.
        </p>
      </LegalSection>
      <LegalSection title="Planes">
        <p>
          El plan Gratis esta disponible con limites de uso. Los planes Pro y Premium pueden mostrarse como referencia
          o acceso anticipado, pero no implican contratacion activa ni cobros reales durante la beta privada.
        </p>
      </LegalSection>
      <LegalSection title="Pagos y cancelacion">
        <p>
          Los pagos reales estan desactivados durante la beta privada. Stripe puede permanecer configurado en modo de
          desarrollo o pruebas para preparar el lanzamiento comercial futuro.
        </p>
      </LegalSection>
      <LegalSection title="Uso correcto">
        <p>
          El usuario se compromete a usar la herramienta de forma licita y a revisar los datos fiscales, importes,
          impuestos y textos incluidos en los documentos emitidos.
        </p>
      </LegalSection>
      <LegalSection title="Responsabilidad fiscal">
        <p>
          FaktuDash no sustituye el asesoramiento de una gestoria, asesor fiscal o profesional cualificado. El usuario
          es responsable de comprobar que sus facturas, presupuestos, gastos, impuestos y datos legales cumplen la
          normativa aplicable a su actividad.
        </p>
      </LegalSection>
      <LegalSection title="Disponibilidad y cambios">
        <p>
          Al estar en beta, pueden existir errores, interrupciones, cambios de funcionalidad o ajustes de limites. Se
          intentara comunicar cualquier cambio relevante a los usuarios afectados.
        </p>
      </LegalSection>
      <LegalSection title="Datos y seguridad">
        <p>
          El usuario debe custodiar sus credenciales y mantener actualizados sus datos de cuenta. Para incidencias de
          soporte puedes escribir a <a href={`mailto:${contactEmails.support}`}>{contactEmails.support}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
