"use client";

import { Download, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/layout/logo";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/download", label: "Desktop app" },
  { href: "/download#setup", label: "Setup guide" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/75 bg-background/85 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative flex items-center justify-center rounded-lg p-0.5 transition-transform duration-200 group-hover:scale-105">
            <Logo size={32} />
          </div>
          <div className="flex flex-col">
            <span className="text-[16px] font-bold tracking-tight text-foreground">
              Daxabit
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-primary -mt-1">
              Restaurant & Hotel Suite
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline hover:underline-offset-4"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <Link
            href="/download"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Download className="size-4" />
            Download desktop app
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="inline-flex size-9 items-center justify-center rounded-lg text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/download"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              <Download className="size-4" />
              Download desktop app
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
