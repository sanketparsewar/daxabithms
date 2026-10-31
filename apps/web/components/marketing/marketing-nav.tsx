"use client";

import { Github, Menu, Monitor, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { downloadHref } from "@/lib/downloads";

const links = [
  { href: "#features", label: "Features" },
  { href: "#security", label: "Security" },
  { href: "/download/windows", label: "Windows App" },
  { href: "#get-started", label: "Get started" },
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
          <Button
            variant="outline"
            size="default"
            className="font-medium gap-1.5 hidden lg:inline-flex border-primary/25 text-primary hover:bg-primary/10"
            render={<Link href="/download/windows" />}
          >
            <Monitor className="size-3.5" />
            Download for Windows
          </Button>
          <a
            href={downloadHref("github")}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          >
            <Github className="size-4" />
            GitHub
          </a>
          <Button variant="ghost" size="default" className="font-medium" render={<Link href="/login" />}>
            Sign in
          </Button>
          <Button variant="default" size="default" className="font-semibold shadow-sm shadow-primary/25" render={<Link href="/signup" />}>
            Get started free
          </Button>
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
            <div className="mt-2 flex flex-col gap-2">
              <Button variant="outline" render={<Link href="/login" />}>
                Sign in
              </Button>
              <Button variant="default" render={<Link href="/signup" />}>
                Get started free
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
