"use client";

import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CartLine } from "@/components/pos/cart-line";
import type { RestaurantTable } from "@/hooks/use-tables";
import { formatCurrency } from "@/lib/format";
import { subtotalOf } from "@/lib/pricing-preview";

export type PosOrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";
export interface DeliveryDetails {
  address: string;
  pincode: string;
  phone: string;
}

export function CartPanel({
  lines,
  orderType,
  onOrderTypeChange,
  tables,
  tableId,
  onTableChange,
  onIncrement,
  onDecrement,
  onRemove,
  onSubmit,
  isSubmitting,
  existingOrderNumber,
  onViewExistingOrder,
  openBills,
  selectedBillId,
  onSelectBill,
  checkingTable = false,
  delivery,
  onDeliveryChange,
  scheduledFor,
  onScheduledForChange,
}: {
  lines: CartLine[];
  orderType: PosOrderType;
  onOrderTypeChange: (type: PosOrderType) => void;
  tables: RestaurantTable[];
  tableId: string;
  onTableChange: (id: string) => void;
  onIncrement: (key: string) => void;
  onDecrement: (key: string) => void;
  onRemove: (key: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  existingOrderNumber?: string;
  onViewExistingOrder?: () => void;
  /** All unpaid bills on the selected table (more than one is possible). */
  openBills?: { id: string; orderNumber: string }[];
  selectedBillId?: string | null;
  onSelectBill?: (id: string) => void;
  /** The table's open bills are still loading - sending now could start a duplicate bill. */
  checkingTable?: boolean;
  delivery: DeliveryDetails;
  onDeliveryChange: (d: DeliveryDetails) => void;
  scheduledFor: string;
  onScheduledForChange: (v: string) => void;
}) {
  const subtotal = subtotalOf(lines.map((l) => l.unitPrice * l.quantity));
  const deliveryReady =
    orderType !== "DELIVERY" ||
    (delivery.address.trim().length >= 5 && delivery.pincode.trim().length >= 3 && delivery.phone.trim().length >= 6);
  const canSubmit =
    lines.length > 0 && (orderType !== "DINE_IN" || !!tableId) && deliveryReady && !isSubmitting && !checkingTable;

  return (
    <div className="flex h-full flex-col gap-4">
      <Tabs value={orderType} onValueChange={(v) => onOrderTypeChange(v as PosOrderType)}>
        <TabsList className="w-full h-10 p-1 bg-secondary/80 rounded-xl">
          <TabsTrigger value="DINE_IN" className="flex-1 text-xs font-semibold rounded-lg">
            Dine-in
          </TabsTrigger>
          <TabsTrigger value="TAKEAWAY" className="flex-1 text-xs font-semibold rounded-lg">
            Takeaway
          </TabsTrigger>
          <TabsTrigger value="DELIVERY" className="flex-1 text-xs font-semibold rounded-lg">
            Delivery
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {orderType === "DINE_IN" && (
        <Select value={tableId} onValueChange={(v) => onTableChange(v ?? "")}>
          <SelectTrigger className="w-full h-10 rounded-xl text-sm font-medium">
            <SelectValue placeholder="Select table">
              {(value: string | null) => {
                const t = tables.find((table) => table.id === value);
                if (!t) return "Select table";
                return `${t.name ?? `Table ${t.number}`}${t.status === "OCCUPIED" ? " (occupied)" : ""}`;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {tables.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name ?? `Table ${t.number}`} {t.status === "OCCUPIED" ? "(occupied)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {orderType === "DELIVERY" && (
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Delivery address"
            value={delivery.address}
            onChange={(e) => onDeliveryChange({ ...delivery, address: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Pincode"
              inputMode="numeric"
              value={delivery.pincode}
              onChange={(e) => onDeliveryChange({ ...delivery, pincode: e.target.value })}
            />
            <Input
              placeholder="Phone"
              inputMode="tel"
              value={delivery.phone}
              onChange={(e) => onDeliveryChange({ ...delivery, phone: e.target.value })}
            />
          </div>
        </div>
      )}

      {orderType !== "DINE_IN" && (
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Schedule for later (optional)
          <Input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => onScheduledForChange(e.target.value)}
          />
        </label>
      )}

      {checkingTable && (
        <p role="status" className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
          Checking this table&apos;s open bills…
        </p>
      )}
      {openBills && openBills.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground" role="group" aria-label="Open bills on this table">
          <span>{openBills.length} open bills here — add to:</span>
          {openBills.map((b) => (
            <Button
              key={b.id}
              type="button"
              size="sm"
              variant={b.id === selectedBillId ? "default" : "outline"}
              className="h-7 px-2 text-xs"
              aria-pressed={b.id === selectedBillId}
              onClick={() => onSelectBill?.(b.id)}
            >
              #{b.orderNumber}
            </Button>
          ))}
        </div>
      )}
      {existingOrderNumber && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground min-w-0">
          <span className="break-words">
            This table already has open order{" "}
            <span className="font-medium text-foreground">#{existingOrderNumber}</span>
            {lines.length > 0 && " — these items will be added to it as a new round."}
          </span>
          {onViewExistingOrder && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 shrink-0 px-2 text-xs"
              onClick={onViewExistingOrder}
            >
              View & pay
            </Button>
          )}
        </div>
      )}

      <div className="flex-1 min-w-0 overflow-y-auto">
        {lines.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <ShoppingCart className="h-8 w-8 opacity-40" />
            <p className="text-sm">Cart is empty</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border min-w-0">
            {lines.map((line) => (
              <div key={line.key} className="flex items-start justify-between gap-2 py-3 min-w-0">
                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-sm font-medium text-foreground break-words">{line.name}</p>
                  {line.modifierLabel && (
                    <p className="text-xs text-muted-foreground break-words">{line.modifierLabel}</p>
                  )}
                  <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                    {formatCurrency(line.unitPrice * line.quantity)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8.5 w-8.5 shrink-0 touch-manipulation rounded-lg active:scale-95 transition-transform"
                    onClick={() => onDecrement(line.key)}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold tabular-nums">{line.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8.5 w-8.5 shrink-0 touch-manipulation rounded-lg active:scale-95 transition-transform"
                    onClick={() => onIncrement(line.key)}
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8.5 w-8.5 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg active:scale-95 transition-transform"
                    onClick={() => onRemove(line.key)}
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4 min-w-0">
        <div className="flex items-center justify-between text-sm min-w-0">
          <span className="text-muted-foreground truncate">Subtotal (incl. tax)</span>
          <span className="font-bold text-base tabular-nums text-foreground shrink-0 ml-2">
            {formatCurrency(subtotal)}
          </span>
        </div>
        <Button className="h-12 min-w-0 max-w-full truncate px-4 text-sm font-semibold rounded-xl shadow-sm" disabled={!canSubmit} onClick={onSubmit}>
          {isSubmitting
            ? "Sending to kitchen…"
            : existingOrderNumber
              ? "Add to order & send to kitchen"
              : "Send to kitchen"}
        </Button>
      </div>
    </div>
  );
}
