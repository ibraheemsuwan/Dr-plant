import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "./ui/utils";

type PageLabelProps = {
  children: ReactNode;
  icon?: LucideIcon;
  className?: string;
};

/** Pill label at top of pages — sage fill + forest green text (Plant Scan style). */
export function PageLabel({ children, icon: Icon, className }: PageLabelProps) {
  return (
    <span
      className={cn(
        "mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-sm",
        className,
      )}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
      {children}
    </span>
  );
}
