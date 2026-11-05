import { useCallback, useRef, useState, type ReactNode, type Ref } from "react";
import { Dialog } from "radix-ui";
import {
  Dialog as ThemedDialog,
  Theme,
  VisuallyHidden,
} from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { useFullscreenElement } from "../../hooks/useFullscreenElement";

import { useSheetDrag } from "./hooks/useSheetDrag";
import { useCloseOnTapOutside } from "./hooks/useCloseOnTapOutside";
import { useSheetClearance } from "./hooks/useSheetClearance";
import type { MapColor } from "./types";
import { layerColorStyle } from "./utils/layerColor";
import type { SheetSnap } from "./utils/sheetSnap";

import styles from "./map.module.css";

interface FeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  color?: MapColor; // of the feature's layer, for the swatch and edge
  // Taps here leave it open, for the map, whose clicks select features
  ignoreTapsIn?: HTMLElement | null;
  sheetRef?: Ref<HTMLElement>;
  children: ReactNode;
}

// Details sheet for a tapped feature (touch screens). Opens at up to half the
// screen; swipe up to expand it, down to collapse or dismiss it. Has no
// visible close button: swiping and tapping elsewhere on the page close it.
//
// Non-modal, without a backdrop: the map and page stay visible and usable
// behind it, and the page gets space below it to scroll the map above it.
export function FeatureDialog({
  open,
  onOpenChange,
  title,
  color,
  ignoreTapsIn,
  sheetRef: externalRef,
  children,
}: FeatureDialogProps) {
  const { t } = useTranslation();
  const fullscreenElement = useFullscreenElement();
  const bodyRef = useRef<HTMLDivElement>(null);
  const sheetElement = useRef<HTMLElement | null>(null);
  // Also kept as state: the sheet can mount a render after it opens (Radix's
  // Presence mounts it from a layout effect when reopening after a close)
  const [sheet, setSheetState] = useState<HTMLElement | null>(null);
  const [snap, setSnap] = useState<SheetSnap>("collapsed");

  // Each opening starts collapsed. Stays mounted between features of the same
  // layer, so reset as it opens rather than on mount.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSnap("collapsed");
  }

  const dragRef = useSheetDrag({
    snap,
    bodyRef,
    onSnap: setSnap,
    onDismiss: () => onOpenChange(false),
  });
  const setSheet = useCallback(
    (element: HTMLElement | null) => {
      sheetElement.current = element;
      setSheetState(element);
      const cleanupDrag = dragRef(element);
      return () => {
        cleanupDrag?.();
        sheetElement.current = null;
        setSheetState(null);
      };
    },
    [dragRef],
  );

  useSheetClearance(sheet, open);

  useCloseOnTapOutside(open, sheetElement, ignoreTapsIn, () =>
    onOpenChange(false),
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      {/* Portal into the fullscreen element, or the sheet opens behind it.
          Given a container, Radix mounts the sheet in the same render as it
          opens, so it can be measured as the map zooms to the feature. */}
      <Dialog.Portal container={fullscreenElement ?? document.body}>
        {/* Carries the theme into the portal, and passes on sheetRef */}
        <Theme asChild ref={externalRef as Ref<HTMLDivElement> | undefined}>
          <Dialog.Content
            ref={setSheet}
            className={`rt-BaseDialogContent rt-r-size-3 ${styles.sheet}`}
            data-expanded={snap === "expanded" || undefined}
            style={layerColorStyle(color)}
            aria-describedby={undefined}
            // Taps outside are handled above; Radix would also close it on
            // the start of a scroll, or when the map takes focus
            onInteractOutside={(e) => e.preventDefault()}
          >
            <div className={`${styles.detailsHeader} ${styles.sheetHeader}`}>
              <div className={styles.sheetHandle} aria-hidden />
              <ThemedDialog.Title className={styles.layerTitle} mb="0">
                <span className={styles.swatch} aria-hidden />
                {title ?? t("map.details")}
              </ThemedDialog.Title>
            </div>
            <div ref={bodyRef} className={styles.sheetBody}>
              {children}
            </div>
            {/* Swiping down or tapping elsewhere closes it. Screen readers,
                whose swipes move between elements instead, get a close
                button. */}
            <VisuallyHidden>
              <Dialog.Close asChild>
                <button type="button">{t("map.close")}</button>
              </Dialog.Close>
            </VisuallyHidden>
          </Dialog.Content>
        </Theme>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
