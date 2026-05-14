"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="border-border/60 bg-card/70 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription>
            Authentication is scaffolded for a future release (NextAuth,
            credentials, or SSO). UI only for now.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-2">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setMessage(
                "Sign-in will connect to your auth provider once configured."
              );
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="h-11 bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11 bg-background/50"
              />
            </div>
            <Button type="submit" className="h-11 w-full font-medium">
              Continue
            </Button>
          </form>
          {message ? (
            <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-center text-xs text-muted-foreground">
              {message}
            </p>
          ) : null}
          <p className="text-center text-xs text-muted-foreground">
            By continuing you agree to internal workspace policies.
          </p>
          <div className="text-center text-sm text-muted-foreground">
            <Link
              href="/dashboard"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Skip to dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
