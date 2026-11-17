// The Code panel's source for a story: the story's own code, trimmed to what
// it renders, as a consumer would write it. Its CSF object (name, parameters,
// args and render) is cut down to the render function's body, the stories'
// StoryMap wrapper (which only adds the toolbar's basemap and language) is
// shown as the package's FeatureMap, and Prettier formats the result.

// `() => <FeatureMap>…</FeatureMap>`, with or without parentheses: just the JSX
const ARROW_TO_JSX = /^\(\)\s*=>\s*(?:\(([\s\S]*)\)|(<[\s\S]*>))$/;

const renderBody = (code: string) => {
  const start = code.indexOf("render:");
  if (start === -1) return code;
  // The render function, without the story object's closing brace
  const render = code
    .slice(start + "render:".length)
    .replace(/,?\s*}\s*$/, "")
    .trim();
  const jsx = render.match(ARROW_TO_JSX);
  return jsx ? (jsx[1] ?? jsx[2]).trim() : render;
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

export const storySource = async (code: string) => {
  const body = renderBody(code).replace(/\bStoryMap\b/g, "FeatureMap");
  try {
    // A lone expression; the trailing semicolon Prettier adds is dropped
    return (await format(body)).trim().replace(/;$/, "");
  } catch {
    return body; // unformatted rather than nothing
  }
};
