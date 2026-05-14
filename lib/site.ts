function requirePublicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is required. Add it to .env.local (see .env.example)."
    );
  }
  return raw.replace(/\/$/, "");
}

export const siteConfig = {
  name: "EZWeb Project Control Center",
  description:
    "Control center for MuleSoft and web projects: planning, delivery, and operations in one place.",
  url: requirePublicSiteUrl(),
  keywords: [
    "MuleSoft",
    "integration",
    "project control",
    "API management",
    "enterprise",
  ],
} as const;
