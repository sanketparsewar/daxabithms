import { FileCheck2, Lock, ScanEye, ServerCog } from "lucide-react";
import Link from "next/link";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";

const points = [
  {
    icon: Lock,
    title: "Hardened by default",
    description:
      "bcrypt password hashing, rate-limited login/PIN, httpOnly session cookies, and strict tenant isolation on every query.",
  },
  {
    icon: ServerCog,
    title: "Server-authoritative money",
    description:
      "Prices, tax, discounts, and totals are always recomputed server-side — checkout and refunds are race-condition safe under concurrent requests.",
  },
  {
    icon: ScanEye,
    title: "Your data stays on your server",
    description:
      "Self-hosted on your own LAN or VPS — no restaurant or customer data is ever sent to a third-party cloud you don't control.",
  },
  {
    icon: FileCheck2,
    title: "Documented compliance posture",
    description:
      "Written accessibility and India data-protection notes — not a marketing claim, an actual document you can read.",
  },
];

export function SecuritySection() {
  return (
    <section id="security" className="border-y border-border/70 bg-muted/20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3.5 py-1 text-xs font-semibold text-success mb-3">
            Enterprise-Grade Hardening
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Security built into every layer
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Daxabit ensures your restaurant operations, revenue records, and guest data
            remain strictly private, encrypted, and isolated to your hardware.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2">
          {points.map((p) => (
            <RevealItem
              key={p.title}
              className="group flex gap-4 rounded-2xl border border-border/70 bg-card/90 p-6 shadow-xs backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <p.icon className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight text-foreground">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal delay={0.1} className="mt-12 flex flex-wrap justify-center items-center gap-3">
          <Link
            href="/docs/accessibility"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline underline-offset-4 hover:opacity-85"
          >
            Read accessibility compliance
          </Link>
          <span className="text-sm text-muted-foreground/60">·</span>
          <Link
            href="/docs/compliance-india"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline underline-offset-4 hover:opacity-85"
          >
            Read India data-protection notes
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
