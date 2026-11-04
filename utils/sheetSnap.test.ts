import { describe, expect, it } from "vitest";
import { dragPosition, releaseSnap } from "./sheetSnap";

const heights = { collapsed: 300, expanded: 700 };
const short = { collapsed: 200, expanded: 200 };

describe("dragPosition", () => {
  it("grows the sheet above its collapsed height, up to expanded", () => {
    expect(dragPosition(500, heights)).toEqual({ height: 500, offset: 0 });
    expect(dragPosition(900, heights)).toEqual({ height: 700, offset: 0 });
  });

  it("pushes the sheet down below its collapsed height", () => {
    expect(dragPosition(220, heights)).toEqual({ height: 300, offset: 80 });
  });

  it("doesn't grow a sheet whose content fits", () => {
    expect(dragPosition(400, short)).toEqual({ height: 200, offset: 0 });
  });
});

describe("releaseSnap", () => {
  it("snaps to the nearest height when released still", () => {
    expect(releaseSnap("collapsed", 320, 0, heights)).toBe("collapsed");
    expect(releaseSnap("collapsed", 560, 0, heights)).toBe("expanded");
    expect(releaseSnap("collapsed", 100, 0, heights)).toBe("dismissed");
    expect(releaseSnap("expanded", 400, 0, heights)).toBe("collapsed");
  });

  it("carries a flick further than its distance", () => {
    expect(releaseSnap("collapsed", 340, 1.5, heights)).toBe("expanded");
    expect(releaseSnap("collapsed", 260, -1, heights)).toBe("dismissed");
    expect(releaseSnap("expanded", 660, -1.5, heights)).toBe("collapsed");
  });

  it("moves at most one snap from where the drag started", () => {
    expect(releaseSnap("expanded", 200, -2, heights)).toBe("collapsed");
  });

  it("never expands a sheet whose content fits", () => {
    expect(releaseSnap("collapsed", 200, 3, short)).toBe("collapsed");
    expect(releaseSnap("collapsed", 50, 0, short)).toBe("dismissed");
  });
});
