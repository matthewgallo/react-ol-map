import { useCallback, useEffect, useRef, type RefObject } from "react";
import {
  dragPosition,
  releaseSnap,
  type SheetHeights,
  type SheetSnap,
} from "../utils/sheetSnap";

// The sheet's max heights, matching .sheet and .sheet[data-expanded] in
// map.module.css
export const COLLAPSED_FRACTION = 0.5; // of the viewport
export const EXPANDED_GAP = 48; // px left above the expanded sheet

// Velocity samples older than this at release mean the finger stopped first
const VELOCITY_WINDOW_MS = 100;

interface SheetDragOptions {
  snap: SheetSnap;
  bodyRef: RefObject<HTMLElement | null>; // the sheet's scrolling content
  onSnap: (snap: SheetSnap) => void;
  onDismiss: () => void;
}

interface Drag {
  mode: "pending" | "drag" | "scroll";
  startX: number;
  startY: number;
  from: SheetSnap;
  start: number; // visible height when the drag began
  heights: SheetHeights;
  visible: number;
  lastY: number;
  lastT: number;
  velocity: number; // px/ms, positive while growing
}

// The sheet's collapsed and expanded heights for its content
const measure = (sheet: HTMLElement, body: HTMLElement | null) => {
  const natural = body
    ? sheet.offsetHeight - body.clientHeight + body.scrollHeight
    : sheet.offsetHeight;
  const vh = window.innerHeight;
  const collapsed = Math.min(natural, vh * COLLAPSED_FRACTION);
  return { collapsed, expanded: Math.max(collapsed, Math.min(natural, vh - EXPANDED_GAP)) };
};

// Swipe gesture for a bottom sheet: up to expand it, down to collapse it,
// and down again to dismiss it. Drags starting in content that can scroll
// that way scroll it instead. Returns a ref for the sheet element.
//
// Moves the sheet with inline styles while dragging (data-dragging turns off
// its transitions), and leaves the snapped state to the caller. On dismiss it
// keeps --sheet-offset, so the close animation starts from where it was let go.
export const useSheetDrag = (options: SheetDragOptions) => {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  return useCallback((sheet: HTMLElement | null) => {
    if (!sheet) return;
    let drag: Drag | null = null;

    const apply = (visible: number, heights: SheetHeights) => {
      const { height, offset } = dragPosition(visible, heights);
      sheet.style.maxBlockSize = `${height}px`;
      sheet.style.setProperty("--sheet-offset", `${offset}px`);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        drag = null;
        return;
      }
      const { clientX, clientY } = e.touches[0];
      drag = {
        mode: "pending",
        startX: clientX,
        startY: clientY,
        from: optionsRef.current.snap,
        start: 0,
        heights: { collapsed: 0, expanded: 0 },
        visible: 0,
        lastY: clientY,
        lastT: e.timeStamp,
        velocity: 0,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!drag || drag.mode === "scroll") return;
      const { clientX, clientY } = e.touches[0];
      const dy = clientY - drag.startY;

      // Decide on the first move, before the browser starts scrolling
      if (drag.mode === "pending") {
        const dx = clientX - drag.startX;
        if (dx === 0 && dy === 0) return;
        const body = optionsRef.current.bodyRef.current;
        const inBody = !!body && body.contains(e.target as Node);
        const scrollsDown = inBody && body.scrollTop > 0;
        const scrollsUp =
          inBody &&
          drag.from === "expanded" &&
          body.scrollTop + body.clientHeight < body.scrollHeight - 1;
        if (
          Math.abs(dx) > Math.abs(dy) ||
          (dy > 0 && scrollsDown) ||
          (dy < 0 && scrollsUp)
        ) {
          drag.mode = "scroll";
          return;
        }
        drag.mode = "drag";
        drag.start = sheet.getBoundingClientRect().height;
        drag.heights = measure(sheet, body);
        sheet.dataset.dragging = "";
      }

      if (e.cancelable) e.preventDefault();
      const dt = e.timeStamp - drag.lastT;
      if (dt > 0) drag.velocity = (drag.lastY - clientY) / dt;
      drag.lastY = clientY;
      drag.lastT = e.timeStamp;
      drag.visible = drag.start - dy;
      apply(drag.visible, drag.heights);
    };

    const onTouchEnd = (e: TouchEvent) => {
      const current = drag;
      drag = null;
      if (current?.mode !== "drag") return;

      const stopped = e.timeStamp - current.lastT > VELOCITY_WINDOW_MS;
      const target =
        e.type === "touchcancel"
          ? current.from
          : releaseSnap(
              current.from,
              current.visible,
              stopped ? 0 : current.velocity,
              current.heights,
            );

      // Hand the sheet back to its stylesheet, which transitions it to the snap
      delete sheet.dataset.dragging;
      sheet.style.removeProperty("max-block-size");
      if (target === "dismissed") {
        optionsRef.current.onDismiss();
      } else {
        sheet.style.removeProperty("--sheet-offset");
        optionsRef.current.onSnap(target);
      }
    };

    sheet.addEventListener("touchstart", onTouchStart, { passive: true });
    sheet.addEventListener("touchmove", onTouchMove, { passive: false });
    sheet.addEventListener("touchend", onTouchEnd);
    sheet.addEventListener("touchcancel", onTouchEnd);
    return () => {
      sheet.removeEventListener("touchstart", onTouchStart);
      sheet.removeEventListener("touchmove", onTouchMove);
      sheet.removeEventListener("touchend", onTouchEnd);
      sheet.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);
};
