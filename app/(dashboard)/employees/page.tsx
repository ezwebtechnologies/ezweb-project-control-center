import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Employees",
  description: "Team directory — reserved for a future HR integration.",
  alternates: { canonical: "/employees" },
};

export default function EmployeesPage() {
  return (
    <div className="mx-auto max-w-lg space-y-8 py-8">
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-border/50 bg-muted/30 shadow-inner">
          <Users className="size-7 text-muted-foreground" aria-hidden />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Employees</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This module is intentionally empty. The Prisma{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">Employee</code>{" "}
          model and this route are ready for directory, org chart, or HRIS sync.
        </p>
      </div>
      <Card className="border-border/50 bg-card/50 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-base">Future capabilities</CardTitle>
          <CardDescription>Planned extensions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-inside list-disc space-y-1">
            <li>Role-based access mapped to teams</li>
            <li>Manager hierarchy and approval chains</li>
            <li>Integration with IdP / SCIM provisioning</li>
          </ul>
        </CardContent>
      </Card>
      <div className="text-center">
        <Link
          href="/dashboard"
          className={buttonVariants({ variant: "outline", className: "rounded-full" })}
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
