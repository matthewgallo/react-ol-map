import { useEffect, useRef, type RefObject } from "react";

// How far (px) a pointer can move between down and up and still count as a
// tap; further than this, it's scrolling the page
const MAX_TAP_MOVEMENT = 10;

// Calls `onClose` on taps elsewhere on the page while `open`: outside
// `element` and `ignoreTapsIn`. Not on scrolls, which should move the page
// under it.
export const useCloseOnTapOutside = (
  open: boolean,
  element: RefObject<HTMLElement | null>,
  ignoreTapsIn: HTMLElement | null | undefined,
  onClose: () => void,
) => {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    let start: { x: number; y: number } | null = null;
    const outside = (target: EventTarget | null) =>
      target instanceof Node &&
      !element.current?.contains(target) &&
      !ignoreTapsIn?.contains(target);
    const onDown = (e: PointerEvent) => {
      start =
        e.isPrimary && outside(e.target)
          ? { x: e.clientX, y: e.clientY }
          : null;
    };
    const onUp = (e: PointerEvent) => {
      if (start && outside(e.target)) {
        const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
        if (moved <= MAX_TAP_MOVEMENT) onCloseRef.current();
      }
      start = null;
    };
    const onCancel = () => (start = null);
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("pointerup", onUp, true);
    document.addEventListener("pointercancel", onCancel, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("pointercancel", onCancel, true);
    };
  }, [open, element, ignoreTapsIn]);
};
