"use client";

import { useState } from "react";
import { CheckoutPanel } from "@/components/pos/checkout-panel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useOpenOrdersForTable } from "@/hooks/use-orders";
import type { RestaurantTable } from "@/hooks/use-tables";
import { cn } from "@/lib/utils";

export function BillTableDialog({
  branchId,
  table,
  open,
  onOpenChange,
}: {
  branchId: string | null;
  table: RestaurantTable;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: orders, isLoading } = useOpenOrdersForTable(branchId, open ? table.id : null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const activeOrder = orders?.find((o) => o.id === selectedOrderId) ?? orders?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bill {table.name ?? `Table ${table.number}`}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : !activeOrder ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No open order found for this table.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders && orders.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 pb-2.5">
                <span className="text-xs text-muted-foreground mr-1">{orders.length} active bills:</span>
                {orders.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSelectedOrderId(o.id)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                      activeOrder.id === o.id
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    #{o.orderNumber}
                  </button>
                ))}
              </div>
            )}
            <CheckoutPanel
              order={activeOrder}
              branchId={branchId}
              initialCustomer={activeOrder.customer}
              onDone={() => onOpenChange(false)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
