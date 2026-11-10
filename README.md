# @matthewgallo/react-ol-map

Interactive [OpenLayers](https://openlayers.org/) maps for React, styled with [Radix Themes](https://www.radix-ui.com/themes). Built on [react-openlayers](https://www.npmjs.com/package/react-openlayers).

## Install

The package is published to GitHub Packages, which needs a token even for public packages. Point the `@matthewgallo` scope at it in your project's `.npmrc`:

```ini
@matthewgallo:registry=https://npm.pkg.github.com
```

Add a [personal access token (classic)](https://github.com/settings/tokens) with `read:packages` to your user `~/.npmrc`, then install. (In GitHub Actions, `actions/setup-node` with `registry-url: https://npm.pkg.github.com` and `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` does this.)

```bash
echo "//npm.pkg.github.com/:_authToken=<token>" >> ~/.npmrc
yarn add @matthewgallo/react-ol-map ol @radix-ui/themes
```

`react`, `react-dom` (19), `ol` and `@radix-ui/themes` are peer dependencies.

## Setup

Import the styles once, and render maps inside a Radix `Theme`, whose CSS variables color the layers:

```tsx
import "@radix-ui/themes/styles.css";
import "@matthewgallo/react-ol-map/styles.css";
```

`FeatureMap` also takes:

| Prop         | Default             | Purpose                                                                                       |
| ------------ | ------------------- | --------------------------------------------------------------------------------------------- |
| `basemap`    | `cartoBasemap()`    | Tiles beneath the layers. `cartoBasemap(apiKey)` adds a CARTO key; or pass your own `{ url: (dark) => string, attributions, maxZoom }` |
| `appearance` | the page's          | `"light"` or `"dark"` basemap. Unset, it follows a `dark` or `dark-theme` class on `<html>`   |
| `labels`     | English             | Any of the map's text, translated (see `MapLabels`)                                           |
| `locale`     | the browser's       | Formats numbers in legends                                                                    |

### Colors

`color` accepts any Radix Themes color. If you load only some scales' CSS, narrow it so that others are type errors:

```ts
declare module "@matthewgallo/react-ol-map" {
  interface Register {
    color: "blue" | "grass" | "crimson";
  }
}
```

## Usage

A `FeatureMap` is a basemap, and you stack layers on it as children. Use as many layers as you need, of any kind:

- **`AreaLayer`:** shapes (polygons and lines; points draw as dots) filled in a color.
- **`MarkerLayer`:** points drawn as pins. Pins take priority over the shapes beneath them.
- **`InteractiveLayer`:** the building block the other two use. Pass it any OpenLayers vector layer to make a new kind of layer.

Every layer loads its features one of these ways:

- **GeoJSON (`data`, or `url` to fetch it):** loads everything at once. Fine up to a few MB. The map shows a loading state while fetching, and an error if the fetch fails.
- **Vector tiles (`tiles`):** loads only what's in view. Use past roughly 10 MB or tens of thousands of features. Simplifying geometry (e.g. with [mapshaper](https://mapshaper.org/)) can sometimes avoid tiling altogether.

```tsx
// Tiles have no extent to auto-center on, so set center and zoom
<FeatureMap center={[-110.95, 32.25]} zoom={10}>
  <AreaLayer url="/data/geojson/county.json" color="gray" interactive={false} zIndex={0} />
  <AreaLayer
    tiles={{ url: "/data/tiles/protected-lands.pmtiles" }}
    color="grass"
    title="Protected lands"
    renderTooltip={renderLand}
    zIndex={1}
  />
  <AreaLayer
    tiles={{ url: "/data/tiles/subdivisions.pmtiles" }}
    color="blue"
    title="Subdivisions"
    renderTooltip={renderSubdivision}
    zIndex={2}
  />
  <MarkerLayer data={landmarks} title="Landmarks" renderTooltip={renderLandmark} />
  <MarkerLayer
    tiles={{ url: "/data/tiles/libraries.pmtiles" }}
    color="blue"
    title="Libraries"
    renderTooltip={renderLibrary}
  />
</FeatureMap>
```

Every layer takes these props:

| Prop            | Default     | Purpose                                                                                                       |
| --------------- | ----------- | ------------------------------------------------------------------------------------------------------------- |
| `title`         | "Details"   | Heading of the details when one of its features is selected                                                   |
| `renderTooltip` |             | Content shown on hover                                                                                        |
| `renderDialog`  | the tooltip | Content shown on click                                                                                        |
| `color`         | `"accent"`  | A Radix color scale (`"blue"`, `"grass"`, …) that follows light and dark mode                                 |
| `visible`       | `true`      | A hidden layer ignores hover and clicks, and closes its details if selected                                   |
| `interactive`   | `true`      | `false` makes the layer display-only. Hover and clicks pass through to the layers beneath it                  |
| `zIndex`        | areas `0`, markers `20` | Higher draws on top. Layers with the same value draw in the order they were added, so set it when stacking areas |
| `filter`        |             | `(props) => boolean`: draws only the features it accepts. The rest can't be hovered or clicked. Define it outside render or memoize it |

The map shares hover and selection across all its layers:

- **Hover:** the top-most feature under the pointer, from any layer, is highlighted in its layer's color and shows that layer's `renderTooltip`.
- **Click:** selects a feature, zooms to fit it and shows its layer's `renderDialog`, titled by that layer's `title`. With a mouse it opens in a side panel, closed by clicking empty map, the close button or Escape. On touch screens it opens in a bottom sheet.
- **Full screen:** a button in the top-right corner. Pass `fullScreen={false}` to hide it.

## Markers

To change the pin, pass a component as `pin`. It receives the theme `colors` and whether it's `hovered`, and can wrap `DefaultPin`:

```tsx
import { DefaultPin, type PinProps } from "@matthewgallo/react-ol-map";

const RedPin = (props: PinProps) => <DefaultPin {...props} color="#e5484d" />;

const DotPin = ({ hovered, colors }: PinProps) => (
  <svg width="16" height="16" viewBox="0 0 16 16">
    <circle
      cx="8"
      cy="8"
      r="7"
      fill={hovered ? colors.hoverStroke : colors.stroke}
    />
  </svg>
);

<MarkerLayer data={landmarks} pin={DotPin} pinAnchor={[0.5, 0.5]} />;
```

Pins are drawn on a canvas, so the component is rendered to a static image, not mounted:

- It must render an `<svg>` with a `width` and `height`.
- It can't use context, effects or event handlers.
- Define it outside render, or the pin images rebuild on every render.

To outline a hovered pin as the map outlines hovered areas, use `HALO_LIGHT`, `HALO_DARK`, `HALO_WIDTH` and `HALO_EDGE`: a `HALO_WIDTH` line in `HALO_LIGHT`, edged `HALO_EDGE` either side in `HALO_DARK`.

`pinAnchor` is the point of the image placed on the coordinate, and defaults to bottom center (`[0.5, 1]`).

## Clustering

By default every point is drawn. Pass `cluster` to a `MarkerLayer` or `AreaLayer` to draw nearby points as one badge with their count, in the layer's `color`.

```tsx
<MarkerLayer url="/data/points/arizona_libraries.json" color="blue" cluster />
<MarkerLayer data={landmarks} cluster={{ distance: 60, minDistance: 20 }} />
```

Clicking a cluster zooms in until its points separate. Points too close to ever separate open together in the details instead.

Clustering needs every point at once, so it only works with GeoJSON (`data` or `url`), not `tiles`. A clustered layer draws only its points, leaving out any polygons and lines.

## Shading and legends

Pass `shade` to an `AreaLayer` to fill each area more strongly the higher its value, by steps. Put a `MapLegend` inside the map to show the scale, with a `ShadeLegend` for each shaded layer (or a `LegendScale` for your own items):

```tsx
const population = { key: "population", steps: [10_000, 50_000, 250_000] };

<FeatureMap bounds={county}>
  <AreaLayer id="divisions" tiles={{ url: "/data/tiles/divisions.pmtiles" }} color="amber" shade={population} />
  <MapLegend>
    <ShadeLegend title="Population" shade={population} color="amber" ranges="compact" layerId="divisions" />
  </MapLegend>
</FeatureMap>
```

- `emptyLowest`: the lowest class means none, so it's drawn nearly empty.
- `noData`: areas without a value are hatched, and the legend gets a "No data" entry.
- `ranges`: labels classes as counts (`"2–4"`, the default) or compactly by their bounds (`"10K–50K"`); `formatRange` labels them your own way.
- `layerId`: the shaded layer's `id`. The legend then emphasizes the class of the hovered area, or of the selected one while its details are open, and dims the rest, which tells apart shades that look alike. `LegendScale` takes the item to emphasize as `active`.

## Development

```bash
yarn install
yarn test     # also: yarn lint, yarn typecheck, yarn build
```

### Storybook

```bash
yarn storybook   # http://localhost:6006
```

The stories recreate each of [folklorico](https://github.com/matthewgallo/folklorico)'s maps with its own data, grouped by what they show: areas, pins, clustering, and layers drawn within a selected feature of another (with shading and legends). Each story says which folklorico map it is. The toolbar switches the theme and the language of the map's own text.

For the basemap, copy `.env.example` to `.env.local` and add a CARTO API key as `VITE_MAP_KEY`; without one, CARTO draws "API KEY REQUIRED" tiles. `.env.local` is gitignored, but the key is visible in the browser's tile requests to anyone viewing Storybook, so restrict it to your domains in CARTO if you can.

Storybook serves the data from folklorico's `public/data`, so clone folklorico next to this repository (`../folklorico`). Storybook says so if it's missing. The stories import the package's source, so changes show without a build.

## Releasing

Releases are automated with [release-please](https://github.com/googleapis/release-please). Don't edit `version` in `package.json` yourself.

1. Write commits (or squash-merge PR titles) as [Conventional Commits](https://www.conventionalcommits.org/): `fix:` makes a patch release, `feat:` a minor one, and `feat!:` or a `BREAKING CHANGE:` footer a major one. While the version is below 1.0, breaking changes bump the minor version instead.
2. On each push to `main`, the [release workflow](.github/workflows/release.yml) opens or updates a release PR that bumps `package.json` and adds to `CHANGELOG.md`.
3. Merge the release PR when you want to ship. The workflow then tags `vX.Y.Z`, creates a GitHub Release and publishes the package to GitHub Packages.

Commits typed `chore:`, `docs:`, `test:`, `ci:` or `style:` don't start a release on their own.
