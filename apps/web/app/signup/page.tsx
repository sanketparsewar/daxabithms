"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterDto } from "@daxabithms/types";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const register = useRegister();
  const prefersReducedMotion = useReducedMotion();
  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterDto>({ resolver: zodResolver(registerSchema) });

  const onSubmit = (dto: RegisterDto) => {
    register.mutate(dto, {
      onSuccess: () => router.push("/dashboard"),
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "Something went wrong");
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
          <div className="mb-7 flex flex-col items-center gap-2.5 text-center">
            <Link href="/" className="group flex items-center justify-center transition-transform hover:scale-105">
              <Logo size={48} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Set up Daxabit
              </h1>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                Initialize your restaurant instance and admin credentials
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="restaurantName" className="text-xs font-semibold">Restaurant name</Label>
              <Input
                id="restaurantName"
                autoComplete="organization"
                placeholder="e.g. Spice Route Kitchen"
                className="h-10.5 rounded-xl bg-background/70 border-border/70"
                {...field("restaurantName")}
              />
              {errors.restaurantName && (
                <p className="text-xs text-destructive">{errors.restaurantName.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="branchName" className="text-xs font-semibold">First location / branch name</Label>
              <Input
                id="branchName"
                placeholder="Main Branch"
                defaultValue="Main Branch"
                className="h-10.5 rounded-xl bg-background/70 border-border/70"
                {...field("branchName")}
              />
              {errors.branchName && (
                <p className="text-xs text-destructive">{errors.branchName.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ownerName" className="text-xs font-semibold">Your full name</Label>
              <Input
                id="ownerName"
                autoComplete="name"
                placeholder="e.g. Priya Sharma"
                className="h-10.5 rounded-xl bg-background/70 border-border/70"
                {...field("ownerName")}
              />
              {errors.ownerName && (
                <p className="text-xs text-destructive">{errors.ownerName.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">Owner email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@restaurant.com"
                className="h-10.5 rounded-xl bg-background/70 border-border/70"
                {...field("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-xs font-semibold">Master password</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="h-10.5 rounded-xl bg-background/70 border-border/70"
                {...field("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" size="lg" className="mt-3 h-11 w-full text-[15px] font-semibold shadow-md shadow-primary/20" disabled={register.isPending}>
              {register.isPending ? "Creating your establishment…" : "Complete setup & launch"}
            </Button>
          </form>

          <div className="mt-6 border-t border-border/60 pt-4 text-center text-xs text-muted-foreground">
            <span>Already have a configured restaurant? </span>
            <Link href="/login" className="font-semibold text-primary underline underline-offset-4 hover:opacity-85">
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
