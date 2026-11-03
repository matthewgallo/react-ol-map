import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeaturePanel } from "./feature-panel";

// The panel renders inside the focusable map element
const renderInMap = (onClose = vi.fn()) => {
  const result = render(
    <div tabIndex={0} data-testid="map">
      <FeaturePanel title="Landmarks" onClose={onClose}>
        <p>Details</p>
      </FeaturePanel>
    </div>,
  );
  return { ...result, onClose };
};

describe("FeaturePanel", () => {
  it("is labelled by its title", () => {
    renderInMap();
    expect(
      screen.getByRole("complementary", { name: "Landmarks" }),
    ).toBeInTheDocument();
  });

  it("focuses the close button when opened", () => {
    renderInMap();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("closes from the close button and Escape", async () => {
    const user = userEvent.setup();
    const { onClose } = renderInMap();
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("keeps key presses from reaching the map", async () => {
    const user = userEvent.setup();
    const onMapKeyDown = vi.fn();
    renderInMap();
    screen.getByTestId("map").addEventListener("keydown", onMapKeyDown);
    await user.keyboard("{ArrowLeft}");
    expect(onMapKeyDown).not.toHaveBeenCalled();
  });

  it("returns focus to the map when closed", () => {
    const { rerender } = renderInMap();
    rerender(<div tabIndex={0} data-testid="map" />);
    expect(screen.getByTestId("map")).toHaveFocus();
  });
});
