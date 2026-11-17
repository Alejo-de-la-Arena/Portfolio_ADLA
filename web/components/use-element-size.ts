"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

export type Size = { width: number; height: number };

/** Layout size of an element (without transforms), kept up to date with ResizeObserver. Ported from the
    client's site (src/components/primitives/useElementSize.js). Starts at `initial` so the server and
    the first client render agree; the real size arrives before the first paint. */
export function useElementSize(ref: RefObject<HTMLElement | null>, initial: Size): Size {
  const [size, setSize] = useState(initial);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = (width: number, height: number) =>
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    update(element.offsetWidth, element.offsetHeight);
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      if (box) update(box.inlineSize, box.blockSize);
      else update(element.offsetWidth, element.offsetHeight);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
