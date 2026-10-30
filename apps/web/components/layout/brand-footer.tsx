import { LifeBuoy } from "lucide-react";

export function BrandFooter() {
  return (
    <div className="flex flex-col gap-2 border-t border-sidebar-border px-4 py-3">
      <div className="flex items-center justify-center gap-1.5 rounded-lg border border-sidebar-border px-3 py-1.5 text-xs font-medium text-sidebar-foreground/80">
        <LifeBuoy className="h-3.5 w-3.5" />
        DaxabitHMS Support
      </div>
      <div className="text-left text-xs font-medium leading-tight text-sidebar-foreground/70">
        DaxabitHMS
      </div>
    </div>
  );
}
