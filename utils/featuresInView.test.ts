import { describe, expect, it } from "vitest";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorTileLayer from "ol/layer/VectorTile";
import RenderFeature from "ol/render/Feature";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import { featuresInView } from "./featuresInView";

const extent = [0, 0, 100, 100];
const shown = new Style();

// One piece of a tile feature; a feature crossing tiles has one per tile
const piece = (id: number, x: number) =>
  new RenderFeature("Point", [x, 10], [2], 2, { name: `f${id}` }, id);

describe("featuresInView", () => {
  it("keeps one piece of each tile feature", () => {
    const layer = new VectorTileLayer();
    layer.getFeaturesInExtent = () => [piece(1, 10), piece(2, 20), piece(1, 30)];
    expect(featuresInView(layer, extent, 1).map((f) => f.getId())).toEqual([1, 2]);
  });

  it("returns a GeoJSON layer's features within the extent", () => {
    const inside = new Feature(new Point([50, 50]));
    const outside = new Feature(new Point([500, 500]));
    const layer = new VectorLayer({
      source: new VectorSource({ features: [inside, outside] }),
    });
    expect(featuresInView(layer, extent, 1)).toEqual([inside]);
  });

  it("returns nothing for a hidden layer", () => {
    const layer = new VectorLayer({
      source: new VectorSource({ features: [new Feature(new Point([1, 1]))] }),
      visible: false,
    });
    expect(featuresInView(layer, extent, 1)).toEqual([]);
  });

  it("leaves out features the layer's style doesn't draw", () => {
    const kept = new Feature({ geometry: new Point([50, 50]), keep: true });
    const dropped = new Feature({ geometry: new Point([60, 60]), keep: false });
    const layer = new VectorLayer({
      source: new VectorSource({ features: [kept, dropped] }),
      style: (f) => (f.get("keep") ? shown : undefined),
    });
    expect(featuresInView(layer, extent, 1)).toEqual([kept]);
  });

  it("leaves out tile features the layer's style doesn't draw", () => {
    const layer = new VectorTileLayer({
      style: (f) => (f.getId() === 1 ? shown : undefined),
    });
    layer.getFeaturesInExtent = () => [piece(1, 10), piece(2, 20)];
    expect(featuresInView(layer, extent, 1).map((f) => f.getId())).toEqual([1]);
  });
});
