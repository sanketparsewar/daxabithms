"use client";

import type { ReservationStatusDto } from "@nodedr-restaurant/types";
import { Check, X, Users } from "lucide-react";
import { useState } from "react";
import { AddReservationDialog } from "@/components/reservations/add-reservation-dialog";
import { ChannelBadge } from "@/components/orders/channel-badges";
import { ReservationManageDialog } from "@/components/reservations/reservation-manage-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/hooks/use-branch";
import { useReservations, useUpdateReservationStatus, type Reservation } from "@/hooks/use-reservations";
import { useFloors } from "@/hooks/use-tables";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<ReservationStatusDto, string> = {
  RESERVED: "bg-secondary text-muted-foreground",
  CONFIRMED: "bg-primary/10 text-primary",
  ARRIVED: "bg-success/10 text-success",
  COMPLETED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-destructive/10 text-destructive",
  NO_SHOW: "bg-destructive/10 text-destructive",
};

const STATUS_FLOW: ReservationStatusDto[] = [
  "RESERVED",
  "CONFIRMED",
  "ARRIVED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

export default function ReservationsPage() {
  const { branchId } = useBranch();
  const { data: reservations, isLoading } = useReservations(branchId);
  const { data: floors } = useFloors(branchId);
  const tables = floors?.flatMap((f) => f.tables) ?? [];
  const updateStatus = useUpdateReservationStatus(branchId);
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [channel, setChannel] = useState<"all" | "ONLINE" | "STAFF">("all");
  const visible = reservations?.filter((r) => channel === "all" || r.channel === channel);

  return (
    <div className="flex flex-col gap-6 min-w-0 max-w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight text-foreground">
            Reservations
          </h1>
          <p className="text-sm text-muted-foreground">Upcoming bookings across all floors</p>
        </div>
        <AddReservationDialog branchId={branchId} tables={tables} />
      </div>

      <ReservationManageDialog
        branchId={branchId}
        reservation={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["ONLINE", "Online"],
            ["STAFF", "Offline / walk-in"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setChannel(key)}
            className={cn(
              "rounded-full border px-3.5 py-1 text-xs transition-colors shrink-0",
              channel === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-secondary",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Card className="flex flex-col divide-y divide-border p-2 min-w-0 max-w-full">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : visible && visible.length > 0 ? (
          visible.map((r) => (
            <div key={r.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 min-w-0 max-w-full">
              <button
                type="button"
                onClick={() => setSelected(r)}
                className="flex flex-col text-left transition hover:opacity-80 min-w-0 flex-1"
                title="Manage booking"
              >
                <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                  <span className="break-words">{r.customerName}</span>
                  <ChannelBadge channel={r.channel} />
                </span>
                <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
                  <Users className="h-3 w-3 shrink-0" />
                  <span>{r.guestCount} guests</span>
                  {r.table && <span className="break-words">· {r.table.name ?? `Table ${r.table.number}`}</span>}
                  {r.phone && <span className="break-all">· {r.phone}</span>}
                </span>
              </button>
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-1.5 sm:pt-0 border-t sm:border-0 border-border/40">
                <span className="text-sm tabular-nums text-muted-foreground">
                  {new Date(r.reservedAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                {r.status === "RESERVED" && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      className="text-success hover:bg-success/10"
                      title="Accept reservation"
                      onClick={() => updateStatus.mutate({ id: r.id, status: "CONFIRMED" })}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      className="text-destructive hover:bg-destructive/10"
                      title="Reject reservation"
                      onClick={() => updateStatus.mutate({ id: r.id, status: "CANCELLED" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      STATUS_STYLES[r.status],
                    )}
                  >
                    {r.status.replace("_", " ")}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {STATUS_FLOW.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        disabled={status === r.status}
                        onClick={() => updateStatus.mutate({ id: r.id, status })}
                      >
                        {status.replace("_", " ")}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-medium text-foreground">No reservations yet</p>
            <p className="text-sm text-muted-foreground">
              Add a booking to hold a table for a guest.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
