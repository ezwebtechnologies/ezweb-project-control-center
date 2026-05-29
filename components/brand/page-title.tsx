import { BrandLogo, type BrandLogoSize } from "@/components/brand/brand-logo";
import { cn } from "@/lib/utils";

type PageTitleProps = {
  title: string;
  description?: string;
  logoSize?: BrandLogoSize;
  className?: string;
};

export function PageTitle({
  title,
  description,
  logoSize = "sm",
  className,
}: PageTitleProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <BrandLogo size={logoSize} className="mt-0.5 hidden shrink-0 sm:flex" />
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
