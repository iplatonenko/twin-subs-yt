import { useEffect, useRef, useState } from "react";

type Point = { left: number; top: number };
type InitialPlacement = (el: HTMLElement, vw: number, vh: number) => Point;

export function useDraggable(
  ref: React.RefObject<HTMLDivElement | null>,
  initialPlacement?: InitialPlacement
) {
  const [pos, setPos] = useState<Point | null>(null);

  const drag = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
    dragging: false,
  });

  const clampIntoViewport = (el: HTMLElement, left: number, top: number) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = el.getBoundingClientRect();
    const maxLeft = Math.max(0, vw - rect.width);
    const maxTop = Math.max(0, vh - rect.height);
    return {
      left: Math.min(maxLeft, Math.max(0, Math.round(left))),
      top: Math.min(maxTop, Math.max(0, Math.round(top))),
    };
  };

  useEffect(() => {
    const el = ref.current;
    if (!el || pos) return;

    const place = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const rect = el.getBoundingClientRect();
      let next: Point;

      if (initialPlacement) {
        next = initialPlacement(el, vw, vh);
      } else {
        const bottomGap = Math.round(vh * 0.14);
        const left = Math.max(0, Math.round((vw - rect.width) / 2));
        const top = Math.max(0, vh - rect.height - bottomGap);
        next = { left, top };
      }

      next = clampIntoViewport(el, next.left, next.top);
      setPos(next);
    };

    const r = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(r);
      window.removeEventListener("resize", place);
    };
  }, [ref, initialPlacement]);

  const onPointerDown: React.PointerEventHandler<HTMLElement> = (e) => {
    if ((e.pointerType === "mouse" && e.button !== 0) || !ref.current || !pos)
      return;

    const el = ref.current;
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: pos.left,
      startTop: pos.top,
      dragging: true,
    };
    el.setPointerCapture(e.pointerId);
    el.style.userSelect = "none";
    el.style.cursor = "grabbing";
  };

  const onPointerMove: React.PointerEventHandler<HTMLElement> = (e) => {
    const st = drag.current;
    const el = ref.current;
    if (!st.dragging || st.pointerId !== e.pointerId || !el) return;

    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;

    const next = clampIntoViewport(el, st.startLeft + dx, st.startTop + dy);
    setPos(next);
  };

  const onPointerUpOrCancel: React.PointerEventHandler<HTMLElement> = (e) => {
    const st = drag.current;
    if (st.pointerId !== e.pointerId) return;
    drag.current.dragging = false;
    drag.current.pointerId = -1;
    const el = ref.current;
    if (el) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
      el.style.userSelect = "";
      el.style.cursor = "";
    }
  };

  const bind = {
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerUpOrCancel,
    onPointerCancel: onPointerUpOrCancel,
  } as const;

  const style: React.CSSProperties = pos
    ? { position: "fixed", left: pos.left, top: pos.top, visibility: "visible" }
    : { position: "fixed", visibility: "hidden" };

  return { pos, setPos, bind, style };
}
