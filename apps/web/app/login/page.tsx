"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginDto } from "@daxabithms/types";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  // Set once the server says this account uses two-factor authentication.
  const [needsCode, setNeedsCode] = useState(false);
  // Shown inline under the form (a toast vanishes before it can be read).
  const [error, setError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (dto: LoginDto) => {
    setError(null);
    login.mutate(dto, {
      onSuccess: () => router.push("/dashboard"),
      onError: (err) => {
        if (err instanceof ApiError && err.message === "TWO_FACTOR_REQUIRED") {
          setNeedsCode(true);
          return;
        }
        if (err instanceof ApiError && err.status >= 500) {
          setError("The server is having a problem right now. Please try again in a minute.");
        } else if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Can't reach the server. Check your internet connection and try again.");
        }
      },
    });
  };

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* High-tech Cyber Grid Background */}
      <div
        aria-hidden
        className="daxabit-grid pointer-events-none absolute inset-x-0 top-0 -z-20 h-full opacity-60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(50%_50%_at_50%_0%,color-mix(in_oklch,var(--primary),transparent_88%),transparent)]"
      />
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="daxabit-glass daxabit-glow rounded-3xl p-7 sm:p-9 shadow-2xl">
          <div className="mb-8 flex flex-col items-center gap-2.5 text-center">
            <Link href="/" className="group flex items-center justify-center transition-transform hover:scale-105">
              <Logo size={48} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Sign in to Daxabit
              </h1>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                Hospitality &amp; Restaurant Operations System
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4.5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                autoFocus
                className="h-11 rounded-xl bg-background/70 border-border/70"
                placeholder="you@restaurant.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                enterKeyHint="go"
                className="h-11 rounded-xl bg-background/70 border-border/70"
                placeholder="••••••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {needsCode && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="totp" className="text-xs font-semibold">Verification code</Label>
                <Input
                  id="totp"
                  inputMode="text"
                  autoComplete="one-time-code"
                  autoFocus
                  className="h-11 rounded-xl bg-background/70 border-border/70 font-mono tracking-widest text-center"
                  placeholder="000 000"
                  {...register("totp")}
                />
                <p className="text-[11px] text-muted-foreground">
                  Open your authenticator app, or use a backup recovery code.
                </p>
                {errors.totp && <p className="text-xs text-destructive">{errors.totp.message}</p>}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" className="mt-2 h-11 w-full text-[15px] font-semibold shadow-md shadow-primary/20" disabled={login.isPending}>
              {login.isPending ? "Authenticating…" : "Sign in to Dashboard"}
            </Button>
          </form>

          <div className="mt-7 border-t border-border/60 pt-5 text-center text-xs text-muted-foreground">
            <span>New restaurant establishment? </span>
            <Link href="/signup" className="font-semibold text-primary underline underline-offset-4 hover:opacity-85">
              Set up account
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
