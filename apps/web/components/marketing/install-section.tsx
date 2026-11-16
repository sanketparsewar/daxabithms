import Link from "next/link";
import { ArrowRight, Laptop, MonitorDown } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";

const platforms = [
  {
    title: "Windows desktop",
    description: "A local Windows installer with the database, Node.js service, and desktop interface.",
    requirements: "Windows 10 or 11 · 64-bit",
  },
  {
    title: "Ubuntu or Debian desktop",
    description: "A local desktop package with a menu launcher and data stored on this computer.",
    requirements: "Ubuntu or Debian · 64-bit",
  },
];

export function InstallSection() {
  return (
    <section id="get-started" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal className="mx-auto max-w-2xl text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          Desktop application
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Install Daxabit on your computer
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Choose your operating system, download the installer, and follow the local setup guide.
          No hosted account or remote server is required.
        </p>
      </Reveal>

      <RevealGroup className="mt-10 grid gap-5 md:grid-cols-2">
        {platforms.map((platform) => (
          <RevealItem key={platform.title}>
            <Link
              href="/download"
              className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card/90 p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {platform.title.startsWith("Windows") ? (
                  <MonitorDown className="size-5" />
                ) : (
                  <Laptop className="size-5" />
                )}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{platform.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {platform.description}
              </p>
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{platform.requirements}</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:translate-x-1">
                  Download <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
