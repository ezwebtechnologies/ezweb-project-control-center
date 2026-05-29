"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  changePasswordForced,
  type PasswordActionState,
} from "@/app/actions/password";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<
    PasswordActionState,
    FormData
  >(changePasswordForced, null);

  return (
    <Card className="border-border/60 bg-card/70 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Set your password
        </CardTitle>
        <CardDescription>
          You signed in with a temporary password. Choose a new password to
          continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-2">
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={pending}
              className="h-11 bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={pending}
              className="h-11 bg-background/50"
            />
          </div>
          {state?.error ? (
            <p
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-xs text-destructive"
              role="alert"
            >
              {state.error}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={pending}
            className="h-11 w-full font-medium"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save and continue"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
