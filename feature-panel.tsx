import {
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type Ref,
} from "react";
import { Box, Flex, Heading, IconButton, ScrollArea } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useTranslation } from "react-i18next";

import type { MapColor } from "./types";
import { layerColorStyle } from "./utils/layerColor";

import styles from "./map.module.css";

interface FeaturePanelProps {
  ref?: Ref<HTMLElement>;
  title?: string;
  color?: MapColor; // of the feature's layer, for the swatch and edge
  onClose: () => void;
  children: ReactNode;
}

// Details panel for a clicked feature (hover-capable pointers). Rendered
// inside the map element so it stays visible in full screen.
export function FeaturePanel({
  ref,
  title,
  color,
  onClose,
  children,
}: FeaturePanelProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  useImperativeHandle(ref, () => panelRef.current as HTMLElement);

  // OpenLayers listens for keyboard pan/zoom on the map element, which holds
  // this panel, so keys pressed in here stop before reaching it. Needs a
  // native listener: React's would run after the map element's.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Escape") onCloseRef.current();
    };
    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, []);

  // Move focus to the close button on open, and back to the map element on
  // close so it isn't lost to the page. A layout effect, so the panel is still
  // in the DOM when its cleanup checks where focus is.
  const closeRef = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const el = panelRef.current;
    const mapEl = el?.parentElement;
    // Panels open from mouse clicks, after which browsers hide the focus ring
    // unless asked to show it
    closeRef.current?.focus({ preventScroll: true, focusVisible: true });
    return () => {
      if (el?.contains(document.activeElement)) {
        mapEl?.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <aside
      ref={panelRef}
      className={styles.panel}
      style={layerColorStyle(color)}
      aria-labelledby={titleId}
    >
      <Flex
        justify="between"
        align="center"
        gap="2"
        p="3"
        className={styles.detailsHeader}
      >
        <Heading as="h3" size="3" id={titleId} className={styles.layerTitle}>
          <span className={styles.swatch} aria-hidden />
          {title ?? t("map.details")}
        </Heading>
        <IconButton
          ref={closeRef}
          variant="ghost"
          color="gray"
          aria-label={t("map.close")}
          onClick={onClose}
        >
          <Cross2Icon />
        </IconButton>
      </Flex>
      <ScrollArea
        type="auto"
        scrollbars="vertical"
        className={styles.panelBody}
      >
        <Box p="3">
          {children}
        </Box>
      </ScrollArea>
    </aside>
  );
}
