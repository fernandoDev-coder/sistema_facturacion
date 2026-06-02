import { LegalPage, LegalSection } from "@/components/legal-page";
import { contactEmails } from "@/lib/beta-config";

export default function LegalNoticePage() {
  return (
    <LegalPage title="Aviso legal" updatedAt="Junio 2026">
      <LegalSection title="Estado del servicio">
        <p>
          FaktuDash se encuentra en fase beta privada y pre-lanzamiento comercial. El acceso al servicio esta limitado
          a usuarios invitados o aceptados para validar el producto antes de su apertura publica.
        </p>
      </LegalSection>
      <LegalSection title="Informacion de contacto">
        <p>
          Nombre comercial: FaktuDash. Dominio principal: https://www.faktudash.com. Para cuestiones legales puedes
          escribir a <a href={`mailto:${contactEmails.legal}`}>{contactEmails.legal}</a>.
        </p>
      </LegalSection>
      <LegalSection title="Objeto">
        <p>
          El sitio permite conocer FaktuDash y, cuando el acceso este habilitado, usar una herramienta web de apoyo
          para gestionar clientes, facturas, presupuestos, gastos y datos de negocio.
        </p>
      </LegalSection>
      <LegalSection title="Acceso durante beta">
        <p>
          Durante la beta privada no se realizan cobros reales desde la aplicacion. Los planes Pro y Premium se
          muestran como referencia de producto y acceso anticipado, no como contratacion comercial activa.
        </p>
      </LegalSection>
      <LegalSection title="Uso correcto">
        <p>
          El usuario se compromete a utilizar FaktuDash de forma licita, a introducir datos veraces y a no emplear la
          plataforma para emitir documentos fraudulentos, suplantar a terceros o vulnerar derechos de otras personas.
        </p>
      </LegalSection>
      <LegalSection title="Propiedad intelectual">
        <p>
          La marca FaktuDash, el diseno, textos, codigo, interfaz y elementos visuales del servicio pertenecen a su
          titular o se usan con autorizacion. No se permite su copia, distribucion o explotacion sin permiso previo.
        </p>
      </LegalSection>
      <LegalSection title="Responsabilidad">
        <p>
          FaktuDash es una herramienta de apoyo administrativo. El usuario es responsable de revisar la exactitud
          fiscal, legal y contable de los documentos que genera y de cumplir las obligaciones aplicables a su actividad.
        </p>
      </LegalSection>
      <LegalSection title="Actualizaciones">
        <p>
          Este aviso podra actualizarse antes del lanzamiento comercial para reflejar la estructura definitiva del
          servicio, condiciones de contratacion y datos legales que deban publicarse.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
