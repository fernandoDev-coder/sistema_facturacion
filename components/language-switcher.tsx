import { setLocaleAction } from "@/app/actions/locale";
import { locales, type Locale } from "@/lib/i18n-config";

export function LanguageSwitcher({
  locale,
  labels,
}: {
  locale: Locale;
  labels: { language: string; es: string; en: string };
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-1" aria-label={labels.language}>
      {locales.map((item) => (
        <form key={item} action={setLocaleAction}>
          <input type="hidden" name="locale" value={item} />
          <button
            type="submit"
            className={`h-7 rounded px-2 text-xs font-semibold transition ${
              locale === item ? "bg-blue-700 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            {item === "es" ? labels.es : labels.en}
          </button>
        </form>
      ))}
    </div>
  );
}
