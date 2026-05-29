import Image from "next/image";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: { px: 24, box: "size-6 rounded-md" },
  sm: { px: 32, box: "size-8 rounded-lg" },
  md: { px: 40, box: "size-10 rounded-xl" },
  lg: { px: 56, box: "size-14 rounded-xl" },
  xl: { px: 80, box: "size-20 rounded-2xl" },
} as const;

export type BrandLogoSize = keyof typeof SIZES;

type BrandLogoProps = {
  size?: BrandLogoSize;
  showName?: boolean;
  tagline?: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
};

export function BrandLogo({
  size = "md",
  showName = false,
  tagline = "Control center",
  priority = false,
  className,
  imageClassName,
}: BrandLogoProps) {
  const s = SIZES[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-background/50 ring-1 ring-border/50",
          s.box
        )}
      >
        <Image
          src={siteConfig.logoSrc}
          alt={siteConfig.name}
          width={s.px}
          height={s.px}
          priority={priority}
          className={cn(s.box, "object-contain", imageClassName)}
        />
      </div>
      {showName ? (
        <div className="min-w-0">
          <span className="block truncate text-sm font-semibold tracking-tight text-foreground">
            {siteConfig.shortName}
          </span>
          {tagline ? (
            <span className="block truncate text-[11px] text-muted-foreground">
              {tagline}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
