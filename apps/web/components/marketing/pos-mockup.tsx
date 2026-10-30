"use client";

import { motion } from "motion/react";
import { Activity, Flame, UtensilsCrossed } from "lucide-react";

const tickets = [
  { table: "Table 4", items: ["2x Margherita", "1x Iced Latte"], status: "Preparing", elapsed: "4m ago", priority: "Rush" },
  { table: "Table 9", items: ["1x Butter Chicken", "2x Naan"], status: "Ready", elapsed: "8m ago", priority: "Standard" },
  { table: "Takeaway #182", items: ["1x Cold Brew", "1x Croissant"], status: "New", elapsed: "Just now", priority: "Takeaway" },
];

const statusColor: Record<string, string> = {
  New: "bg-warning/15 text-warning border-warning/30",
  Preparing: "bg-primary/15 text-primary border-primary/30",
  Ready: "bg-success/15 text-success border-success/30",
};

export function PosMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className="relative mx-auto w-full max-w-3xl"
    >
      <div className="daxabit-glow overflow-hidden rounded-2xl border border-border/70 bg-card/90 backdrop-blur-md shadow-[0_25px_80px_-20px_rgba(0,0,0,0.35)]">
        {/* Window Chrome Header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-destructive/60" />
            <span className="size-2.5 rounded-full bg-warning/60" />
            <span className="size-2.5 rounded-full bg-success/60" />
            <span className="ml-2 text-xs font-semibold tracking-tight text-foreground/90">
              Daxabit Live KDS · Kitchen Station 1
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            <span className="hidden font-mono text-[11px] font-medium text-success sm:inline">
              100% LAN Connected
            </span>
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="grid gap-3.5 p-4 sm:grid-cols-3">
          {tickets.map((t, i) => (
            <motion.div
              key={t.table}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.35 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 bg-background/95 p-3.5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold tracking-tight text-foreground">{t.table}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColor[t.status]}`}>
                    {t.status}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground font-mono">{t.elapsed} · {t.priority}</p>
                <ul className="mt-2.5 flex flex-col gap-1.5 border-t border-border/40 pt-2">
                  {t.items.map((it) => (
                    <li key={it} className="flex items-center gap-1.5 text-xs text-foreground/80 font-medium">
                      <span className="size-1 rounded-full bg-primary/60" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Flame className="size-3 text-warning" />
                  KOT #{100 + i * 4}
                </span>
                <span className="font-semibold text-primary">Station Hot</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating Status Card Left — LAN Ping */}
      <motion.div
        initial={{ opacity: 0, x: -16, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -left-4 -bottom-6 hidden w-44 rounded-xl border border-border/70 bg-card/95 p-3 shadow-xl backdrop-blur-md sm:block"
      >
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-success/15 text-success">
            <Activity className="size-3.5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Local LAN Sync</p>
            <p className="text-sm font-semibold text-foreground">0.8 ms ping</p>
          </div>
        </div>
      </motion.div>

      {/* Floating KPI Card Right — Table occupancy */}
      <motion.div
        initial={{ opacity: 0, x: 16, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.4, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -right-4 -bottom-6 hidden w-44 rounded-xl border border-border/70 bg-card/95 p-3 shadow-xl backdrop-blur-md sm:block"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium text-muted-foreground">Table occupancy</p>
          <UtensilsCrossed className="size-3.5 text-muted-foreground" />
        </div>
        <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">72%</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: "72%" }}
            transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
