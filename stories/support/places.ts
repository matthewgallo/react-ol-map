// Where folklorico's maps are (src/maps/config.ts), and its data, served
// from its public/data by .storybook/main.ts

type Bounds = [west: number, south: number, east: number, north: number];

export const PIMA_COUNTY_BOUNDS: Bounds = [-113.3339, 31.4261, -110.4477, 32.5142];
export const TUCSON_CITY_BOUNDS: Bounds = [-111.0588, 31.9905, -110.7062, 32.3209];
export const CONTIGUOUS_US_BOUNDS: Bounds = [-124.8, 24.4, -66.9, 49.4];
// The affiliated spaces, which are all central, plus a margin
export const AFFILIATED_SPACES_BOUNDS: Bounds = [-111.0, 32.188, -110.941, 32.24];

export const ARIZONA = { center: [-111.7, 34.2] as [number, number], zoom: 6 };
export const TUCSON = { center: [-110.926, 32.2217] as [number, number], zoom: 10 };

// Vector tiles, loaded for what's in view
export const tiles = (name: string) => ({
  tiles: { url: `/data/tiles/${name}.pmtiles` },
});

export const GEOJSON = {
  arizonaBoundary: "/data/geojson/arizona_boundary.json",
  tucsonCityLimits: "/data/geojson/tucson_city_limits.json",
  tucsonLandmarks: "/data/geojson/tucson_landmarks.json",
};

// Point CSVs as GeoJSON, for clustering, which needs every point at once
export const POINTS = {
  arizonaLibraries: "/data/points/arizona_libraries.json",
  arizonaSchools: "/data/points/arizona_schools.json",
  tucsonSchools: "/data/points/tucson_schools_all.json",
  usOrganizations: "/data/points/us_folklorico_organizations.json",
};
