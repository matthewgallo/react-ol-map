// Shared timing for view animations (fitting a selection, resetting the view)
// so they all move the same way

export const VIEW_ANIMATION_DURATION = 700;

// Starts quickly, so the map responds right away, then settles slowly
export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
