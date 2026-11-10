import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
};

// The element currently shown fullscreen, if any. Portaled content (dialogs)
// must render inside it to be visible.
export const useFullscreenElement = () =>
  useSyncExternalStore(
    subscribe,
    () => document.fullscreenElement,
    () => null,
  );
