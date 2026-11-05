import { useLayoutEffect } from "react";

// Set on <html> to the open sheet's height, which index.css adds below the
// page so it can scroll everything above the sheet into view
const CLEARANCE_PROPERTY = "--sheet-clearance";
// The sheet whose height it holds, of all maps' sheets
let clearanceOwner: object | null = null;

// Room below the page for an open bottom sheet, tracking its height. A layout
// effect, so it's there before the map scrolls itself above the sheet (in
// FeatureMap's effects).
export const useSheetClearance = (sheet: HTMLElement | null, open: boolean) => {
  useLayoutEffect(() => {
    if (!open || !sheet) return;
    const root = document.documentElement;
    const owner = {};
    clearanceOwner = owner;
    // Room for a new sheet is there at once, even mid-way through easing away
    delete root.dataset.sheetClosing;
    const update = () =>
      root.style.setProperty(CLEARANCE_PROPERTY, `${sheet.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(sheet);
    return () => {
      observer.disconnect();
      // Removed once the update is done, unless another sheet took it over:
      // selecting a feature on another layer swaps one layer's sheet for
      // another's. Removing it in between would clamp the page's scroll,
      // jumping the map out of view as the new sheet measures itself.
      queueMicrotask(() => {
        if (clearanceOwner !== owner) return;
        clearanceOwner = null;
        easeAway(root);
      });
    };
  }, [open, sheet]);
};

// Eases the room to zero (see index.css) before removing it, so a page
// scrolled into it settles back rather than snapping
const easeAway = (root: HTMLElement) => {
  const body = document.body;
  const done = (e?: TransitionEvent) => {
    if (e && e.target !== body) return;
    body.removeEventListener("transitionend", done);
    body.removeEventListener("transitioncancel", done);
    if (clearanceOwner) return;
    delete root.dataset.sheetClosing;
    root.style.removeProperty(CLEARANCE_PROPERTY);
  };
  root.dataset.sheetClosing = "";
  root.style.setProperty(CLEARANCE_PROPERTY, "0px");
  if (parseFloat(getComputedStyle(body).transitionDuration) > 0) {
    body.addEventListener("transitionend", done);
    body.addEventListener("transitioncancel", done);
  } else {
    done();
  }
};
