// Snap logic for the details bottom sheet's swipe gesture, apart from the DOM
// so it can be tested. Heights are the sheet's visible height in pixels.

export type SheetSnap = "collapsed" | "expanded";

export interface SheetHeights {
  collapsed: number;
  expanded: number; // never less than collapsed
}

// How far ahead a release's velocity carries the sheet, so a flick snaps
// further than its distance alone would
const PROJECTION_MS = 200;

// Where a drag to `visible` px puts the sheet: grown (up to its expanded
// height) while above its collapsed height, and pushed down off the screen
// while below it
export const dragPosition = (
  visible: number,
  { collapsed, expanded }: SheetHeights,
) => ({
  height: Math.min(Math.max(visible, collapsed), expanded),
  offset: Math.max(0, collapsed - visible),
});

// Where the sheet settles when released at `visible` px, moving at
// `velocity` px/ms (positive while growing). It moves at most one snap from
// where the drag started, so a flick on an expanded sheet collapses it
// rather than closing it.
export const releaseSnap = (
  from: SheetSnap,
  visible: number,
  velocity: number,
  { collapsed, expanded }: SheetHeights,
): SheetSnap | "dismissed" => {
  const projected = visible + velocity * PROJECTION_MS;
  const canExpand = expanded > collapsed;
  const snaps: [SheetSnap | "dismissed", number][] =
    from === "expanded"
      ? [
          ["collapsed", collapsed],
          ["expanded", expanded],
        ]
      : [["dismissed", 0], ["collapsed", collapsed]];
  if (from === "collapsed" && canExpand) snaps.push(["expanded", expanded]);

  let [nearest, nearestHeight] = snaps[0];
  for (const [snap, height] of snaps) {
    if (Math.abs(projected - height) < Math.abs(projected - nearestHeight)) {
      [nearest, nearestHeight] = [snap, height];
    }
  }
  return nearest;
};
