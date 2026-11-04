import { createRef, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Feature from "ol/Feature";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style } from "ol/style";
import {
  FeatureMapContext,
  type FeatureMapContextValue,
  type LayerRegistration,
} from "./context";
import {
  InteractiveLayer,
  type InteractiveLayerProps,
} from "./interactive-layer";
import type { FeatureProps, Hit, VectorBaseLayer } from "./types";

import styles from "./map.module.css";

const hoverStyle = [new Style()];
const makeLayer = () => new VectorLayer({ source: new VectorSource() });
const feature = (name: string) => new Feature({ name });

const renderNames = (features: FeatureProps[]) =>
  features.map((f) => <span key={String(f.name)}>{String(f.name)}</span>);

// Stands in for FeatureMap, which needs a real OpenLayers map to draw. Layers
// register with it as they would with FeatureMap, and tests set the hovered
// and selected features that its hit detection would.
const setup = ({ isTouch = false } = {}) => {
  const ids = new Map<VectorBaseLayer, string>();
  const register = vi.fn((id: string, { layer }: LayerRegistration) => {
    ids.set(layer, id);
    return () => ids.delete(layer);
  });
  const closeDetails = vi.fn();

  const context = (
    state: Partial<FeatureMapContextValue> = {},
  ): FeatureMapContextValue => ({
    map: null,
    isTouch,
    highlightOnHover: !isTouch,
    hovered: undefined,
    selected: undefined,
    detailsOpen: false,
    closeDetails,
    panelRef: createRef(),
    register,
    setStatus: vi.fn(),
    ...state,
  });

  // A feature on `layer`, as hit detection reports it
  const hit = (layer: VectorBaseLayer, name: string): Hit => {
    const layerId = ids.get(layer);
    if (!layerId) throw new Error("Layer isn't registered");
    return { layerId, feature: feature(name) };
  };

  const { rerender, container } = render(
    <FeatureMapContext value={context()} />,
  );
  const show = (layers: ReactNode, state?: Partial<FeatureMapContextValue>) =>
    rerender(
      <FeatureMapContext value={context(state)}>{layers}</FeatureMapContext>,
    );

  return { ids, register, closeDetails, hit, show, container };
};

// Two overlapping datasets, as in the land use map
const parks = makeLayer();
const subdivisions = makeLayer();

const Layer = (props: Omit<InteractiveLayerProps, "hoverStyle">) => (
  <InteractiveLayer hoverStyle={hoverStyle} renderTooltip={renderNames} {...props} />
);

const landUse = (
  subdivisionProps: Partial<InteractiveLayerProps> = {},
) => (
  <>
    <Layer layer={parks} title="Protected lands" color="grass" zIndex={0} />
    <Layer
      layer={subdivisions}
      title="Subdivisions"
      color="blue"
      zIndex={1}
      {...subdivisionProps}
    />
  </>
);

const tooltipOf = (text: string) =>
  screen.getByText(text).closest<HTMLElement>(`.${styles.tooltip}`);

const layerColor = (el: HTMLElement | null) =>
  el?.style.getPropertyValue("--layer-color");

describe("InteractiveLayer with several layers", () => {
  it("registers each layer with the map separately", () => {
    const { ids, register, show } = setup();
    show(landUse());
    expect(register).toHaveBeenCalledTimes(2);
    expect(ids.get(parks)).toBeDefined();
    expect(ids.get(subdivisions)).toBeDefined();
    expect(ids.get(parks)).not.toBe(ids.get(subdivisions));
  });

  it("doesn't register display-only layers, so they can't be hovered", () => {
    const { ids, show } = setup();
    show(landUse({ interactive: false }));
    expect(ids.has(parks)).toBe(true);
    expect(ids.has(subdivisions)).toBe(false);
  });

  it("registers layers without details content as not clickable", () => {
    const { register, show } = setup();
    show(
      <>
        <Layer layer={parks} title="Protected lands" />
        <InteractiveLayer layer={subdivisions} hoverStyle={hoverStyle} />
      </>,
    );
    const hasDetails = new Map(
      register.mock.calls.map(([, r]) => [r.layer, r.hasDetails]),
    );
    expect(hasDetails.get(parks)).toBe(true);
    expect(hasDetails.get(subdivisions)).toBe(false);
  });

  it("unregisters a layer when it's removed", () => {
    const { ids, show } = setup();
    show(landUse());
    show(<Layer layer={parks} title="Protected lands" color="grass" />);
    expect(ids.has(parks)).toBe(true);
    expect(ids.has(subdivisions)).toBe(false);
  });
});

