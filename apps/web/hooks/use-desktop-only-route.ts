"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isDesktopHost()) {
      setAllowed(true);
    } else {
      router.replace("/");
    }
  }, [router]);

  return allowed;
}
