import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouteMotion } from "../../contexts/RouteMotionContext";
import { cn } from "../ui/utils";

/** Strong scroll-in presets (CSS in theme.css — no blur). */
export type RevealVariant =
  | "rise"
  | "pop"
  | "slide"
  | "slide-end"
  | "zoom"
  | "fade";

/** @deprecated aliases — map to strong presets */
export type RevealVariantLegacy = RevealVariant | "lift" | "soft";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  variant?: RevealVariantLegacy;
};

function normalizeVariant(v: RevealVariantLegacy): RevealVariant {
  if (v === "lift") return "rise";
  if (v === "soft") return "zoom";
  return v;
}

function isInViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return rect.top < vh * 0.98 && rect.bottom > 0;
}

/**
 * Scroll-in motion for blocks below the fold.
 * On route change, visible content appears instantly (no enter animation).
 */
export function Reveal({
  children,
  className,
  delayMs = 0,
  variant = "rise",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [instant, setInstant] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const skipObserverRef = useRef(false);
  const preset = normalizeVariant(variant);
  const { generation } = useRouteMotion();
  const seenGenerationRef = useRef(-1);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useLayoutEffect(() => {
    const routeChanged = seenGenerationRef.current !== generation;
    seenGenerationRef.current = generation;

    if (reduceMotion) {
      setVisible(true);
      setInstant(true);
      skipObserverRef.current = true;
      return;
    }

    const el = ref.current;
    if (!el) return;

    if (routeChanged) {
      if (isInViewport(el)) {
        setVisible(true);
        setInstant(true);
        skipObserverRef.current = true;
        return;
      }
      setVisible(false);
      setInstant(false);
      skipObserverRef.current = false;
      return;
    }

    skipObserverRef.current = false;
    setInstant(false);
    setVisible(false);

    if (isInViewport(el)) {
      setVisible(true);
      setInstant(true);
      skipObserverRef.current = true;
    }
  }, [reduceMotion, preset, generation]);

  useEffect(() => {
    if (reduceMotion || skipObserverRef.current) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { root: null, rootMargin: "0px 0px -2% 0px", threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduceMotion, generation]);

  const showInstant = reduceMotion || instant;

  return (
    <div
      ref={ref}
      className={cn(
        "dr-reveal",
        `dr-reveal--${preset}`,
        visible && "dr-reveal--visible",
        showInstant && "dr-reveal--instant",
        className,
      )}
      style={
        showInstant || !visible
          ? undefined
          : { transitionDelay: `${delayMs}ms` }
      }
    >
      {children}
    </div>
  );
}
