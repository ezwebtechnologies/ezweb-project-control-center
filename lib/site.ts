export const siteConfig = {
  name: "EZWeb Project Control Center",
  description:
    "Control center for MuleSoft and web projects: planning, delivery, and operations in one place.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000",
  keywords: [
    "MuleSoft",
    "integration",
    "project control",
    "API management",
    "enterprise",
  ],
} as const;
