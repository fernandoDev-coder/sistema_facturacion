import { LegalPage, LegalSection } from "@/components/legal-page";

export default function CookiesPage() {
  return (
    <LegalPage title="Politica de cookies" updatedAt="Junio 2026">
      <LegalSection title="Uso de cookies">
        <p>
          FaktuDash utiliza cookies tecnicas necesarias para iniciar sesion, mantener la seguridad, recordar
          preferencias basicas y hacer funcionar la aplicacion durante la beta privada.
        </p>
      </LegalSection>
      <LegalSection title="Cookies tecnicas">
        <p>
          Se pueden usar cookies de autenticacion de Supabase, cookies de sesion necesarias y la cookie
          faktudash_locale para recordar el idioma elegido por el usuario.
        </p>
      </LegalSection>
      <LegalSection title="Analitica o marketing">
        <p>
          Actualmente FaktuDash no utiliza cookies de analisis, publicidad, remarketing ni seguimiento comercial. Por
          ese motivo no se carga un banner de consentimiento para cookies no necesarias.
        </p>
      </LegalSection>
      <LegalSection title="Stripe">
        <p>
          Stripe puede usar sus propias cookies o tecnologias equivalentes si en el futuro se habilitan pagos o paginas
          externas de checkout. Durante la beta privada los pagos reales estan desactivados.
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
