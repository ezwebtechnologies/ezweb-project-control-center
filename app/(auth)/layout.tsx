import { BrandLogo } from "@/components/brand/brand-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,oklch(0.55_0.18_270/0.35),transparent)]"
        aria-hidden
      />
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
        <BrandLogo size="lg" showName priority />
        {children}
      </div>
    </div>
  );
}
