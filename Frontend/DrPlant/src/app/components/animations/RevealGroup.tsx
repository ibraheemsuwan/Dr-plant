import { Children, type ReactNode } from "react";
import { cn } from "../ui/utils";
import { Reveal, type RevealVariant } from "./Reveal";

type RevealGroupProps = {
  children: ReactNode;
  className?: string;
  /** Delay between each child (ms) */
  staggerMs?: number;
  variant?: RevealVariant;
};

/** Wraps each child in Reveal with incremental delay for staggered scroll-in. */
export function RevealGroup({
  children,
  className,
  staggerMs = 110,
  variant = "pop",
}: RevealGroupProps) {
  const items = Children.toArray(children).filter(Boolean);

  return (
    <div className={cn(className)}>
      {items.map((child, index) => (
        <Reveal
          key={index}
          variant={variant}
          delayMs={index * staggerMs}
          className="h-full min-h-0"
        >
          {child}
        </Reveal>
      ))}
    </div>
  );
}
