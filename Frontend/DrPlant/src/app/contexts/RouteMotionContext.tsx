import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router";

type RouteMotionContextValue = {
  /** Increments only when pathname or search actually changes (not on first mount). */
  generation: number;
};

const RouteMotionContext = createContext<RouteMotionContextValue>({
  generation: 0,
});

export function RouteMotionProvider({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation();
  const pathKey = `${pathname}${search}`;
  const prevKeyRef = useRef(pathKey);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    if (prevKeyRef.current === pathKey) return;
    prevKeyRef.current = pathKey;
    setGeneration((g) => g + 1);
  }, [pathKey]);

  return (
    <RouteMotionContext.Provider value={{ generation }}>
      {children}
    </RouteMotionContext.Provider>
  );
}

export function useRouteMotion() {
  return useContext(RouteMotionContext);
}
