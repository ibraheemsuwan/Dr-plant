import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "../ui/utils";

type RevealVariant = "lift" | "pop";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Delay before transition starts (ms), after element enters view */
  delayMs?: number;
  /** lift = fade + من الأسفل | pop = نبثق مع تكبير خفيف */
  variant?: RevealVariant;
};

/**
 * Fade + motion when the block scrolls into view.
 * Respects prefers-reduced-motion.
 */
export function Reveal({
  children,
  className,
  delayMs = 0,
  variant = "lift",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { root: null, rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduceMotion]);

  const motionHidden =
    variant === "pop"
      ? "opacity-0 translate-y-8 scale-[0.92]"
      : "opacity-0 translate-y-7";
  const motionVisible =
    variant === "pop"
      ? "opacity-100 translate-y-0 scale-100"
      : "opacity-100 translate-y-0";
  const motionTransition =
    variant === "pop"
      ? "motion-safe:transition-[opacity,transform] motion-safe:duration-[780ms] motion-safe:ease-[cubic-bezier(0.34,1.45,0.64,1)]"
      : "motion-safe:transition-[opacity,transform] motion-safe:duration-[950ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]";

  return (
    <div
      ref={ref}
      className={cn(
        "will-change-[opacity,transform]",
        reduceMotion ? "" : visible ? motionVisible : motionHidden,
        !reduceMotion && motionTransition,
        className,
      )}
      style={
        reduceMotion || !visible
          ? undefined
          : { transitionDelay: `${delayMs}ms` }
      }
    >
      {children}
    </div>
  );
}
