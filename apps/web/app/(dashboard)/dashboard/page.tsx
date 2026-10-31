"use client";

import { BranchNotice } from "@/components/layout/branch-notice";
import { ChefHat, ClipboardList, Flame, Globe, ReceiptText, Store, Timer, TrendingUp, Trash2, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { OwnerOnboardingWizard } from "@/components/dashboard/owner-onboarding-wizard";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { OrderDetailDialog } from "@/components/orders/order-detail-dialog";
import { RefundDialog } from "@/components/orders/refund-dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/hooks/use-branch";
import { useManagedOrders } from "@/hooks/use-orders";
import { openEntity } from "@/lib/entity-events";
import { useDashboardSummary, useDashboardTrends } from "@/hooks/use-dashboard";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const ONLINE_ORDER_TYPES = new Set(["QR_ORDER", "KIOSK"]);

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
  accent?: "success" | "warning";
}) {
  return (
    <Card className="group relative flex flex-col justify-between gap-3 p-5 sm:p-6 min-w-0 max-w-full rounded-2xl border border-border/70 bg-card/90 backdrop-blur-sm shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
            accent === "success" && "bg-success/15 text-success",
            accent === "warning" && "bg-warning/15 text-warning",
            !accent && "bg-primary/15 text-primary",
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
      <span className="truncate text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-foreground">
        {value}
      </span>
    </Card>
  );
}

function TableStatusRow({ label, count, dotClass }: { label: string; count: number; dotClass: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", dotClass)} />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className="font-medium tabular-nums text-foreground">{count}</span>
    </div>
  );
}

