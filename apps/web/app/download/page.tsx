import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownToLine, ArrowRight, CheckCircle2, Laptop, Monitor } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { downloadHref } from "@/lib/downloads";

export const metadata: Metadata = {
  title: "Download Daxabit Desktop",
  description:
    "Download Daxabit restaurant management software for Windows or Ubuntu/Debian and follow the local installation guide.",
};

const setupSteps = [
  {
    number: "01",
    title: "Open Daxabit",
    description:
      "Start it from the Windows Start menu or Ubuntu/Debian Applications menu. The app opens its local first-run setup.",
  },
  {
    number: "02",
    title: "Create the administrator account",
    description:
      "Create the first local account for the person who manages the restaurant. This account is stored in the local database.",
  },
  {
    number: "03",
    title: "Add your restaurant details",
    description:
      "Enter your restaurant name, address, currency, tax settings, and service details.",
  },
  {
    number: "04",
    title: "Configure your daily workflow",
    description:
      "Add menu items and staff, then configure your receipt printer and kitchen stations before taking orders.",
  },
];

function DownloadCard({
  title,
  system,
  description,
  href,
  note,
  extraHref,
}: {
  title: string;
  system: string;
  description: string;
  href: string;
  note: string;
  extraHref?: string;
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {system.startsWith("Windows") ? <Monitor className="size-5" /> : <Laptop className="size-5" />}
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-primary">{system}</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <p className="mt-4 text-xs text-muted-foreground">{note}</p>
      <a
        href={href}
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ArrowDownToLine className="size-4" />
        Download for {system}
      </a>
      {extraHref && (
        <a href={extraHref} className="mt-3 text-center text-sm font-medium text-primary hover:underline">
          Download ARM64 package
        </a>
      )}
    </article>
  );
}

export default function DownloadPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <MarketingNav />
      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[430px] bg-[radial-gradient(60%_55%_at_50%_0%,color-mix(in_oklch,var(--primary),transparent_88%),transparent)]" />
          <div className="mx-auto max-w-4xl text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
              <Logo size={26} /> Daxabit restaurant management
            </Link>
            <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Monitor className="size-3.5" /> Local desktop software
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Download Daxabit for your computer
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Choose Windows or Ubuntu/Debian. Daxabit installs its database and services on the
          same computer, so restaurant data stays local and the app keeps working offline after
          setup. No hosted account or remote server is required.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
            <DownloadCard
              title="Windows desktop installer"
              system="Windows 10 / 11"
              description="Installs the desktop application with its local PostgreSQL database and Node.js backend. Launch Daxabit from the Start menu when setup finishes."
              href={downloadHref("windows-desktop")}
              note="64-bit · Internet is needed to download the installer."
            />
            <DownloadCard
              title="Ubuntu / Debian desktop package"
              system="Ubuntu / Debian"
              description="Installs Daxabit with its backend, web app, and database images bundled locally. Open it from the Applications menu after installation."
              href={downloadHref("linux-deb-amd64")}
              extraHref={downloadHref("linux-deb-arm64")}
              note="amd64 and arm64 packages · Docker Engine is required; the Daxabit services are bundled."
            />
          </div>
          <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-relaxed text-muted-foreground">
            Downloads are provided as platform-specific desktop installers in each published release.
          </p>
        </section>

        <section id="setup" className="scroll-mt-24 border-y border-border/70 bg-muted/20 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Local setup walkthrough</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">From download to your first order</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Install Daxabit on the computer used for restaurant operations. The desktop app,
                backend service, and database run on that device; no server address or hosted account is needed.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-border/70 bg-card p-5">
                <h3 className="text-base font-semibold text-foreground">Windows 10 / 11</h3>
                <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground">
                  <li>Download the Windows desktop installer above.</li>
                  <li>Open <code className="rounded bg-muted px-1 py-0.5 text-xs">DaxabitHMS-Setup.exe</code> and follow the installation prompts.</li>
                  <li>Launch Daxabit from the Start menu. The local services start with the desktop app.</li>
                </ol>
              </article>
              <article className="rounded-2xl border border-border/70 bg-card p-5">
                <h3 className="text-base font-semibold text-foreground">Ubuntu / Debian</h3>
                <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground">
                  <li>Download the amd64 or ARM64 .deb package above.</li>
                  <li>Open the package in Software Install, or run:</li>
                </ol>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-3 text-xs text-foreground"><code>sudo apt install ./daxabithms_VERSION_amd64.deb</code></pre>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  The installer loads the bundled Daxabit services into Docker. Internet is only needed to install Docker prerequisites; restaurant operations then run on this computer.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Launch DaxabitHMS from the Applications menu.</p>
              </article>
            </div>
            <h3 className="mt-10 text-xl font-semibold tracking-tight text-foreground">First-time restaurant setup</h3>
            <ol className="mt-9 grid gap-4 sm:grid-cols-2">
              {setupSteps.map((step) => (
                <li key={step.number} className="rounded-2xl border border-border/70 bg-card p-5">
                  <span className="text-sm font-bold tabular-nums text-primary">{step.number}</span>
                  <h3 className="mt-2 text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-success/20 bg-success/5 p-4 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              <p>
                <strong className="text-foreground">Your data stays on this computer.</strong> The desktop installation binds its services to the local device and does not provide a browser or LAN server for other computers.
              </p>
            </div>
            <Link href="/#features" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Explore restaurant features <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
