"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { logout } from "@/app/actions/auth";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { AccessRole } from "@/lib/auth/permissions";

export type AccountUser = {
  name: string;
  email: string;
  role: AccessRole;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function AdminAccountMenu({ user }: { user: AccountUser }) {
  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-start gap-3">
            <BrandLogo size="sm" className="shrink-0" />
            <div className="min-w-0 flex flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">
                {user.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
              <span className="mt-1 inline-flex w-fit items-center rounded-full bg-sidebar-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sidebar-primary">
                {user.role === "ADMIN" ? "Admin" : "Employee"}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem render={<Link href="/profile" />}>
          <User className="size-4" aria-hidden />
          Profile
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <form action={logout}>
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            render={<button type="submit" className="w-full" />}
          >
            <LogOut className="size-4" aria-hidden />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </form>
    </>
  );
}

export function accountInitials(user: AccountUser): string {
  return initials(user.name);
}
