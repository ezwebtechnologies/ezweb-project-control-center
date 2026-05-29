"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth/session";
import { loginSchema } from "@/lib/validations";

export type LoginState = { error: string } | null;

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      mustChangePassword: true,
    },
  });

  if (
    !user?.passwordHash ||
    !(await verifyPassword(parsed.data.password, user.passwordHash))
  ) {
    return { error: "Invalid email or password." };
  }

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name?.trim() || user.email,
    mustChangePassword: user.mustChangePassword,
  });
  await setSessionCookie(token);

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  const callback = formData.get("callbackUrl");
  const destination =
    typeof callback === "string" &&
    callback.startsWith("/") &&
    !callback.startsWith("//") &&
    callback !== "/login" &&
    callback !== "/change-password"
      ? callback
      : "/dashboard";

  redirect(destination);
}

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}
