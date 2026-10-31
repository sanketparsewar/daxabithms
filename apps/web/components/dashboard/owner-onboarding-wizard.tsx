"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Store,
  LayoutGrid,
  UtensilsCrossed,
  Printer,
  Users,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  ChefHat,
  Receipt,
  Boxes,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/use-auth";
import { useBranch } from "@/hooks/use-branch";
import { useSettings } from "@/hooks/use-settings";
import { useFloors } from "@/hooks/use-tables";
import { useCategories, useMenuItems } from "@/hooks/use-menu";
import { useStaff } from "@/hooks/use-staff";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";

const STORAGE_KEY_MINIMIZED = "daxabit:onboarding:minimized";
const STORAGE_KEY_DISMISSED = "daxabit:onboarding:dismissed";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  isComplete: boolean;
  statusText?: string;
  icon: typeof Store;
}

export function OwnerOnboardingWizard() {
  const { data: userSession } = useCurrentUser();
  const { branchId } = useBranch();
  const { data: settings } = useSettings(branchId);
  const { data: floors } = useFloors(branchId);
  const { data: categories } = useCategories(branchId);
  const { data: menuItems } = useMenuItems(branchId);
  const { data: staff } = useStaff();
  const { data: summary } = useDashboardSummary(branchId);

  const [minimized, setMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [activeTourTab, setActiveTourTab] = useState<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedMin = localStorage.getItem(STORAGE_KEY_MINIMIZED);
        if (savedMin === "true") setMinimized(true);
        const savedDismiss = localStorage.getItem(STORAGE_KEY_DISMISSED);
        if (savedDismiss === "true") setDismissed(true);
      } catch {
        // LocalStorage unavailable
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleMinimized = () => {
    const next = !minimized;
    setMinimized(next);
    try {
      localStorage.setItem(STORAGE_KEY_MINIMIZED, String(next));
    } catch {
      // Ignore
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY_DISMISSED, "true");
    } catch {
      // Ignore
    }
  };

  // Only show onboarding wizard for owners and administrators
  const isOwnerOrAdmin =
    userSession?.user?.roleName === "OWNER" ||
    userSession?.user?.roleName === "ADMINISTRATOR" ||
    userSession?.user?.roleName === "General Manager";

  if (!isOwnerOrAdmin || dismissed) {
    return null;
  }

  // Detect completion status
  const hasTables = (floors ?? []).some((f) => f.tables.length > 0);
  const totalTables = (floors ?? []).reduce((acc, f) => acc + f.tables.length, 0);

  const hasMenu = (categories ?? []).length > 0 && (menuItems ?? []).length > 0;
  const totalMenuItems = menuItems?.length ?? 0;
  const totalCategories = categories?.length ?? 0;

  const hasTeam = (staff ?? []).length > 1; // More than just the initial owner account
  const totalStaff = staff?.length ?? 1;

  const hasSales = (summary?.todayOrders ?? 0) > 0 || (summary?.todayRevenue ?? 0) > 0;

  // Has settings been verified
  const hasSettingsConfigured = Boolean(
    settings?.restaurant?.name &&
    settings?.restaurant?.currency &&
    settings?.branch?.taxRegime
  );

  const steps: OnboardingStep[] = [
    {
      id: "settings",
      title: "1. Business Profile & Regional Taxes",
      description: "Set your restaurant name, currency, address, and local tax regime (GST, VAT, IVA).",
      href: "/settings",
      actionLabel: "Configure Profile",
      isComplete: hasSettingsConfigured,
      statusText: hasSettingsConfigured ? "Profile verified" : "Pending review",
      icon: Store,
    },
    {
      id: "tables",
      title: "2. Dining Floor & Tables",
      description: "Create dining areas, floor sections, and table numbers with seat capacity.",
      href: "/tables",
      actionLabel: "Set Up Tables",
      isComplete: hasTables,
      statusText: hasTables ? `${totalTables} tables active` : "0 tables added",
      icon: LayoutGrid,
    },
    {
      id: "menu",
      title: "3. Categories & Menu Items",
      description: "Add categories (Starters, Mains, Drinks) and dishes with prices and tax rates.",
      href: "/menu",
      actionLabel: "Build Menu",
      isComplete: hasMenu,
      statusText: hasMenu
        ? `${totalMenuItems} items across ${totalCategories} categories`
        : "Menu empty",
      icon: UtensilsCrossed,
    },
    {
      id: "printers",
      title: "4. Receipt & Kitchen Hardware",
      description: "Connect thermal ESC/POS 58mm/80mm receipt printers or configure Windows print spooler.",
      href: "/settings",
      actionLabel: "Printer Diagnostics",
      isComplete: true, // System includes out-of-the-box browser and spooler printing
      statusText: "Ready (ESC/POS & Browser)",
      icon: Printer,
    },
    {
      id: "staff",
      title: "5. Staff & Shift Accounts",
      description: "Invite cashiers, waitstaff, chefs, and assign fast 4-digit terminal PINs.",
      href: "/settings/staff",
      actionLabel: "Manage Staff",
      isComplete: hasTeam,
      statusText: hasTeam ? `${totalStaff} team members` : "Only owner created",
      icon: Users,
    },
    {
      id: "first_order",
      title: "6. Take First Test Order",
      description: "Open the POS terminal, select a table, ring up items, and simulate payment.",
      href: "/pos",
      actionLabel: "Open POS Terminal",
      isComplete: hasSales,
      statusText: hasSales ? "First order completed" : "No orders yet",
      icon: CreditCard,
    },
  ];

  const completedCount = steps.filter((s) => s.isComplete).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const isFullySetup = completedCount === steps.length;

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-200",
        isFullySetup
          ? "border-success/30 bg-success/5 shadow-xs"
          : "border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card shadow-sm"
      )}
    >
      {/* Top Banner Bar */}
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              isFullySetup
                ? "bg-success/15 text-success"
                : "bg-primary/15 text-primary"
            )}
          >
            {isFullySetup ? (
              <Sparkles className="h-6 w-6" />
            ) : (
              <Store className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                {isFullySetup
                  ? "Your restaurant is ready for service!"
                  : `Get ${settings?.restaurant?.name || "your restaurant"} ready for service`}
              </h2>
              <Badge
                variant={isFullySetup ? "default" : "secondary"}
                className={cn(
                  "font-medium tabular-nums",
                  isFullySetup && "bg-success hover:bg-success text-success-foreground"
                )}
              >
                {completedCount} of {steps.length} completed ({progressPercent}%)
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              {isFullySetup
                ? "All primary operational steps are configured. You can start taking live orders now."
                : "Follow this quick-start checklist to configure your tables, menu, staff, and hardware."}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Workflow Guide Tour Dialog */}
          <Dialog open={tourOpen} onOpenChange={setTourOpen}>
            <DialogTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 gap-1.5 text-xs cursor-pointer"
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
              How Daxabit Works
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <UtensilsCrossed className="h-5 w-5 text-primary" />
                  Daxabit Restaurant Workflow Guide
                </DialogTitle>
                <DialogDescription>
                  A complete walkthrough of daily front-of-house, kitchen, and back-office operations.
                </DialogDescription>
              </DialogHeader>

              {/* Step Navigation Tabs */}
              <div className="flex flex-wrap gap-1.5 border-b border-border pb-3 pt-1">
                {[
                  { label: "1. Tables & POS", icon: CreditCard },
                  { label: "2. Kitchen KDS", icon: ChefHat },
                  { label: "3. Billing & Receipts", icon: Receipt },
                  { label: "4. Live Stock", icon: Boxes },
                  { label: "5. Register Close", icon: Store },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = activeTourTab === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveTourTab(idx)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="py-3 text-sm leading-relaxed text-foreground">
                {activeTourTab === 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="font-semibold text-base text-foreground">Step 1: Front of House & Order Creation</h3>
                    <p className="text-muted-foreground">
                      Waiters and cashiers operate the <strong>POS Terminal</strong> (<code className="text-xs bg-secondary px-1 rounded">/pos</code>) or <strong>Tables View</strong> (<code className="text-xs bg-secondary px-1 rounded">/tables</code>).
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                      <li><strong>Table Dine-in:</strong> Select a dining table, choose menu dishes, pick portions (Full/Half) and add custom modifiers (e.g. Spice Level, Extra Cheese).</li>
                      <li><strong>Takeaway & Delivery:</strong> Switch to Takeaway or Delivery mode with address and contact phone without tying up a table.</li>
                      <li><strong>Instant Drafts:</strong> You can switch between tables freely — Daxabit saves open item drafts per table automatically.</li>
                      <li><strong>Send to Kitchen:</strong> Tapping <em>Send to Kitchen</em> immediately pushes the KOT ticket to the kitchen display screen.</li>
                    </ul>
                  </div>
                )}

                {activeTourTab === 1 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="font-semibold text-base text-foreground">Step 2: Kitchen Display System (KDS)</h3>
                    <p className="text-muted-foreground">
                      Kitchen staff view real-time orders on tablet or wall displays at <code className="text-xs bg-secondary px-1 rounded">/kds</code>.
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                      <li><strong>Audio Chime Alert:</strong> When a new KOT arrives, an audible chime sounds to alert the cooking line.</li>
                      <li><strong>Ticket Lifecycle:</strong> Tickets advance cleanly through <em>New → Accepted → Preparing → Ready to Serve</em>.</li>
                      <li><strong>Prep Stations:</strong> Orders can be routed to separate stations (Hot Kitchen, Grill, Bar, Dessert) so each station only sees their assigned items.</li>
                      <li><strong>Timer Tracking:</strong> Tickets track elapsed cook time with color-coded alerts to avoid delayed customer service.</li>
                    </ul>
                  </div>
                )}

                {activeTourTab === 2 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="font-semibold text-base text-foreground">Step 3: Billing, Payments & Thermal Printing</h3>
                    <p className="text-muted-foreground">
                      Settle checks quickly and reliably at the cashier terminal.
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                      <li><strong>Multiple Payment Modes:</strong> Cash (with change calculator), Credit/Debit Card, and dynamic UPI QR codes.</li>
                      <li><strong>Customer Display:</strong> Secondary screen (<code className="text-xs bg-secondary px-1 rounded">/customer-display</code>) mirrors cart totals and shows the exact payment QR.</li>
                      <li><strong>Thermal Printing:</strong> Generates crisp 58mm or 80mm ESC/POS receipts directly through USB thermal printers or the native Windows print spooler.</li>
                      <li><strong>Compliant Invoicing:</strong> Tax breakdowns (CGST/SGST, VAT, or Spanish VERI*FACTU) are calculated automatically.</li>
                    </ul>
                  </div>
                )}

                {activeTourTab === 3 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="font-semibold text-base text-foreground">Step 4: Automated Inventory Deduction</h3>
                    <p className="text-muted-foreground">
                      Control raw food costs and avoid stockouts seamlessly.
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                      <li><strong>Recipe Costing:</strong> Link raw ingredients (flour, oil, meat, cheese) directly to dishes in the Menu manager.</li>
                      <li><strong>Auto-Deduction:</strong> Every confirmed order automatically deducts exact ingredient quantities from current stock.</li>
                      <li><strong>Low Stock Alerts:</strong> Dashboard and Inventory screen warn you when ingredients fall below reorder thresholds.</li>
                    </ul>
                  </div>
                )}

                {activeTourTab === 4 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="font-semibold text-base text-foreground">Step 5: Daily Shift Close & Financial Reconciliation</h3>
                    <p className="text-muted-foreground">
                      End each service shift with total financial accountability.
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                      <li><strong>Till Reconciliation:</strong> Cashiers enter their counted drawer cash at <code className="text-xs bg-secondary px-1 rounded">/accounting</code>. System computes any overage or shortage.</li>
                      <li><strong>Z-Report & Shift Summary:</strong> Print end-of-day register closure slips with net sales, taxes collected, and payment breakdown.</li>
                      <li><strong>Reports & Export:</strong> Export daily, weekly, or monthly sales reports to Excel, PDF, or CSV for your accountant at <code className="text-xs bg-secondary px-1 rounded">/reports</code>.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Tour Footer Actions */}
              <div className="flex items-center justify-between border-t border-border pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeTourTab === 0}
                  onClick={() => setActiveTourTab((prev) => Math.max(0, prev - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Step {activeTourTab + 1} of 5
                </span>
                {activeTourTab < 4 ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setActiveTourTab((prev) => Math.min(4, prev + 1))}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setTourOpen(false)}
                  >
                    Got it, let&apos;s setup!
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMinimized}
            className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
            aria-label={minimized ? "Expand setup guide" : "Minimize setup guide"}
            title={minimized ? "Expand setup guide" : "Minimize setup guide"}
          >
            {minimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>

          {isFullySetup && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss setup guide"
              title="Dismiss setup guide"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-secondary/80">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out",
            isFullySetup ? "bg-success" : "bg-primary"
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist Grid (Collapsible) */}
      {!minimized && (
        <div className="grid grid-cols-1 divide-y divide-border/60 border-t border-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col justify-between p-4.5 transition-colors sm:p-5",
                  step.isComplete
                    ? "bg-card/40 hover:bg-card/70"
                    : "bg-background/40 hover:bg-background/80"
                )}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg",
                          step.isComplete
                            ? "bg-success/15 text-success"
                            : "bg-secondary text-muted-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {step.statusText}
                      </span>
                    </div>

                    {step.isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-4 pt-2">
                  <Link
                    href={step.href}
                    className={cn(
                      buttonVariants({
                        variant: step.isComplete ? "outline" : "default",
                        size: "sm",
                      }),
                      "w-full justify-between h-8.5 text-xs font-semibold rounded-lg"
                    )}
                  >
                    <span>{step.actionLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
