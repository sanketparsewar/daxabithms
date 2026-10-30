import {
  ChefHat,
  GitBranch,
  Gift,
  Package,
  Plug,
  QrCode,
  ShieldCheck,
  UtensilsCrossed,
  WifiOff,
} from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";

const features = [
  {
    icon: UtensilsCrossed,
    title: "Dine-in POS & billing",
    description:
      "Modifiers, combos, split & merge bills, tips, gift cards, multi-payment checkout, and tax-inclusive GST pricing done right.",
  },
  {
    icon: ChefHat,
    title: "Live Kitchen Display",
    description:
      "KOTs auto-routed to the right kitchen station, reprint & priority controls, and per-station prep-time reporting.",
  },
  {
    icon: QrCode,
    title: "Tables & reservations",
    description:
      "Visual floor plan, booking with waitlist, table transfer, and per-table QR codes for a read-only public menu.",
  },
  {
    icon: Package,
    title: "Inventory & procurement",
    description:
      "Ingredients, weighted-average recipe costing, purchase orders, goods receipt with batch/lot tracking, and FIFO waste logging.",
  },
  {
    icon: Gift,
    title: "CRM, loyalty & gift cards",
    description:
      "Customer profiles, earn-and-redeem loyalty points, gift card issuance, and full visit history.",
  },
  {
    icon: WifiOff,
    title: "Offline-first by design",
    description:
      "The whole stack runs on one local server. Order-taking, billing, KDS, and printing keep working with the WAN cable unplugged.",
  },
  {
    icon: ShieldCheck,
    title: "RBAC on every action",
    description:
      "Granular, individually toggleable permissions and strict multi-tenant isolation — never a hardcoded role check.",
  },
  {
    icon: GitBranch,
    title: "Open source, no lock-in",
    description:
      "AGPL-3.0 licensed. Self-host on Docker, CasaOS/ZimaOS, or a Windows client — your data never has to leave your building.",
  },
  {
    icon: Plug,
    title: "API & MCP integrations",
    description:
      "Connect an MCP client like Claude Desktop with your own permissions, or issue a scoped API key so your website can browse the menu, place orders, and book tables through Daxabit directly.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-3">
          Comprehensive Feature Matrix
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Everything a high-volume venue needs
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Not an adapted retail checkout — purpose-built by <strong className="text-foreground">Daxabit</strong> for
          dine-in, takeaway, and high-speed kitchen operations.
        </p>
      </Reveal>

      <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <RevealItem
            key={f.title}
            className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl"
          >
            <div>
              <div className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span>Included out-of-the-box</span>
              <span>&rarr;</span>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
