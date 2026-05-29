import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { StaleSessionClearer } from "@/components/auth/stale-session-clearer";
import { getCurrentUser } from "@/lib/auth/access";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to EZWeb Project Control Center.",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    if (user.mustChangePassword) redirect("/change-password");
    redirect("/dashboard");
  }

  return (
    <div className="w-full max-w-[420px]">
      <StaleSessionClearer />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
