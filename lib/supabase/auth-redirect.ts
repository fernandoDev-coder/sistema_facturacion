export function safeAuthRedirect(path: string | null, origin: string): URL | null {
  if (!path?.startsWith("/")) return null;
  try {
    const target = new URL(path, origin);
    return target.origin === origin ? target : null;
  } catch {
    return null;
  }
}
