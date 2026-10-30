"use client";

import { Check, Copy, Github, HardDrive, Monitor, Terminal } from "lucide-react";
import { useState } from "react";
import { AnimatedCounter } from "@/components/marketing/animated-counter";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { downloadHref, totalDownloads } from "@/lib/downloads";
import { useDownloadStats } from "@/hooks/use-download-stats";

const INSTALL_COMMAND =
  "git clone https://github.com/daxabit/daxabit.git && cd daxabit && ./install.sh";

const channels = [
  {
    channel: "windows" as const,
    icon: Monitor,
    title: "Windows Desktop",
    description: "Native Windows 10/11 desktop suite with offline & online support and direct thermal printing.",
  },
  {
    channel: "install-script" as const,
    icon: Terminal,
    title: "One-click install",
    description: "Clone the repo and run install.sh — generates secrets, builds, and seeds nothing but a real signup.",
  },
  {
    channel: "docker" as const,
    icon: HardDrive,
    title: "Docker Compose",
    description: "Postgres, API, and web app — three services, one docker compose up.",
  },
  {
    channel: "casaos" as const,
    icon: HardDrive,
    title: "CasaOS / ZimaOS",
    description: "Install from the official CasaOS App Store on your home server or NAS.",
  },
  {
    channel: "github" as const,
    icon: Github,
    title: "View source",
    description: "AGPL-3.0 licensed. Read the code, fork it, self-host it — nothing hidden.",
  },
];

function CopyCommand() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(INSTALL_COMMAND);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="group relative flex w-full max-w-xl items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/90 px-4 py-3 text-left font-mono text-[13px] text-foreground/90 shadow-sm backdrop-blur-md transition-all hover:border-primary/50 hover:shadow-md"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="font-bold text-primary select-none">$</span>
        <span className="truncate">{INSTALL_COMMAND}</span>
      </div>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground">
        {copied ? <Check className="size-3.5 text-success group-hover:text-primary-foreground" /> : <Copy className="size-3.5" />}
      </span>
    </button>
  );
}

export function InstallSection() {
  const { data: stats } = useDownloadStats();
  const total = totalDownloads(stats);

  return (
    <section id="get-started" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-3">
          Instant Deployment
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Running in minutes, not weeks
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Deploy Daxabit on your local server, NAS, or private VPS.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mt-8 flex justify-center">
        <CopyCommand />
      </Reveal>

      <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {channels.map((c) => (
          <RevealItem key={c.channel}>
            <a
              href={downloadHref(c.channel)}
              className="group flex h-full flex-col justify-between rounded-2xl border border-border/70 bg-card/90 p-6 shadow-xs backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl"
            >
              <div>
                <div className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                  <c.icon className="size-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {c.description}
                </p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-transform duration-200 group-hover:translate-x-1">
                Continue deployment &rarr;
              </span>
            </a>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal delay={0.15} className="mt-14 flex flex-col items-center gap-1.5 text-center">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-success" />
          </span>
          <p className="text-4xl font-extrabold tabular-nums tracking-tight text-foreground sm:text-5xl">
            <AnimatedCounter value={total} />
          </p>
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          verified link click-throughs tracked since release &mdash;{" "}
          <a
            href="/api/v1/downloads/stats"
            className="text-primary underline underline-offset-4 hover:opacity-80"
          >
            view live counter API
          </a>
        </p>
      </Reveal>
    </section>
  );
}
