// Where to scroll the page so a map shows between the page's fixed header and
// a bottom sheet, apart from the DOM so it can be tested. Positions are
// viewport pixels.

export interface SheetPlacement {
  scroll: number; // how far to scroll the page down (negative: up)
  coveredTop: number; // of the map, left under the header
  coveredBottom: number; // of the map, left under the sheet
}

// A map that fits between the header (ending at `topInset`) and the sheet
// (starting at `sheetTop`) moves only as far as it needs to; a taller one
// lines up under the header, leaving its bottom under the sheet. `minScroll`
// and `maxScroll` are how far the page can scroll up and down.
export const placeAboveSheet = (
  map: { top: number; height: number },
  topInset: number,
  sheetTop: number,
  minScroll: number,
  maxScroll: number,
): SheetPlacement => {
  const target =
    map.height <= sheetTop - topInset
      ? Math.min(Math.max(map.top, topInset), sheetTop - map.height)
      : topInset;
  const scroll = Math.min(Math.max(map.top - target, minScroll), maxScroll);
  const top = map.top - scroll;
  return {
    scroll,
    coveredTop: Math.max(0, topInset - top),
    coveredBottom: Math.max(0, top + map.height - sheetTop),
  };
};

// Bottom edge of the page's fixed and sticky header bars (marked
// data-page-header) once they're stuck at the top
const pageHeaderBottom = () =>
  Math.max(
    0,
    ...Array.from(
      document.querySelectorAll<HTMLElement>("[data-page-header]"),
      (el) => (parseFloat(getComputedStyle(el).top) || 0) + el.offsetHeight,
    ),
  );

// Scrolls the page to show `mapElement` above a bottom sheet `sheetHeight` px
// tall (see placeAboveSheet), and returns what of the map stays covered. In
// full screen the map fills the screen, so it only measures.
export const scrollMapAboveSheet = (
  mapElement: HTMLElement,
  sheetHeight: number,
): SheetPlacement => {
  const fullscreen = !!document.fullscreenElement;
  const { top, height } = mapElement.getBoundingClientRect();
  const viewport = window.innerHeight;
  const page = document.scrollingElement ?? document.documentElement;
  const placement = placeAboveSheet(
    { top, height },
    fullscreen ? 0 : pageHeaderBottom(),
    viewport - sheetHeight,
    fullscreen ? 0 : -page.scrollTop,
    fullscreen ? 0 : page.scrollHeight - viewport - page.scrollTop,
  );
  if (placement.scroll) {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollBy({
      top: placement.scroll,
      behavior: reduceMotion ? "instant" : "smooth",
    });
  }
  return placement;
};
