import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { getCurrentUser } from "@/lib/auth/access";

export const metadata: Metadata = {
  title: "Set password",
  description: "Set a new password for your EZWeb workspace account.",
  robots: { index: false, follow: false },
};

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.mustChangePassword) redirect("/dashboard");

  return (
    <div className="w-full max-w-[420px]">
      <ChangePasswordForm />
    </div>
  );
}
