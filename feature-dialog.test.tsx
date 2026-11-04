import { describe, expect, it, vi } from "vitest";
import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { FeatureDialog } from "./feature-dialog";

const renderSheet = (onOpenChange = vi.fn()) => {
  render(
    <FeatureDialog open onOpenChange={onOpenChange} title="Landmarks">
      <p>Details</p>
    </FeatureDialog>,
  );
  const sheet = screen.getByRole("dialog", { name: "Landmarks" });
  // jsdom doesn't lay out: give the sheet a height, with content that fits
  vi.spyOn(sheet, "getBoundingClientRect").mockReturnValue({
    height: 200,
  } as DOMRect);
  vi.spyOn(sheet, "offsetHeight", "get").mockReturnValue(200);
  return { sheet, onOpenChange };
};

// A touch event at `y`, `time` ms in. jsdom ignores a timeStamp passed in
// its init. (react-remove-scroll, under the dialog, reads changedTouches.)
type TouchType = "touchStart" | "touchMove" | "touchEnd";
const touch = (el: Element, type: TouchType, y: number, time: number) => {
  const touches = [{ clientX: 0, clientY: y }];
  const event = createEvent[type](el, {
    touches: type === "touchEnd" ? [] : touches,
    changedTouches: touches,
  });
  Object.defineProperty(event, "timeStamp", { value: time });
  fireEvent(el, event);
};

// A one-finger swipe from y=500 by `dy` over 100ms, released `pause` ms
// after its last move
const swipe = (el: Element, dy: number, pause = 0) => {
  touch(el, "touchStart", 500, 0);
  touch(el, "touchMove", 500 + dy / 2, 50);
  touch(el, "touchMove", 500 + dy, 100);
  touch(el, "touchEnd", 500 + dy, 100 + pause);
};

describe("FeatureDialog", () => {
  it("has a close button only for screen readers", async () => {
    const { onOpenChange } = renderSheet();
    const close = screen.getByRole("button", { name: "Close" });
    // Radix's VisuallyHidden clips it to a pixel with inline styles
    expect(close.parentElement).toHaveStyle({ width: "1px", height: "1px" });
    fireEvent.click(close);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes when swiped down past half its height", () => {
    const { sheet, onOpenChange } = renderSheet();
    swipe(screen.getByText("Details"), 150, 500);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(sheet.dataset.dragging).toBeUndefined();
  });

  it("closes from a quick flick down", () => {
    const { onOpenChange } = renderSheet();
    swipe(screen.getByText("Details"), 60);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("springs back from a short, slow swipe", () => {
    const { sheet, onOpenChange } = renderSheet();
    swipe(sheet, 40, 500);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(sheet.style.getPropertyValue("--sheet-offset")).toBe("");
    expect(sheet.style.maxBlockSize).toBe("");
  });

  it("follows the finger while dragged", () => {
    const { sheet } = renderSheet();
    touch(sheet, "touchStart", 500, 0);
    touch(sheet, "touchMove", 560, 50);
    expect(sheet.style.getPropertyValue("--sheet-offset")).toBe("60px");
    expect(sheet).toHaveAttribute("data-dragging");
  });
});
