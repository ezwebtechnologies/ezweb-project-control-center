import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileChangePasswordForm } from "@/components/auth/profile-change-password-form";
import { getSession } from "@/lib/auth/session";
import { formatSenderPhone, quotationBranding } from "@/lib/quotation-branding";

export const metadata: Metadata = {
  title: "Profile",
  alternates: { canonical: "/profile" },
};

type ProfilePageProps = {
  searchParams: Promise<{ passwordUpdated?: string }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  const params = await searchParams;
  const passwordUpdated = params.passwordUpdated === "1";

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your signed-in account for this workspace.
        </p>
      </div>
      <dl className="divide-y divide-border/50 rounded-2xl border border-border/50 bg-card/40 px-5 py-2 shadow-sm backdrop-blur-md">
        <div className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr]">
          <dt className="text-sm text-muted-foreground">Name</dt>
          <dd className="text-sm font-medium">{user.name}</dd>
        </div>
        <div className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr]">
          <dt className="text-sm text-muted-foreground">Email</dt>
          <dd className="text-sm font-medium">{user.email}</dd>
        </div>
        <div className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr]">
          <dt className="text-sm text-muted-foreground">Company</dt>
          <dd className="text-sm font-medium">{quotationBranding.companyName}</dd>
        </div>
        <div className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr]">
          <dt className="text-sm text-muted-foreground">Contact</dt>
          <dd className="text-sm font-medium">
            {formatSenderPhone(quotationBranding.senderPhone)}
          </dd>
        </div>
      </dl>

      <section className="rounded-2xl border border-border/50 bg-card/40 px-5 py-6 shadow-sm backdrop-blur-md">
        <h2 className="text-lg font-semibold tracking-tight">Password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your sign-in password. Use the show icon to view what you type.
        </p>
        {passwordUpdated ? (
          <p
            className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300"
            role="status"
          >
            Password updated successfully.
          </p>
        ) : null}
        <div className="mt-5">
          <ProfileChangePasswordForm />
        </div>
      </section>
    </div>
  );
}
