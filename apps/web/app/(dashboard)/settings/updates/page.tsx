"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, History, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { NavDot } from "@/components/layout/nav-dot";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useApplyUpdate,
  useUpdateCheck,
  useUpdateLogs,
  useUpdateSafety,
} from "@/hooks/use-updates";
import { ApiError } from "@/lib/api";

function pollUntilBackUp(onFailed: () => void) {
  const start = Date.now();
  const timeoutMs = 10 * 60 * 1000;
  let wentDown = false;
  const interval = setInterval(async () => {
    if (Date.now() - start > timeoutMs) {
      clearInterval(interval);
      onFailed();
      toast.error("Still not back after 10 minutes — check the server directly.");
      return;
    }
    try {
      const res = await fetch("/api/v1/system/update/progress", {
        cache: "no-store",
        credentials: "include",
      });
      if (res.ok) {
        const p = (await res.json()) as { state: string; error?: string | null };
        if (p.state === "error") {
          clearInterval(interval);
          onFailed();
          toast.error(`Update failed: ${p.error ?? "unknown error"}. The previous version has been safely preserved.`);
          return;
        }
        if (p.state === "done") {
          clearInterval(interval);
          toast.success("Update finished — reloading.");
          window.location.reload();
          return;
        }
        return;
      }
    } catch {
      // backend restarting
    }
    wentDown = true;
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (res.ok && wentDown) {
        clearInterval(interval);
        toast.success("Update finished — reloading.");
        window.location.reload();
      }
    } catch {
      // still down
    }
  }, 3000);
}

export default function UpdatesPage() {
  const { data, isLoading, refetch, isFetching } = useUpdateCheck();
  const { data: safety, refetch: refetchSafety } = useUpdateSafety();
  const { data: logs } = useUpdateLogs();
  const applyUpdate = useApplyUpdate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [applying, setApplying] = useState(false);

  const handleUpdate = () => {
    setConfirmOpen(false);
    setApplying(true);
    applyUpdate.mutate(
      { force: forceUpdate },
      {
        onSuccess: (result) => {
          toast.info(result.message);
          pollUntilBackUp(() => setApplying(false));
        },
        onError: (err) => {
          setApplying(false);
          toast.error(
            err instanceof ApiError ? err.message : "Could not start the update"
          );
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsTabs />

      {/* Safety Banner if active billing in progress */}
      {safety && !safety.safeToUpdate && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex-1 text-sm">
            <span className="font-semibold">Active Restaurant Operations Detected: </span>
            {safety.warning}
          </div>
        </div>
      )}

      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium">Application Updates & Version Management</h2>
            <p className="text-sm text-muted-foreground">
              Production semantic versioning, compatibility checks, and verified upgrades.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              refetchSafety();
            }}
            disabled={isFetching}
          >
            {isFetching ? "Checking…" : "Check for update"}
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : data ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Current Version:</span>
              <Badge variant="outline">v{data.currentVersion}</Badge>

              {data.latestVersion && (
                <>
                  <span className="text-muted-foreground">Latest Available:</span>
                  <Badge variant={data.updateAvailable || data.building ? "secondary" : "outline"}>
                    v{data.latestVersion}
                  </Badge>
                </>
              )}

              {data.minDesktopVersion && (
                <>
                  <span className="text-muted-foreground">Min Desktop Client:</span>
                  <Badge variant="outline">v{data.minDesktopVersion}</Badge>
                </>
              )}

              {data.updateAvailable ? (
                <Badge className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <NavDot className="ml-0 h-2 w-2" label="Update available" />
                  Update available
                </Badge>
              ) : data.building ? (
                <Badge variant="outline">New release building</Badge>
              ) : (
                <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Up to date
                </Badge>
              )}
            </div>

            {/* Release notes summary if available */}
            {data.releaseNotes && data.releaseNotes.length > 0 && (
              <div className="rounded-md border p-3 bg-muted/40">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                  Release Highlights
                </span>
                <ul className="text-sm space-y-1">
                  {data.releaseNotes.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs uppercase py-0 px-1.5">
                        {item.type}
                      </Badge>
                      <span>{item.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.releaseUrl && (
              <a
                href={data.releaseUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary underline underline-offset-3 hover:text-primary/80"
              >
                View full release notes on GitHub →
              </a>
            )}

            {data.updateAvailable && (
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  className="self-start"
                  disabled={applying}
                  onClick={() => setConfirmOpen(true)}
                >
                  {applying ? "Applying Update…" : "Update Now"}
                </Button>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>
                    Zero-data-loss guarantee: An automated database backup snapshot is created and verified before migration.
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Card>

      {/* Update Audit History */}
      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-medium">Update & Deployment History</h2>
        </div>

        {logs && logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase border-b bg-muted/20">
                <tr>
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Upgrade Path</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Pre-Update Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-medium">
                      v{log.fromVersion} → v{log.toVersion}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={
                          log.status === "SUCCESS"
                            ? "outline"
                            : log.status === "ROLLED_BACK"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {log.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground truncate max-w-xs">
                      {log.preUpdateBackupPath ?? "Verified Snapshot"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No previous update records found.</p>
        )}
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update and restart the application?</DialogTitle>
            <DialogDescription>
              This safely upgrades the application binaries and runs verified database schema migrations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/20 p-3 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>An automated database backup will be generated immediately before the update begins.</span>
            </div>

            {safety && !safety.safeToUpdate && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 p-3 text-amber-900 dark:text-amber-200 text-xs space-y-2 border border-amber-200 dark:border-amber-900/50">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>Warning: Active orders are open</span>
                </div>
                <p>{safety.warning}</p>
                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceUpdate}
                    onChange={(e) => setForceUpdate(e.target.checked)}
                    className="rounded border-amber-400"
                  />
                  <span className="font-medium text-amber-950 dark:text-amber-100">
                    Proceed anyway (staff terminals will briefly reconnect upon restart)
                  </span>
                </label>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              onClick={handleUpdate}
              disabled={safety && !safety.safeToUpdate && !forceUpdate}
            >
              Confirm & Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
