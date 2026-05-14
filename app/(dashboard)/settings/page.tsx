import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Settings",
  alternates: { canonical: "/settings" },
};

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Workspace configuration, environment, and authentication will live
          here. See the project README for{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">DATABASE_URL</code>{" "}
          and Prisma setup.
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Open sign-in preview
        </Link>{" "}
        (UI scaffold — wire auth when ready).
      </p>
    </div>
  );
}
