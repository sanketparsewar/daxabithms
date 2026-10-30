"use client";

import type { TableStatusDto } from "@daxabithms/types";
import { ClipboardList, Merge, Plus, QrCode, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateTableStatus, type RestaurantTable } from "@/hooks/use-tables";
import { cn } from "@/lib/utils";
import { BillTableDialog } from "./bill-table-dialog";
import { ElapsedTimer } from "./elapsed-timer";
import { MergeTableDialog } from "./merge-table-dialog";
import { TableQrDialog } from "./table-qr-dialog";
import { TableShapeIcon } from "./table-shape-icon";

const STATUS_STYLES: Record<TableStatusDto, string> = {
  AVAILABLE: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:border-emerald-500/60 hover:bg-emerald-500/15 shadow-xs",
  OCCUPIED: "bg-rose-500/10 border-rose-500/40 text-rose-400 hover:border-rose-500/60 hover:bg-rose-500/15 shadow-xs",
  RESERVED: "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:border-amber-500/60 hover:bg-amber-500/15 shadow-xs",
  CLEANING: "bg-zinc-500/10 border-zinc-500/30 text-zinc-400",
  OUT_OF_SERVICE: "bg-zinc-800/20 border-zinc-700/30 text-zinc-500 opacity-60",
};

const STATUS_LABEL: Record<TableStatusDto, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  CLEANING: "Cleaning",
  OUT_OF_SERVICE: "Out of service",
};

export function TableTile({
  table,
  allTables,
  branchId,
  style,
}: {
  table: RestaurantTable;
  allTables: RestaurantTable[];
  branchId: string | null;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  const updateStatus = useUpdateTableStatus(branchId);
  const [qrOpen, setQrOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          style={style}
          className={cn(
            "absolute flex flex-col items-center justify-center gap-1 rounded-xl border-2 text-xs font-semibold shadow-xs transition-all hover:scale-[1.04] active:scale-[0.98] cursor-pointer",
            STATUS_STYLES[table.status],
          )}
        >
          <TableShapeIcon shape={table.shape} capacity={table.capacity} className="h-6 w-6 shrink-0" />
          <span className="text-sm font-bold tracking-tight">{table.name ?? `T${table.number}`}</span>
          <span className="flex items-center gap-1 text-[11px] font-medium opacity-85">
            <Users className="h-3 w-3" />
            {table.capacity}
          </span>
          {(table.status === "OCCUPIED" || table.status === "RESERVED") && (
            <ElapsedTimer since={table.statusSince} className="flex items-center gap-1 text-[10px] opacity-75 font-mono" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 p-1.5 shadow-xl rounded-xl border-border/80">
          <div className="flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border/50 mb-1">
            <span>{STATUS_LABEL[table.status]}</span>
            <span className="flex items-center gap-1 opacity-80 font-normal">
              <Users className="h-3 w-3" /> {table.capacity} guests
            </span>
          </div>
          {(Object.keys(STATUS_LABEL) as TableStatusDto[]).map((status) => {
            const isCurrent = status === table.status;
            return (
              <DropdownMenuItem
                key={status}
                disabled={isCurrent}
                onClick={() => updateStatus.mutate({ id: table.id, status })}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-colors",
                  isCurrent && "font-semibold opacity-50 bg-secondary/40",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    status === "AVAILABLE" && "bg-emerald-500",
                    status === "OCCUPIED" && "bg-rose-500",
                    status === "RESERVED" && "bg-amber-500",
                    status === "CLEANING" && "bg-zinc-400",
                    status === "OUT_OF_SERVICE" && "bg-zinc-600",
                  )}
                />
                {STATUS_LABEL[status]}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem onClick={() => setQrOpen(true)} className="flex items-center gap-2 px-2.5 py-1.5 text-xs cursor-pointer rounded-lg">
            <QrCode className="h-4 w-4 text-muted-foreground" />
            View QR code
          </DropdownMenuItem>
          {(table.status === "AVAILABLE" || table.status === "RESERVED") && (
            <DropdownMenuItem onClick={() => router.push(`/pos?tableId=${table.id}`)} className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-primary cursor-pointer rounded-lg">
              <Plus className="h-4 w-4" />
              New order
            </DropdownMenuItem>
          )}
          {table.status === "OCCUPIED" && (
            <>
              <DropdownMenuItem onClick={() => router.push(`/pos?tableId=${table.id}`)} className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-primary cursor-pointer rounded-lg">
                <Plus className="h-4 w-4" />
                Add another round
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBillOpen(true)} className="flex items-center gap-2 px-2.5 py-1.5 text-xs cursor-pointer rounded-lg">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                Bill this table
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMergeOpen(true)} className="flex items-center gap-2 px-2.5 py-1.5 text-xs cursor-pointer rounded-lg">
                <Merge className="h-4 w-4 text-muted-foreground" />
                Merge another table&apos;s bill here
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <TableQrDialog table={table} branchId={branchId} open={qrOpen} onOpenChange={setQrOpen} />
      <MergeTableDialog
        branchId={branchId}
        table={table}
        allTables={allTables}
        open={mergeOpen}
        onOpenChange={setMergeOpen}
      />
      <BillTableDialog branchId={branchId} table={table} open={billOpen} onOpenChange={setBillOpen} />
    </>
  );
}
