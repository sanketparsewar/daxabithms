"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Public, unauthenticated — whether the local desktop instance has completed
// first-run setup. The marketing website does not call this endpoint.
export function useSetupStatus(enabled = true) {
  return useQuery({
    queryKey: ["auth", "setup-status"],
    queryFn: () => api.get<{ isSetup: boolean }>("/auth/setup-status"),
    staleTime: 60_000,
    enabled,
  });
}
