import type { Metadata } from "next";
import Link from "next/link";
import { DocPage, DocSection } from "@/components/marketing/doc-page";

export const metadata: Metadata = {
  title: "Documentation — Daxabit",
  description: "Product information and local desktop installation help for Daxabit.",
};

const docs = [
  {
    href: "/download#setup",
    title: "Desktop installation",
    description: "Download Daxabit and set it up locally on Windows or Ubuntu/Debian.",
  },
  {
    href: "/docs/accessibility",
    title: "Accessibility",
    description: "How Daxabit is built to work with keyboards, screen readers, and reduced motion.",
  },
  {
    href: "/docs/compliance-india",
    title: "India compliance",
    description: "GST, receipts, and data-residency notes for running Daxabit in India.",
  },
];

export default function DocsIndexPage() {
  return (
    <DocPage title="Documentation" updated="30 September 2026">
      <DocSection heading="Guides">
        <div className="flex flex-col divide-y divide-border/60 rounded-xl border border-border/60">
          {docs.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              className="flex flex-col gap-1 p-4 transition-colors hover:bg-secondary"
            >
              <span className="text-sm font-medium text-foreground">{doc.title}</span>
              <span className="text-sm text-muted-foreground">{doc.description}</span>
            </Link>
          ))}
        </div>
      </DocSection>

      <DocSection heading="Download the desktop application">
        <p>
          Daxabit is installed on one computer and runs its database and services locally. Choose a
          package and follow the setup walkthrough on the <Link href="/download" className="text-primary underline underline-offset-4">desktop download page</Link>.
        </p>
      </DocSection>
    </DocPage>
  );
}
