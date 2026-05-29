"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  changePasswordVoluntary,
  type PasswordActionState,
} from "@/app/actions/password";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

export function ProfileChangePasswordForm() {
  const [state, formAction, pending] = useActionState<
    PasswordActionState,
    FormData
  >(changePasswordVoluntary, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          autoComplete="current-password"
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-newPassword">New password</Label>
        <PasswordInput
          id="profile-newPassword"
          name="newPassword"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-confirmPassword">Confirm new password</Label>
        <PasswordInput
          id="profile-confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={pending}
        />
      </div>
      {state?.error ? (
        <p className="text-xs text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="rounded-full">
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Updating…
          </>
        ) : (
          "Update password"
        )}
      </Button>
    </form>
  );
}
