"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Check, 
  Copy, 
  Download, 
  Laptop, 
  Monitor, 
  Printer, 
  Wifi, 
  WifiOff, 
  Zap, 
  HelpCircle,
  FileCode,
  HardDrive
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

const POWERSHELL_COMMAND = `irm http://localhost:3000/downloads/Install-Daxabit.ps1 | iex`;

export default function DownloadWindowsPage() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"quick" | "standalone" | "client">("quick");

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(POWERSHELL_COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl">
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
                Hospitality Suite
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to Home
            </Link>
            <Button size="sm" render={<Link href="/login" />}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-16 pb-12 sm:px-6 lg:pt-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,99,235,0.15),transparent)]" />
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-4">
            <Monitor className="size-3.5" />
            Official Windows Desktop Suite
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            Daxabit for Windows
          </h1>

          <p className="mt-5 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Run your restaurant management, POS billing, kitchen display, and table reservations natively on Windows. Works <strong>100% offline</strong> or connected to your cloud and LAN.
          </p>

          {/* Quick Download CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/downloads/DaxabitHMS-Setup.bat"
              download="DaxabitHMS-Setup.bat"
              className="inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="size-4" />
              Download Windows Setup (.bat)
            </a>

            <a
              href="/downloads/Install-Daxabit.ps1"
              download="Install-Daxabit.ps1"
              className="inline-flex h-12 items-center justify-center gap-2.5 rounded-xl border border-border bg-card/80 px-6 text-sm font-semibold text-foreground backdrop-blur-sm shadow-sm transition-all hover:bg-muted hover:border-primary/40"
            >
              <FileCode className="size-4 text-primary" />
              PowerShell Script (.ps1)
            </a>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Compatible with Windows 10 & 11 (64-bit) · Direct thermal receipt printing · Standalone offline engine
          </p>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-xs backdrop-blur-sm">
            <div className="inline-flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 mb-3">
              <WifiOff className="size-5" />
            </div>
            <h3 className="font-semibold text-foreground text-base">100% Offline Resilience</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Never stop billing if the internet goes down. Orders, payments, and receipt printing function seamlessly on your local hardware.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-xs backdrop-blur-sm">
            <div className="inline-flex size-10 items-center justify-center rounded-xl bg-green-500/10 text-green-500 mb-3">
              <Zap className="size-5" />
            </div>
            <h3 className="font-semibold text-foreground text-base">&lt;15ms Native Response</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Native desktop window with zero latency. Quick barcode scanning, split bills, and table floor layout updates in real-time.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-xs backdrop-blur-sm">
            <div className="inline-flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 mb-3">
              <Printer className="size-5" />
            </div>
            <h3 className="font-semibold text-foreground text-base">Direct Hardware &amp; Printers</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Standard Windows Print Spooler integration. Works out of the box with any USB, Bluetooth, or LAN ESC/POS 80mm/58mm thermal printer.
            </p>
          </div>
        </div>
      </section>

      {/* Installation Modes / Tabs */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-border bg-card/70 p-6 sm:p-8 shadow-sm">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Complete Setup &amp; Installation Guide
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Choose how you want to configure Daxabit on your Windows devices:
            </p>
          </div>

          {/* Tab Selector */}
          <div className="mt-6 flex flex-wrap gap-2 border-b border-border/80 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("quick")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === "quick"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Option 1: One-Click Desktop Setup
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("standalone")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === "standalone"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Option 2: Complete Offline Server
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("client")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === "client"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Option 3: Multi-Terminal Client (LAN)
            </button>
          </div>

          {/* Tab 1: One-Click Desktop Setup */}
          {activeTab === "quick" && (
            <div className="mt-6 space-y-6">
              <div className="rounded-xl border border-border/70 bg-muted/30 p-5">
                <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                  <Laptop className="size-4 text-primary" />
                  Quick Installation Steps:
                </h3>
                <ol className="mt-4 space-y-3.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">1</span>
                    <div>
                      <strong className="text-foreground">Download Setup File:</strong> Click the <strong>Download Windows Setup (.bat)</strong> button above to download <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground font-mono">DaxabitHMS-Setup.bat</code>.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">2</span>
                    <div>
                      <strong className="text-foreground">Run the Installer:</strong> Double-click the downloaded <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground font-mono">DaxabitHMS-Setup.bat</code> file. 
                      <span className="block mt-1 text-xs text-muted-foreground/80">
                        (If Windows Defender SmartScreen shows <em>&quot;Windows protected your PC&quot;</em>, click <strong>More info</strong> &rarr; <strong>Run anyway</strong>).
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">3</span>
                    <div>
                      <strong className="text-foreground">Select Option [1] or [3]:</strong> Option [1] immediately launches the Daxabit native window, while Option [3] creates a dedicated <strong>Daxabit HMS</strong> desktop icon on your desktop.
                    </div>
                  </li>
                </ol>
              </div>

              {/* PowerShell Alternative */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Or Run Directly via PowerShell:
                </h4>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-black/40 px-4 py-3 font-mono text-xs text-foreground/90 backdrop-blur-md">
                  <code className="truncate">{POWERSHELL_COMMAND}</code>
                  <button
                    type="button"
                    onClick={copyScript}
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                    title="Copy command"
                  >
                    {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Standalone Offline Server */}
          {activeTab === "standalone" && (
            <div className="mt-6 space-y-5">
              <div className="rounded-xl border border-border/70 bg-muted/30 p-5">
                <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                  <HardDrive className="size-4 text-primary" />
                  All-in-One PC Setup (Main Restaurant Terminal):
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Ideal when you have one primary computer at the billing counter that hosts the restaurant database, handles all orders, and prints receipts without needing any external server or continuous internet connection.
                </p>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2.5">
                    <Check className="size-4 text-success shrink-0 mt-0.5" />
                    <span>Includes embedded, automated PostgreSQL database management.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="size-4 text-success shrink-0 mt-0.5" />
                    <span>Automatically broadcasts on your local Wi-Fi/LAN so wireless tablets and KDS screens can connect.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="size-4 text-success shrink-0 mt-0.5" />
                    <span>Zero recurring cloud hosting costs. Your data is owned 100% by you.</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 p-4 text-xs text-muted-foreground bg-card">
                <strong>How to start in Offline Standalone Mode:</strong> In the setup file, select <strong>[2] Standalone Offline Server</strong>. It configures the local service, initializes the schema, and launches the app directly on your machine.
              </div>
            </div>
          )}

          {/* Tab 3: Multi-Terminal Client (LAN) */}
          {activeTab === "client" && (
            <div className="mt-6 space-y-5">
              <div className="rounded-xl border border-border/70 bg-muted/30 p-5">
                <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                  <Wifi className="size-4 text-primary" />
                  Multi-Terminal LAN Setup:
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Connect multiple Windows touchscreens, ordering stations, or kitchen display screens (KDS) across the kitchen and dining floors to your main Daxabit server.
                </p>
                <ol className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                  <li><strong>Step 1:</strong> Find the IP address of your main Daxabit PC (e.g. <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">http://192.168.1.50:3000</code>).</li>
                  <li><strong>Step 2:</strong> Run the Windows Setup file on the additional terminal PC.</li>
                  <li><strong>Step 3:</strong> Enter your main PC&apos;s IP address when prompted. The terminal connects immediately with real-time sync.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* System Requirements & FAQ */}
      <section className="mx-auto max-w-4xl px-4 py-8 pb-20 sm:px-6">
        <h3 className="text-xl font-bold tracking-tight text-foreground mb-4">
          Hardware &amp; System Requirements
        </h3>
        <div className="overflow-hidden rounded-2xl border border-border bg-card/60">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/80 bg-muted/40 font-semibold text-foreground">
              <tr>
                <th className="px-5 py-3">Component</th>
                <th className="px-5 py-3">Minimum</th>
                <th className="px-5 py-3">Recommended</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-muted-foreground">
              <tr>
                <td className="px-5 py-3 font-medium text-foreground">Operating System</td>
                <td className="px-5 py-3">Windows 10 64-bit (1809+)</td>
                <td className="px-5 py-3 text-foreground">Windows 11 (64-bit)</td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium text-foreground">Memory (RAM)</td>
                <td className="px-5 py-3">4 GB RAM</td>
                <td className="px-5 py-3 text-foreground">8 GB+ RAM</td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium text-foreground">Disk Space</td>
                <td className="px-5 py-3">500 MB (Client)</td>
                <td className="px-5 py-3 text-foreground">2 GB SSD (Offline Server)</td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium text-foreground">Receipt Printer</td>
                <td className="px-5 py-3" colSpan={2}>
                  Any standard Windows thermal printer (80mm / 58mm via USB, Network, or Bluetooth)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex items-center justify-between rounded-2xl border border-border/80 bg-muted/20 p-5">
          <div className="flex items-center gap-3">
            <HelpCircle className="size-5 text-primary shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-foreground">Need help or enterprise assistance?</span>
              <p className="text-muted-foreground text-xs">Read the full technical documentation and compliance guide.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" render={<Link href="/docs" />}>
            Read Documentation
          </Button>
        </div>
      </section>
    </div>
  );
}
