"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { QueryError } from "@/components/ui/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveTabs } from "@/components/ui/nav-picker";
import { useCategories, useMenuItems, type MenuItem } from "@/hooks/use-menu";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProductGrid({
  branchId,
  onSelect,
}: {
  branchId: string | null;
  onSelect: (item: MenuItem) => void;
}) {
  const { data: categories } = useCategories(branchId);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const { data: items, isLoading, isError, error, refetch, isFetching } = useMenuItems(branchId, activeCategoryId);

  const filtered = items?.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="relative">
        <Input
          id="pos-menu-search"
          placeholder="Search menu items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 pr-14 pl-3"
        />
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded border border-border/60">
          <kbd className="font-semibold">/</kbd>
        </div>
      </div>

      {categories && categories.length > 0 && (
        <ResponsiveTabs
          mobileOnly
          className="lg:hidden"
          label="Category"
          value={activeCategoryId ?? "all"}
          onChange={(id) => setActiveCategoryId(id === "all" ? undefined : id)}
          desktopListClassName="justify-start lg:h-auto lg:flex-wrap"
          items={[{ id: "all", label: "All" }, ...categories.map((c) => ({ id: c.id, label: c.name, hint: `${c._count.items} items` }))]}
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:gap-4">
      {categories && categories.length > 0 && (
        <nav
          aria-label="Category"
          className="hidden w-36 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border pr-2.5 lg:flex xl:w-44"
        >
          {[{ id: undefined as string | undefined, name: "All", count: undefined as number | undefined }, ...categories.map((c) => ({ id: c.id as string | undefined, name: c.name, count: c._count.items as number | undefined }))].map((c) => {
            const active = c.id === activeCategoryId;
            return (
              <button
                key={c.id ?? "all"}
                type="button"
                aria-current={active ? "true" : undefined}
                onClick={() => setActiveCategoryId(c.id)}
                className={cn(
                  "flex min-h-10 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                  active
                    ? "bg-primary font-semibold text-primary-foreground shadow-xs"
                    : "font-medium text-foreground hover:bg-secondary/80",
                )}
              >
                <span className="min-w-0 truncate leading-tight">{c.name}</span>
                {c.count !== undefined && (
                  <span className={cn("shrink-0 text-xs tabular-nums", active ? "opacity-90 font-semibold" : "text-muted-foreground")}>
                    {c.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {isError && !items ? (
        <QueryError error={error} what="the menu" onRetry={() => void refetch()} retrying={isFetching} />
      ) : (
      <div className="grid flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(145px,1fr))] gap-3 overflow-y-auto pb-4">
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        {filtered?.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="group flex min-h-[112px] w-full min-w-0 flex-col justify-between rounded-xl border border-border bg-card p-3 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md active:translate-y-0 active:scale-[0.98] cursor-pointer"
          >
            <div className="flex w-full items-start justify-between gap-1.5">
              <span
                className={cn(
                  "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background",
                  item.isVeg ? "bg-emerald-500" : "bg-rose-500",
                )}
                title={item.isVeg ? "Vegetarian" : "Non-vegetarian"}
              />
              {item.modifierGroups.length > 0 && (
                <span className="rounded bg-secondary/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Custom
                </span>
              )}
            </div>
            <div className="w-full min-w-0 py-1">
              <span className="block text-sm font-semibold leading-snug text-foreground break-words line-clamp-2">
                {item.name}
              </span>
            </div>
            <div className="flex w-full items-baseline justify-between gap-1 pt-1.5 border-t border-border/40">
              <span className="text-sm font-bold tabular-nums text-foreground">
                {formatCurrency(item.price)}
              </span>
              {item.halfPrice != null && (
                <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                  ½ {formatCurrency(item.halfPrice)}
                </span>
              )}
            </div>
          </button>
        ))}
        {filtered?.length === 0 && !isLoading && (
          <div className="col-span-full py-14 text-center flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-foreground">
              {search ? <>No items match &quot;{search}&quot;</> : "No menu items available"}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {search
                ? "Check your spelling or choose another category."
                : "Your menu doesn't have any items configured yet. Add categories and dishes to start selling."}
            </p>
            {!search && (
              <a
                href="/menu"
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
              >
                Configure Menu Items →
              </a>
            )}
          </div>
        )}
      </div>
      )}
      </div>
      </div>
    </div>
  );
}
