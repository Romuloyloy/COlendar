import { useEffect, useRef, useState } from "react";

export function useMeasureWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState<number>(1100);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 1100;
      setWidth(Math.max(320, Math.floor(w)));
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}
