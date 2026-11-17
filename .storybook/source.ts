// The Code panel's source for a story: the story's own code, trimmed to what
// it renders, as a consumer would write it. Its CSF object (name, parameters,
// args and render) is cut down to the render function's body, the stories'
// StoryMap wrapper (which only adds the toolbar's basemap and language) is
// shown as the package's FeatureMap, and Prettier formats the result.

// `() => <FeatureMap>…</FeatureMap>`, with or without parentheses: just the JSX
const ARROW_TO_JSX = /^\(\)\s*=>\s*(?:\(([\s\S]*)\)|(<[\s\S]*>))$/;

// The render function, without the story object's closing brace
const renderFunction = (code: string) => {
  const start = code.indexOf("render:");
  if (start === -1) return undefined;
  return code
    .slice(start + "render:".length)
    .replace(/,?\s*}\s*$/, "")
    .trim();
};

// Just the JSX, when the render function only returns it
const renderJsx = (render: string) => {
  const jsx = render.match(ARROW_TO_JSX);
  return jsx ? (jsx[1] ?? jsx[2]).trim() : undefined;
};

const renderBody = (code: string) => {
  const render = renderFunction(code);
  return render === undefined ? code : (renderJsx(render) ?? render);
};

const format = async (code: string) => {
  const [prettier, babel, estree] = await Promise.all([
    import("prettier/standalone"),
    import("prettier/plugins/babel"),
    import("prettier/plugins/estree"),
  ]);
  return prettier.format(code, {
    parser: "babel",
    plugins: [babel, estree],
    printWidth: 72,
  });
};

const consumerSource = async (body: string) => {
  body = body.replace(/\bStoryMap\b/g, "FeatureMap");
  try {
    // A lone expression; the trailing semicolon Prettier adds is dropped
    return (await format(body)).trim().replace(/;$/, "");
  } catch {
    return body; // unformatted rather than nothing
  }
};

export const storySource = (code: string) => consumerSource(renderBody(code));

// The code shown under a story's map (story-layout.tsx): a complete module a
// consumer could paste, for stories that render plain JSX. Its imports are
// found from what the JSX uses: the package's exports, Radix Themes', and the
// stories' support modules (app code, such as a custom pin). StoryMap becomes
// FeatureMap with the CARTO basemap it adds. Playgrounds, which build their
// map from Controls, and stories rendering their own components get none;
// their Code panel still shows their JSX.

const PACKAGE = "@matthewgallo/react-ol-map";
const RADIX = "@radix-ui/themes";

// Where each name the JSX might use comes from, the package first
const sources = async () => {
  const [pkg, radix] = await Promise.all([
    import("../src"),
    import("@radix-ui/themes"),
  ]);
  const support = import.meta.glob<Record<string, unknown>>(
    "../stories/support/*.{ts,tsx}",
    { eager: true },
  );
  const from = new Map<string, string>();
  for (const [path, module] of Object.entries(support)) {
    const name = path.replace(/^.*\/|\.tsx?$/g, "");
    for (const key of Object.keys(module)) from.set(key, `./${name}`);
  }
  for (const key of Object.keys(radix)) from.set(key, RADIX);
  for (const key of Object.keys(pkg)) from.set(key, PACKAGE);
  return from;
};

// Names used in the code, not as a property (`feature.Type`), a JSX
// attribute (`tiles={…}`) or in a string
const namesIn = (code: string) => {
  const unquoted = code.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""');
  return new Set(
    unquoted.match(/(?<![.\w$])[A-Za-z_$][\w$]*(?![\w$]|=(?![=>]))/g) ?? [],
  );
};

// "Clustered dots (custom spacing)" → ClusteredDotsCustomSpacing
const componentName = (storyName: string) =>
  storyName
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("") || "Map";

export const storySnippet = async (
  code: string | undefined,
  storyName: string,
) => {
  const render = code && renderFunction(code);
  const jsx = render && renderJsx(render);
  if (!jsx) return undefined;

  const usesStoryMap = /<StoryMap\b/.test(jsx);
  const body = jsx
    .replace(/<StoryMap\b/g, "<FeatureMap basemap={basemap}")
    .replace(/<\/StoryMap>/g, "</FeatureMap>");

  const from = await sources();
  const names = namesIn(body);
  if (usesStoryMap) names.add("cartoBasemap");
  // A component that isn't importable is the story's own: no snippet
  const tags = body.match(/<([A-Z][\w$]*)/g)?.map((tag) => tag.slice(1)) ?? [];
  if (tags.some((tag) => !from.has(tag))) return undefined;

  const imports = new Map<string, string[]>();
  for (const name of [...names].sort()) {
    const module = from.get(name);
    if (module) imports.set(module, [...(imports.get(module) ?? []), name]);
  }
  // The package, Radix, then the app's own modules
  const order = (module: string) =>
    module === PACKAGE ? 0 : module === RADIX ? 1 : 2;
  const importLines = [...imports]
    .sort(([a], [b]) => order(a) - order(b))
    .map(([module, list]) => `import { ${list.join(", ")} } from "${module}";`);

  const module = [
    ...importLines,
    "",
    ...(usesStoryMap
      ? [
          "// A CARTO API key, restricted to your domains",
          "const basemap = cartoBasemap(import.meta.env.VITE_MAP_KEY);",
          "",
        ]
      : []),
    `export function ${componentName(storyName)}() {`,
    `  return (${body});`,
    "}",
  ].join("\n");
  try {
    return (await format(module)).trim();
  } catch {
    return module;
  }
};
