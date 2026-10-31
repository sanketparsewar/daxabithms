"use client";

import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { useRealtimeState } from "@/lib/realtime-status";

export function ConnectionStatusBadge() {
  const status = useRealtimeState();

  if (status === "live") {
    return (
      <div
        className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
        title="Connected to DaxabitHMS server (Realtime push active)"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="hidden sm:inline">Online</span>
      </div>
    );
  }

  if (status === "connecting") {
    return (
      <div
        className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
        title="Reconnecting to local server..."
      >
        <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />
        <span className="hidden sm:inline">Reconnecting...</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive dark:bg-destructive/20 dark:text-destructive-foreground"
      title="Disconnected from DaxabitHMS server. Check local Wi-Fi or server status."
    >
      <WifiOff className="h-3.5 w-3.5" />
      <span>Offline</span>
    </div>
  );
}

export function OfflineBanner() {
  const status = useRealtimeState();

  if (status !== "offline") return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive dark:bg-destructive/20 dark:text-destructive">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>
          <strong>Server Disconnected:</strong> Cannot communicate with the local DaxabitHMS server. Please verify this device is connected to the restaurant Wi-Fi.
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
        <RefreshCw className="h-3 w-3 animate-spin text-destructive" />
        <span>Auto-retrying...</span>
      </div>
    </div>
  );
}

