import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Set password",
  description: "Set a new password for your EZWeb workspace account.",
  robots: { index: false, follow: false },
};

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.mustChangePassword) redirect("/dashboard");

  return (
    <div className="w-full max-w-[420px]">
      <ChangePasswordForm />
    </div>
  );
}
