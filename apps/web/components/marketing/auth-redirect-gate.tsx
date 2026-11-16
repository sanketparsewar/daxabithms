"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-auth";
import { useSetupStatus } from "@/hooks/use-setup-status";

function isLocalDesktopHost(hostname: string, port: string): boolean {
  return (
    (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") &&
    port === "1995"
  );
}

// The hosted website is product information and downloads only. When the same
// UI is opened by the local desktop shell, route staff to first-run setup or
// sign-in so the restaurant app remains usable without putting account links
// on the public website.
export function AuthRedirectGate() {
  const [isLocalDesktop, setIsLocalDesktop] = useState(false);
  const { data: current, isSuccess, isFetched } = useCurrentUser(isLocalDesktop);
  const setup = useSetupStatus(isLocalDesktop);
  const router = useRouter();

  useEffect(() => {
    setIsLocalDesktop(isLocalDesktopHost(window.location.hostname, window.location.port));
  }, []);

  useEffect(() => {
    if (!isLocalDesktop) return;
    if (isSuccess && current?.user) {
      router.replace("/dashboard");
      return;
    }
    if (isFetched && setup.isSuccess && setup.data) {
      router.replace(setup.data.isSetup ? "/login" : "/signup");
    }
  }, [current, isFetched, isLocalDesktop, isSuccess, router, setup.data, setup.isSuccess]);

  return null;
}
