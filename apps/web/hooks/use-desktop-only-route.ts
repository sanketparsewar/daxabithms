"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

function isDesktopHost(): boolean {
  const { hostname, port } = window.location;
  return (
    port === "1995" &&
    (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]")
  );
}

// Account routes are part of the local desktop app. The public website only
// presents product information and desktop downloads.
export function useDesktopOnlyRoute(): boolean {
  const router = useRouter();
  const allowed = useSyncExternalStore(
    () => () => {},
    isDesktopHost,
    () => false,
  );

  useEffect(() => {
    if (!isDesktopHost()) {
      router.replace("/");
    }
  }, [router]);

  return allowed;
}
