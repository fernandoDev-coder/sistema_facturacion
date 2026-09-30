"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = { href: string; label: string };

export function MobileNavigation({
  items,
  menuLabel,
  closeLabel,
  logoutLabel,
  logoutAction,
}: {
  items: NavItem[];
  menuLabel: string;
  closeLabel: string;
  logoutLabel: string;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden print:hidden">
      <button
        type="button"
        className="mobile-menu-trigger"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {open ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
        <span>{open ? closeLabel : menuLabel}</span>
      </button>

      {open ? (
        <>
          <button className="mobile-nav-backdrop" type="button" aria-label={closeLabel} onClick={() => setOpen(false)} />
          <nav id="mobile-navigation" className="mobile-nav-panel" aria-label={menuLabel}>
            {items.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
              return (
                <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              );
            })}
            <form action={logoutAction}>
              <button type="submit" className="mobile-nav-logout">{logoutLabel}</button>
            </form>
          </nav>
        </>
      ) : null}
    </div>
  );
}
