import { LegalPage, LegalSection } from "@/components/legal-page";

export default function CookiesPage() {
  return (
    <LegalPage title="Politica de cookies" updatedAt="Mayo 2026">
      <LegalSection title="Uso de cookies">
        <p>
          FaktuDash puede usar cookies o tecnologias similares necesarias para iniciar sesion, mantener la seguridad y
          recordar preferencias basicas del servicio.
        </p>
      </LegalSection>
      <LegalSection title="Cookies tecnicas">
        <p>
          Las cookies tecnicas son necesarias para que la aplicacion funcione correctamente, por ejemplo para mantener
          una sesion autenticada.
        </p>
      </LegalSection>
      <LegalSection title="Analitica o marketing">
        <p>
          Si en el futuro se anaden herramientas de analitica, publicidad o seguimiento no necesarias, se debera pedir
          consentimiento antes de cargarlas y actualizar esta politica.
        </p>
      </LegalSection>
      <LegalSection title="Gestion">
        <p>
          El usuario puede borrar o bloquear cookies desde la configuracion de su navegador. Si bloquea cookies
          tecnicas, algunas partes de la aplicacion pueden dejar de funcionar.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
