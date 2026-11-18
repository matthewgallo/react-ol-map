import StadiaMaps from "ol/source/StadiaMaps";
import {
  cartoBasemap,
  esriGrayBasemap,
  osmBasemap,
  stadiaBasemap,
  type BasemapOption,
} from "../../src";

// The Basemaps story's options: each basemap, and the code a consumer would
// write for it. Both come from the same values, so the snippet can't drift
// from what the map shows. Defined once, outside render: a new `source`
// function each render would make a new source each time.

const PACKAGE = "@matthewgallo/react-ol-map";

interface BasemapExample {
  basemap: BasemapOption;
  imports: string[];
  // `const basemap = …;`
  definition: string;
}

// A string literal, in single quotes when it holds double quotes (HTML)
const literal = (text: string) =>
  text.includes('"') && !text.includes("'")
    ? `'${text}'`
    : JSON.stringify(text);

// One of the package's presets, such as `osmBasemap()`
const preset = (
  name: string,
  basemap: BasemapOption,
  key?: { arg: string; comment: string },
): BasemapExample => ({
  basemap,
  imports: [`import { FeatureMap, ${name} } from "${PACKAGE}";`],
  definition: [
    ...(key ? [`// ${key.comment}`] : []),
    `const basemap = ${name}(${key?.arg ?? ""});`,
  ].join("\n"),
});

// Other XYZ tiles, the same in light and dark: `{ url, attributions, maxZoom }`
const tiles = (
  url: string,
  attributions: string,
  maxZoom: number,
): BasemapExample => ({
  basemap: { url: () => url, attributions, maxZoom },
  imports: [`import { FeatureMap, type Basemap } from "${PACKAGE}";`],
  definition: [
    "const basemap: Basemap = {",
    `  url: () =>\n    ${literal(url)},`,
    `  attributions:\n    ${literal(attributions)},`,
    `  maxZoom: ${maxZoom},`,
    "};",
  ].join("\n"),
});

// A custom OpenLayers source: Stadia's layers, with a dark one if given
const stadiaSource = (light: string, dark?: string): BasemapExample => ({
  basemap: {
    source: (isDark) => new StadiaMaps({ layer: (isDark && dark) || light }),
  },
  imports: [
    'import StadiaMaps from "ol/source/StadiaMaps";',
    `import { FeatureMap, type SourceBasemap } from "${PACKAGE}";`,
  ],
  definition: [
    "// Outside render: a new function would make a new source each render",
    "const basemap: SourceBasemap = {",
    dark
      ? `  source: (dark) =>\n    new StadiaMaps({ layer: dark ? "${dark}" : "${light}" }),`
      : `  source: () => new StadiaMaps({ layer: "${light}" }),`,
    "};",
  ].join("\n"),
});

const OSM =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";
const ESRI_TILES = 'Tiles © <a href="https://www.esri.com">Esri</a>';

// The presets, then other free tiles that need no key (Stadia's only on
// localhost or an allowed domain). Most have one style for light and dark.
export const BASEMAP_EXAMPLES: Record<string, BasemapExample> = {
  "CARTO (cartoBasemap)": preset(
    "cartoBasemap",
    cartoBasemap(import.meta.env.VITE_MAP_KEY),
    {
      arg: "import.meta.env.VITE_MAP_KEY",
      comment: "A CARTO API key, restricted to your domains",
    },
  ),
  "OpenStreetMap (osmBasemap)": preset("osmBasemap", osmBasemap()),
  "Stadia Alidade Smooth (stadiaBasemap)": preset(
    "stadiaBasemap",
    stadiaBasemap(),
  ),
  "Esri Gray Canvas (esriGrayBasemap)": preset(
    "esriGrayBasemap",
    esriGrayBasemap(),
  ),
  "Esri World Imagery": tiles(
    `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`,
    `${ESRI_TILES} — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community`,
    19,
  ),
  "Esri World Topo": tiles(
    `${ESRI}/World_Topo_Map/MapServer/tile/{z}/{y}/{x}`,
    `${ESRI_TILES} — Esri, HERE, Garmin, USGS, ${OSM}`,
    19,
  ),
  // Public domain, United States only
  "USGS Topo": tiles(
    "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}",
    'Tiles courtesy of the <a href="https://www.usgs.gov/">U.S. Geological Survey</a>',
    16,
  ),
  OpenTopoMap: tiles(
    "https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png",
    `${OSM}, SRTM | Style: © <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)`,
    17,
  ),
  "Humanitarian OSM": tiles(
    "https://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    `${OSM}, style by <a href="https://www.hotosm.org/">Humanitarian OpenStreetMap Team</a>, hosted by <a href="https://openstreetmap.fr/">OpenStreetMap France</a>`,
    19,
  ),
  CyclOSM: tiles(
    "https://{a-c}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
    `<a href="https://www.cyclosm.org">CyclOSM</a> | ${OSM}`,
    20,
  ),
  "Stamen Toner (custom source)": stadiaSource(
    "stamen_toner",
    "stamen_toner_dark",
  ),
  "Stamen Terrain (custom source)": stadiaSource("stamen_terrain"),
  "Stamen Watercolor (custom source)": stadiaSource("stamen_watercolor"),
};

// The code for the chosen basemap, as a module a consumer could paste
export const basemapSnippet = ({ basemap }: { basemap: string }) => {
  const example = BASEMAP_EXAMPLES[basemap];
  if (!example) return undefined;
  return [
    ...example.imports,
    "",
    example.definition,
    "",
    "export function Basemaps() {",
    "  return (",
    "    <FeatureMap basemap={basemap} center={[-110.926, 32.2217]} zoom={11}>",
    "      {/* Your layers */}",
    "    </FeatureMap>",
    "  );",
    "}",
  ].join("\n");
};
