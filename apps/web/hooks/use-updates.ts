"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ActiveBillingStatus,
  ReleaseNoteItem,
  UpdateLogEntry,
} from "@daxabithms/types";

export interface VersionInfo {
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  building?: boolean;
  releaseUrl: string | null;
  checkedAt: string;
  minDesktopVersion?: string;
  releaseNotes?: ReleaseNoteItem[];
}

export function useUpdateCheck(enabled = true) {
  return useQuery({
    enabled,
    queryKey: ["system", "update-check"],
    queryFn: () => api.get<VersionInfo>("/system/update/check"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSafety() {
  return useQuery({
    queryKey: ["system", "update-safety"],
    queryFn: () => api.get<ActiveBillingStatus>("/system/update/safety"),
    staleTime: 30 * 1000,
  });
}

export function useUpdateLogs() {
  return useQuery({
    queryKey: ["system", "update-logs"],
    queryFn: () => api.get<UpdateLogEntry[]>("/system/update/logs"),
    staleTime: 60 * 1000,
  });
}

export function useApplyUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (options?: { force?: boolean }) =>
      api.post<{
        status: string;
        message: string;
        preUpdateBackupId?: string;
        preUpdateBackupPath?: string;
      }>("/system/update/apply", options ?? {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system", "update-check"] });
      queryClient.invalidateQueries({ queryKey: ["system", "update-logs"] });
      queryClient.invalidateQueries({ queryKey: ["system", "update-safety"] });
    },
  });
}
