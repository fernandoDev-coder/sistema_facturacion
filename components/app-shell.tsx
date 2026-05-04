import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { buttonClass } from "@/components/button-styles";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/communities", label: "Comunidades" },
  { href: "/invoices", label: "Facturas" },
  { href: "/budgets", label: "Presupuestos" },
  { href: "/settings/company", label: "Empresa" },
];

export function AppShell({
  children,
  email,
  showAdminLink = false,
}: {
  children: React.ReactNode;
  email?: string | null;
  showAdminLink?: boolean;
}) {
  const visibleNavItems = showAdminLink ? [...navItems, { href: "/admin/users", label: "Usuarios" }] : navItems;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-zinc-200 bg-white px-5 py-6 lg:block print:hidden">
        <Link href="/dashboard" className="block text-lg font-semibold">
          Facturación Comunidades
        </Link>
        <nav className="mt-8 space-y-1">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-6 left-5 right-5">
          <p className="truncate text-xs text-zinc-500">{email}</p>
          <form action={logoutAction} className="mt-3">
            <button className={buttonClass({ variant: "secondary", size: "full" })}>
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden print:hidden">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="font-semibold">
            Facturación
          </Link>
          <form action={logoutAction}>
            <button className={buttonClass({ variant: "secondary", size: "sm" })}>Salir</button>
          </form>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="lg:pl-64 print:p-0">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:p-0">{children}</div>
      </main>
    </div>
  );
}