export default function DashboardPage() {
  const { branchId } = useBranch();
  const { data, isLoading } = useDashboardSummary(branchId);
  const { data: trends, isLoading: trendsLoading } = useDashboardTrends(branchId);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Real-time overview of today&apos;s service</p>
      </div>

      <OrderDetailDialog
        branchId={branchId}
        orderId={viewingOrderId}
        open={!!viewingOrderId}
        onOpenChange={(open) => !open && setViewingOrderId(null)}
      />

      <BranchNotice />

      <PendingOrdersBanner branchId={branchId} />

      <OwnerOnboardingWizard />

      <QuickActions />

      {isLoading || !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Today's Revenue"
            value={formatCurrency(data.todayRevenue)}
            icon={Wallet}
            accent="success"
          />
          <Link href="/orders" className="block rounded-xl transition hover:opacity-90" title="Manage orders">
            <StatCard label="Today's Orders" value={String(data.todayOrders)} icon={ReceiptText} />
          </Link>
          <StatCard
            label="Occupied Tables"
            value={String(data.tables.occupied)}
            icon={ClipboardList}
          />
          <StatCard
            label="Kitchen Queue"
            value={String(
              data.kitchenQueue.new + data.kitchenQueue.accepted + data.kitchenQueue.preparing,
            )}
            icon={Flame}
            accent="warning"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TrendChart
          title="Revenue — last 14 days"
          icon={TrendingUp}
          data={trends?.revenue ?? []}
          valueKey="amount"
          color="var(--success)"
          valueFormatter={(v) => formatCurrency(v)}
          isLoading={trendsLoading}
          emptyMessage="No paid orders in the last 14 days yet."
        />
        <TrendChart
          title="Food waste cost — last 14 days"
          icon={Trash2}
          data={trends?.waste ?? []}
          valueKey="cost"
          color="var(--warning)"
          valueFormatter={(v) => formatCurrency(v)}
          isLoading={trendsLoading}
          emptyMessage="No waste logged in the last 14 days — nice."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="flex flex-col gap-1 p-6 lg:col-span-1">
          <h2 className="mb-3 text-[18px] font-medium text-foreground">Tables</h2>
          {data ? (
            <>
              <TableStatusRow label="Available" count={data.tables.available} dotClass="bg-success" />
              <TableStatusRow label="Occupied" count={data.tables.occupied} dotClass="bg-primary" />
              <TableStatusRow label="Reserved" count={data.tables.reserved} dotClass="bg-warning" />
              <TableStatusRow label="Cleaning" count={data.tables.cleaning} dotClass="bg-muted-foreground" />
            </>
          ) : (
            <div className="flex flex-col gap-2 py-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full rounded" />
              ))}
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-1 p-6 lg:col-span-1">
          <h2 className="mb-3 flex items-center gap-2 text-[18px] font-medium text-foreground">
            <ChefHat className="h-[18px] w-[18px] text-muted-foreground" />
            Kitchen queue
          </h2>
          {data ? (
            <>
              <TableStatusRow label="New" count={data.kitchenQueue.new} dotClass="bg-primary" />
              <TableStatusRow label="Accepted" count={data.kitchenQueue.accepted} dotClass="bg-warning" />
              <TableStatusRow label="Preparing" count={data.kitchenQueue.preparing} dotClass="bg-warning" />
              <TableStatusRow label="Ready" count={data.kitchenQueue.ready} dotClass="bg-success" />
            </>
          ) : (
            <div className="flex flex-col gap-2 py-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full rounded" />
              ))}
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-3 p-6 lg:col-span-1">
          <h2 className="flex items-center gap-2 text-[18px] font-medium text-foreground">
            <Timer className="h-[18px] w-[18px] text-muted-foreground" />
            Recent transactions
          </h2>
          <div className="flex flex-col divide-y divide-border">
            {isLoading || !data ? (
              <div className="flex flex-col gap-2 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded" />
                ))}
              </div>
            ) : data.recentOrders.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <ReceiptText className="h-6 w-6 text-muted-foreground/40" />
                <span>No sales yet today. Completed orders will appear here.</span>
                <Link href="/pos" className="text-xs font-semibold text-primary hover:underline">
                  Open POS Terminal →
                </Link>
              </div>
            ) : (
              data.recentOrders.map((order) => {
                const isOnline = ONLINE_ORDER_TYPES.has(order.type);
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-2.5 text-left text-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setViewingOrderId(order.id)}
                      className="flex flex-col text-left transition hover:opacity-80 focus:outline-none"
                      title="View order details"
                    >
                      <span className="font-medium text-foreground">#{order.orderNumber}</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "mt-0.5 w-fit text-[11px] font-normal",
                        isOnline && "bg-primary/10 text-primary",
                      )}
                    >
                      {order.type.replace("_", " ")}
                    </Badge>
                  </button>
                  <div className="flex items-center gap-1">
                    <span className="font-medium tabular-nums text-foreground">
                      {formatCurrency(order.totalAmount)}
                    </span>
                    <RefundDialog
                      branchId={branchId}
                      orderId={order.id}
                      orderNumber={order.orderNumber}
                      maxAmount={Number(order.totalAmount)}
                    />
                  </div>
                </div>
              );
            }))}
          </div>
        </Card>

        <Card className="flex flex-col gap-3 p-6 lg:col-span-1">
          <h2 className="flex items-center gap-2 text-[18px] font-medium text-foreground">
            <ReceiptText className="h-[18px] w-[18px] text-muted-foreground" />
            Order channels
          </h2>
          <p className="text-xs text-muted-foreground">Today, self-serve vs staff-entered</p>
          {data && (
            <>
              <div className="flex items-center justify-between py-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  Online (QR / kiosk)
                </div>
                <span className="font-medium tabular-nums text-foreground">
                  {data.channels.online}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Store className="h-3.5 w-3.5" />
                  Offline (dine-in / takeaway / phone)
                </div>
                <span className="font-medium tabular-nums text-foreground">
                  {data.channels.offline}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${
                      data.channels.online + data.channels.offline === 0
                        ? 0
                        : (data.channels.online / (data.channels.online + data.channels.offline)) * 100
                    }%`,
                  }}
                />
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

// Online orders waiting for a decision — shown on top so they can't be missed.
function PendingOrdersBanner({ branchId }: { branchId: string | null }) {
  const { data } = useManagedOrders(branchId, "pending");
  if (!data || data.length === 0) return null;
  return (
    <Card className="flex flex-col gap-3 border-primary/40 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {data.length} online order{data.length === 1 ? "" : "s"} waiting for you
        </p>
        <p className="text-xs text-muted-foreground">Accept or reject so the kitchen can start.</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => openEntity("Order", data[0].id)}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          Review #{data[0].orderNumber}
        </button>
        <Link href="/orders" className="rounded-lg border border-border px-3 py-1.5 text-sm">
          All orders
        </Link>
      </div>
    </Card>
  );
}
