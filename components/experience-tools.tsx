"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ExperienceLabels = {
  tools: string;
  close: string;
  commandPalette: string;
  commandPlaceholder: string;
  noResults: string;
  darkMode: string;
  lightMode: string;
  share: string;
  shared: string;
  copied: string;
  backToTop: string;
  shortcuts: string;
  navigation: string;
  home: string;
  pricing: string;
  dashboard: string;
  clients: string;
  invoices: string;
  budgets: string;
  contact: string;
};

type Theme = "light" | "dark";

const THEME_KEY = "faktudash-theme";

export function ExperienceTools({ labels }: { labels: ExperienceLabels }) {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("light");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollFrameRef = useRef<number | null>(null);

  const commands = useMemo(
    () => [
      { label: labels.home, href: "/", shortcut: "Alt H" },
      { label: labels.pricing, href: "/pricing" },
      { label: labels.dashboard, href: "/dashboard", shortcut: "Alt D" },
      { label: labels.clients, href: "/clients" },
      { label: labels.invoices, href: "/invoices", shortcut: "Alt I" },
      { label: labels.budgets, href: "/budgets" },
      { label: labels.contact, href: "/contact" },
    ],
    [labels],
  );

  const filteredCommands = commands.filter((command) =>
    command.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    const nextTheme: Theme = saved === "dark" || saved === "light"
      ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    const frame = window.requestAnimationFrame(() => setTheme(nextTheme));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => () => {
    if (scrollFrameRef.current) window.cancelAnimationFrame(scrollFrameRef.current);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const nextTheme = current === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = nextTheme;
      document.documentElement.style.colorScheme = nextTheme;
      window.localStorage.setItem(THEME_KEY, nextTheme);
      return nextTheme;
    });
  }, []);

  useEffect(() => {
    if (!paletteOpen) return;
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [paletteOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing = target?.matches("input, textarea, select, [contenteditable='true']");

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((current) => !current);
        setToolsOpen(false);
        return;
      }

      if (event.key === "Escape") {
        setPaletteOpen(false);
        setToolsOpen(false);
        return;
      }

      if (isEditing) return;
      if (event.altKey && event.key.toLowerCase() === "t") toggleTheme();
      if (event.altKey && event.key.toLowerCase() === "h") router.push("/");
      if (event.altKey && event.key.toLowerCase() === "d") router.push("/dashboard");
      if (event.altKey && event.key.toLowerCase() === "i") router.push("/invoices");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, toggleTheme]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("button:not(:disabled), [data-haptic='true']")) {
        window.navigator.vibrate?.(10);
      }
    };

    document.addEventListener("click", onClick, { passive: true });
    return () => document.removeEventListener("click", onClick);
  }, []);

  async function sharePage() {
    setToolsOpen(false);
    const shareData = { title: document.title, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setNotice(labels.shared);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setNotice(labels.copied);
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") setNotice(labels.copied);
    }
    window.setTimeout(() => setNotice(""), 2200);
  }

  function runCommand(href: string) {
    setPaletteOpen(false);
    setQuery("");
    router.push(href);
  }

  function scrollToTop() {
    setToolsOpen(false);
    const start = window.scrollY;
    if (start <= 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, 0);
      return;
    }

    if (scrollFrameRef.current) window.cancelAnimationFrame(scrollFrameRef.current);
    const startedAt = window.performance.now();
    const duration = Math.min(900, Math.max(520, start * 0.32));

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      window.scrollTo(0, Math.round(start * (1 - eased)));

      if (progress < 1) {
        scrollFrameRef.current = window.requestAnimationFrame(animate);
      } else {
        scrollFrameRef.current = null;
      }
    };

    scrollFrameRef.current = window.requestAnimationFrame(animate);
  }

  return (
    <>
      {toolsOpen ? (
        <button
          type="button"
          className="tool-dismiss-layer print:hidden"
          aria-label={labels.close}
          tabIndex={-1}
          onClick={() => setToolsOpen(false)}
        />
      ) : null}

      <div className="experience-tools print:hidden">
        {toolsOpen ? (
          <div className="tool-menu" role="menu" aria-label={labels.tools}>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setToolsOpen(false);
                setPaletteOpen(true);
              }}
            >
              <Icon name="search" />
              <span>{labels.commandPalette}</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                toggleTheme();
                setToolsOpen(false);
              }}
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} />
              <span>{theme === "dark" ? labels.lightMode : labels.darkMode}</span>
              <kbd>Alt T</kbd>
            </button>
            <button type="button" role="menuitem" onClick={sharePage}>
              <Icon name="share" />
              <span>{labels.share}</span>
            </button>
          </div>
        ) : null}

        <div className="tool-fab-row">
          <button
            type="button"
            className="tool-fab tool-fab-secondary"
            aria-label={labels.backToTop}
            title={labels.backToTop}
            onClick={scrollToTop}
          >
            <Icon name="arrowUp" />
          </button>
          <button
            type="button"
            className="tool-fab"
            aria-label={toolsOpen ? labels.close : labels.tools}
            aria-expanded={toolsOpen}
            onClick={() => setToolsOpen((current) => !current)}
          >
            <Icon name={toolsOpen ? "close" : "spark"} />
          </button>
        </div>
      </div>

      {paletteOpen ? (
        <div className="command-backdrop print:hidden" role="presentation" onMouseDown={() => setPaletteOpen(false)}>
          <section
            className="command-palette"
            role="dialog"
            aria-modal="true"
            aria-label={labels.commandPalette}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="command-search">
              <Icon name="search" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={labels.commandPlaceholder}
                aria-label={labels.commandPlaceholder}
              />
              <kbd>Esc</kbd>
            </div>
            <div className="command-results">
              <p className="command-group-label">{labels.navigation}</p>
              {filteredCommands.length ? (
                filteredCommands.map((command, index) => (
                  <button
                    key={command.href}
                    type="button"
                    className="command-item"
                    onClick={() => runCommand(command.href)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        (event.currentTarget.nextElementSibling as HTMLButtonElement | null)?.focus();
                      }
                      if (event.key === "ArrowUp") {
                        event.preventDefault();
                        (event.currentTarget.previousElementSibling as HTMLButtonElement | null)?.focus();
                      }
                    }}
                    autoFocus={index === 0 && Boolean(query)}
                  >
                    <span>{command.label}</span>
                    {command.shortcut ? <kbd>{command.shortcut}</kbd> : null}
                  </button>
                ))
              ) : (
                <p className="command-empty">{labels.noResults}</p>
              )}
            </div>
            <p className="command-hint">{labels.shortcuts}: Ctrl/⌘ K · Alt T · Alt H · Alt D · Alt I</p>
          </section>
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">{notice}</p>
    </>
  );
}

function Icon({ name }: { name: "spark" | "close" | "search" | "sun" | "moon" | "share" | "arrowUp" }) {
  const paths = {
    spark: <path d="m12 2 1.6 5.1L19 9l-5.4 1.9L12 16l-1.6-5.1L5 9l5.4-1.9L12 2Zm6 13 .8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15ZM5 14l1.1 2.9L9 18l-2.9 1.1L5 22l-1.1-2.9L1 18l2.9-1.1L5 14Z" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    moon: <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z" />,
    share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" /></>,
    arrowUp: <path d="m6 10 6-6 6 6M12 4v16" />,
  } as const;

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill={name === "spark" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}
