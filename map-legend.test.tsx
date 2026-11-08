import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { LegendScale, MapLegend, ShadeLegend } from "./map-legend";

const map = vi.hoisted(() => ({ detailsOpen: false, isTouch: false }));
vi.mock("./context", () => ({
  useFeatureMap: () => ({ detailsOpen: map.detailsOpen }),
}));
vi.mock("../../hooks/useIsTouchScreen", () => ({
  useIsTouchScreen: () => map.isTouch,
}));

beforeEach(() => {
  map.detailsOpen = false;
  map.isTouch = false;
});

const scale = (
  <LegendScale
    title="Kind"
    items={[
      { label: "Park", fill: "green" },
      { label: "Lake", fill: "blue" },
    ]}
  />
);

describe("MapLegend", () => {
  it("renders nothing without scales", () => {
    const { container } = render(<MapLegend>{[false, undefined]}</MapLegend>);
    expect(container).toBeEmptyDOMElement();
  });

  it("holds its scales in a labelled region", () => {
    render(<MapLegend>{scale}</MapLegend>);
    const legend = screen.getByRole("region", { name: "Legend" });
    expect(within(legend).getByRole("figure", { name: "Kind" })).toBeVisible();
  });

  it("compacts beside the details sheet on touch screens", () => {
    map.isTouch = true;
    map.detailsOpen = true;
    render(<MapLegend>{scale}</MapLegend>);
    const legend = screen.getByRole("region", { name: "Legend" });
    expect(legend).toHaveAttribute("data-compact");
  });

  it("stays full size beside the details panel with a mouse", () => {
    map.detailsOpen = true;
    render(<MapLegend>{scale}</MapLegend>);
    const legend = screen.getByRole("region", { name: "Legend" });
    expect(legend).not.toHaveAttribute("data-compact");
  });
});

describe("ShadeLegend", () => {
  it("labels each of the shade's classes, lowest first", () => {
    render(
      <ShadeLegend
        title="Organizations"
        shade={{ key: "count", steps: [1, 2, 5, 13] }}
        color="iris"
      />,
    );
    const scale = screen.getByRole("figure", { name: "Organizations" });
    expect(
      within(scale)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["0", "1", "2–4", "5–12", "13+"]);
  });

  it("labels large values compactly by their bounds", () => {
    render(
      <ShadeLegend
        title="Population"
        shade={{ key: "pop", steps: [10_000, 50_000, 250_000] }}
        ranges="compact"
      />,
    );
    const scale = screen.getByRole("figure", { name: "Population" });
    expect(
      within(scale)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["< 10K", "10K–50K", "50K–250K", "250K+"]);
  });

  it("ends with a no data entry, set apart, when the shade has one", () => {
    render(
      <ShadeLegend
        title="Under 18"
        shade={{ key: "n", steps: [10_000, 50_000], noData: true }}
        ranges="compact"
      />,
    );
    const items = within(
      screen.getByRole("figure", { name: "Under 18" }),
    ).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "< 10K",
      "10K–50K",
      "50K+",
      "No data",
    ]);
    expect(items.at(-1)).toHaveAttribute("data-apart");
    expect(items[0]).not.toHaveAttribute("data-apart");
  });

  it("labels the classes with a custom format", () => {
    render(
      <ShadeLegend
        title="Share"
        shade={{ key: "pct", steps: [10] }}
        formatRange={({ min }) => (min == null ? "under 10%" : "10% or more")}
      />,
    );
    expect(screen.getByText("under 10%")).toBeVisible();
    expect(screen.getByText("10% or more")).toBeVisible();
  });
});
