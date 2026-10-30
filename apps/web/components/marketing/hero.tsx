"use client";

import { ArrowRight, Github, Monitor } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { downloadHref } from "@/lib/downloads";
import { PosMockup } from "@/components/marketing/pos-mockup";

const words = ["Restaurant", "software", "you", "actually", "own."];

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-20 pb-24 sm:px-6 sm:pt-28">
      {/* High-tech Cyber Grid Background */}
      <div
        aria-hidden
        className="daxabit-grid pointer-events-none absolute inset-x-0 top-0 -z-20 h-[640px] opacity-70"
      />

      {/* Ambient gradient glow — transform/opacity only, no layout cost */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary),transparent_88%),transparent)]"
      />

      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3.5 py-1.5 text-xs font-semibold text-foreground/80 shadow-sm backdrop-blur-md"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          <span>Daxabit</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">AGPL-3.0 Self-Hosted Hospitality Stack</span>
        </motion.div>

        <h1 className="flex flex-wrap justify-center gap-x-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          {words.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className={word === "own." ? "bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent" : undefined}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl font-normal leading-relaxed"
        >
          Point of Sale, Kitchen Display, Tables, Reservations, Inventory, and CRM — engineered by{" "}
          <strong className="font-semibold text-foreground">Daxabit</strong> into one robust stack that runs on your local network. No monthly subscription, no forced internet tether, no vendor lock-in.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="mt-9 flex flex-col items-center gap-3.5 sm:flex-row"
        >
          <Button size="lg" className="h-12 px-7 text-[15px] font-semibold shadow-lg shadow-primary/20" render={<Link href="/signup" />}>
            Get started free
            <ArrowRight className="size-4" data-icon="inline-end" />
          </Button>
          <Button
            variant="default"
            size="lg"
            className="h-12 px-6 text-[15px] font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/80 shadow-sm"
            render={<Link href="/download/windows" />}
          >
            <Monitor className="size-4 text-primary" data-icon="inline-start" />
            Download for Windows
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-6 text-[15px] border-border/80 bg-background/80 backdrop-blur-sm hover:bg-muted/80"
            render={<a href={downloadHref("github")} />}
          >
            <Github className="size-4" data-icon="inline-start" />
            View on GitHub
          </Button>
        </motion.div>

        {/* Feature Highlights Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-medium"
        >
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success" />
            ⚡ &lt;15ms Local LAN Latency
          </span>
          <span className="hidden sm:inline text-border">·</span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary" />
            🛡️ 100% Offline-First Reliability
          </span>
          <span className="hidden sm:inline text-border">·</span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success" />
            🔒 Your Data Stays On Your Hardware
          </span>
        </motion.div>
      </div>

      <div className="mt-14 sm:mt-18">
        <PosMockup />
      </div>
    </section>
  );
}