describe("InteractiveLayer tooltip", () => {
  it("shows only the hovered layer's tooltip", () => {
    const { hit, show, container } = setup();
    show(landUse());
    show(landUse(), { hovered: hit(subdivisions, "Sam Hughes") });

    expect(container.querySelectorAll(`.${styles.tooltip}`)).toHaveLength(1);
    expect(screen.getByText("Subdivisions")).toBeInTheDocument();
    expect(screen.queryByText("Protected lands")).not.toBeInTheDocument();
  });

  it("labels the tooltip with its layer's title, swatch and color", () => {
    const { hit, show } = setup();
    show(landUse());
    show(landUse(), { hovered: hit(subdivisions, "Sam Hughes") });

    const tooltip = tooltipOf("Sam Hughes");
    expect(layerColor(tooltip)).toBe("var(--blue-9)");
    const title = screen.getByText("Subdivisions");
    expect(tooltip).toContainElement(title);
    expect(title.querySelector(`.${styles.swatch}`)).toHaveAttribute(
      "aria-hidden",
    );
  });

  it("follows the pointer between layers with each one's title and color", () => {
    const { hit, show } = setup();
    show(landUse());
    show(landUse(), { hovered: hit(subdivisions, "Sam Hughes") });
    show(landUse(), { hovered: hit(parks, "Saguaro National Park") });

    expect(layerColor(tooltipOf("Saguaro National Park"))).toBe(
      "var(--grass-9)",
    );
    expect(screen.getByText("Protected lands")).toBeInTheDocument();
    expect(screen.queryByText("Sam Hughes")).not.toBeInTheDocument();
    expect(screen.queryByText("Subdivisions")).not.toBeInTheDocument();
  });

  it("uses the theme's accent color for layers without one", () => {
    const { hit, show } = setup();
    const layers = <Layer layer={parks} title="Protected lands" />;
    show(layers);
    show(layers, { hovered: hit(parks, "Tumamoc Hill") });
    expect(layerColor(tooltipOf("Tumamoc Hill"))).toBe("var(--accent-9)");
  });

  it("leaves out the header for layers without a title", () => {
    const { hit, show, container } = setup();
    const layers = <Layer layer={parks} color="grass" />;
    show(layers);
    show(layers, { hovered: hit(parks, "Tumamoc Hill") });
    expect(tooltipOf("Tumamoc Hill")).toBeInTheDocument();
    expect(container.querySelector(`.${styles.tooltipTitle}`)).toBeNull();
  });

  it("shows nothing for layers without tooltip content", () => {
    const { hit, show, container } = setup();
    const layers = (
      <InteractiveLayer layer={parks} hoverStyle={hoverStyle} title="Parks" />
    );
    show(layers);
    show(layers, { hovered: hit(parks, "Tumamoc Hill") });
    expect(container.querySelector(`.${styles.tooltip}`)).toBeNull();
  });
});

describe("InteractiveLayer details", () => {
  it("opens a side panel with the selected layer's title and color", () => {
    const { hit, show } = setup();
    show(landUse());
    show(landUse(), {
      selected: hit(subdivisions, "Sam Hughes"),
      detailsOpen: true,
    });

    const panels = screen.getAllByRole("complementary");
    expect(panels).toHaveLength(1);
    const panel = screen.getByRole("complementary", { name: "Subdivisions" });
    expect(layerColor(panel)).toBe("var(--blue-9)");
    expect(panel.querySelector(`.${styles.swatch}`)).toBeInTheDocument();
    expect(panel).toHaveTextContent("Sam Hughes");
  });

  it("opens a dialog with the layer's title and color on touch screens", () => {
    const { hit, show } = setup({ isTouch: true });
    show(landUse());
    show(landUse(), {
      selected: hit(parks, "Saguaro National Park"),
      detailsOpen: true,
    });

    const dialog = screen.getByRole("dialog", { name: "Protected lands" });
    expect(layerColor(dialog)).toBe("var(--grass-9)");
    expect(dialog.querySelector(`.${styles.swatch}`)).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Saguaro National Park");
  });

  it("keeps the panel closed while details are closed", () => {
    const { hit, show } = setup();
    show(landUse());
    show(landUse(), { selected: hit(subdivisions, "Sam Hughes") });
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("closes the details when the selected layer is hidden", () => {
    const { hit, show, closeDetails } = setup();
    show(landUse());
    const selection = {
      selected: hit(subdivisions, "Sam Hughes"),
      detailsOpen: true,
    };
    show(landUse(), selection);
    expect(closeDetails).not.toHaveBeenCalled();

    show(landUse({ visible: false }), selection);
    expect(closeDetails).toHaveBeenCalledOnce();
  });
});
