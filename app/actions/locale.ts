"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isLocale, localeCookieName } from "@/lib/i18n-config";

export async function setLocaleAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "");

  if (isLocale(locale)) {
    (await cookies()).set(localeCookieName, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  redirect(safeReturnPath((await headers()).get("referer")));
}

function safeReturnPath(referer: string | null) {
  if (!referer) return "/";

  try {
    const url = new URL(referer);
    return `${url.pathname}${url.search}`;
  } catch {
    return "/";
  }
}
