import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import Feature from "ol/Feature";
import { LegendScale, MapLegend, ShadeLegend } from "./map-legend";
import { FeatureMapContext, type FeatureMapContextValue } from "./context";
import type { Hit } from "./types";

const map = vi.hoisted(() => ({ detailsOpen: false, isTouch: false }));
// The real context, for ShadeLegend, with MapLegend's hook stubbed
vi.mock("./context", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./context")>()),
  useFeatureMap: () => ({ detailsOpen: map.detailsOpen }),
}));
vi.mock("./hooks/useIsTouchScreen", () => ({
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

  describe("emphasizing a feature's class", () => {
    const shade = { key: "pop", steps: [10_000, 50_000], noData: true };
    const hitOn = (layerId: string, pop?: number): Hit => ({
      layerId,
      feature: new Feature({ pop }),
    });
    const inMap = (ui: ReactNode, state: Partial<FeatureMapContextValue>) =>
      render(
        <FeatureMapContext
          value={
            {
              hovered: undefined,
              selected: undefined,
              detailsOpen: false,
              ...state,
            } as FeatureMapContextValue
          }
        >
          {ui}
        </FeatureMapContext>,
      );
    const legend = (
      <ShadeLegend
        title="Population"
        shade={shade}
        ranges="compact"
        layerId="divisions"
      />
    );
    const current = () =>
      within(screen.getByRole("figure", { name: "Population" }))
        .getAllByRole("listitem")
        .filter((item) => item.getAttribute("aria-current") === "true")
        .map((item) => item.textContent);

    it("emphasizes the hovered feature's class", () => {
      inMap(legend, { hovered: hitOn("divisions", 20_000) });
      expect(current()).toEqual(["10K–50K"]);
    });

    it("emphasizes the selected feature's class while its details are open", () => {
      inMap(legend, {
        selected: hitOn("divisions", 300_000),
        detailsOpen: true,
      });
      expect(current()).toEqual(["50K+"]);
    });

    it("prefers the hovered feature to the selected one", () => {
      inMap(legend, {
        hovered: hitOn("divisions", 5),
        selected: hitOn("divisions", 300_000),
        detailsOpen: true,
      });
      expect(current()).toEqual(["< 10K"]);
    });

    it("emphasizes no data for a feature without a value", () => {
      inMap(legend, { hovered: hitOn("divisions") });
      expect(current()).toEqual(["No data"]);
    });

    it("ignores other layers' features and closed details", () => {
      inMap(legend, {
        hovered: hitOn("county", 20_000),
        selected: hitOn("divisions", 20_000),
        detailsOpen: false,
      });
      expect(current()).toEqual([]);
    });

    it("emphasizes nothing without a layerId", () => {
      inMap(
        <ShadeLegend title="Population" shade={shade} ranges="compact" />,
        { hovered: hitOn("divisions", 20_000) },
      );
      expect(current()).toEqual([]);
    });
  });
});
