import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to EZWeb Project Control Center.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-[420px]">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
