import Image from "next/image";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Animated loading mark with company logo (replaces generic EZ placeholder). */
export function BrandLogoMark({ size = "md" }: { size?: "md" | "lg" }) {
  const outer = size === "lg" ? "size-20" : "size-14";
  const inner = size === "lg" ? "size-14" : "size-10";
  const px = size === "lg" ? 56 : 40;

  return (
    <div className={cn("relative grid place-items-center", outer)}>
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-full animate-orbit",
          "bg-[conic-gradient(from_120deg,transparent_0deg,oklch(0.62_0.2_264/0.65)_120deg,transparent_220deg)]",
          "[mask-image:radial-gradient(circle,transparent_55%,black_57%,black_98%,transparent_100%)]",
          "[-webkit-mask-image:radial-gradient(circle,transparent_55%,black_57%,black_98%,transparent_100%)]"
        )}
      />
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-background/80 ring-1 ring-sidebar-border/50 shadow-[inset_0_0_0_1px_oklch(1_0_0/6%)]",
          inner
        )}
      >
        <Image
          src={siteConfig.logoSrc}
          alt={siteConfig.name}
          width={px}
          height={px}
          className={cn(inner, "object-contain")}
        />
      </div>
    </div>
  );
}
