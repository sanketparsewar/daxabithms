"use client";

import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ForbiddenScreenProps {
  roleName?: string;
  fallbackHref?: string;
  pathname?: string;
}

export function ForbiddenScreen({
  roleName,
  fallbackHref = "/dashboard",
  pathname,
}: ForbiddenScreenProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="relative mx-auto flex w-full max-w-md flex-col items-center rounded-3xl border border-border/80 bg-card p-8 text-center shadow-xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6 ring-8 ring-destructive/5">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground">Access Restricted</h1>
        
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {roleName ? (
            <>
              Your current account role (<strong className="font-semibold text-foreground">{roleName}</strong>) does not have permission to access <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-foreground font-mono">{pathname || "this module"}</code>.
            </>
          ) : (
            "You do not have permission to access this page."
          )}
        </p>

        <p className="mt-3 text-xs text-muted-foreground">
          If you require access, please contact your restaurant manager or administrator to update your role permissions.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={fallbackHref}
            className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto gap-2")}
          >
            <Home className="h-4 w-4" />
            Go to allowed screen
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto gap-2")}
          >
            <ArrowLeft className="h-4 w-4" />
            Switch account
          </Link>
        </div>
      </div>
    </div>
  );
}
