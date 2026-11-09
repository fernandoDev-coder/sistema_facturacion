import Link from "next/link";
import { getLocale } from "@/lib/i18n";
import { buttonClass } from "@/components/button-styles";

export async function PreviewAccessNotice() {
  const es = await getLocale() === "es";
  return <main className="mx-auto max-w-xl space-y-5 px-4 py-16">
    <h1 className="text-2xl font-semibold">{es ? "Vista previa del producto" : "Product preview"}</h1>
    <p>{es ? "El acceso con cuenta aún no está disponible en esta vista previa. Puedes recorrer la demo con datos ficticios." : "Account access is not yet available in this preview. You can explore the demo with fictional data."}</p>
    <Link href="/demo" className={buttonClass({ variant: "primary" })}>{es ? "Probar la demo" : "Try the demo"}</Link>
  </main>;
}
