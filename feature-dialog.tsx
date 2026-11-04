import { useRef, useState, type ReactNode } from "react";
import { Dialog, VisuallyHidden } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { useFullscreenElement } from "../../hooks/useFullscreenElement";

import { useSheetDrag } from "./hooks/useSheetDrag";
import type { MapColor } from "./types";
import { layerColorStyle } from "./utils/layerColor";
import type { SheetSnap } from "./utils/sheetSnap";

import styles from "./map.module.css";

interface FeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  color?: MapColor; // of the feature's layer, for the swatch and edge
  children: ReactNode;
}

// Details sheet for a tapped feature (touch screens). Opens at up to half the
// screen; swipe up to expand it, down to collapse or dismiss it. Has no
// visible close button: swiping and tapping outside it close it.
export function FeatureDialog({
  open,
  onOpenChange,
  title,
  color,
  children,
}: FeatureDialogProps) {
  const { t } = useTranslation();
  const fullscreenElement = useFullscreenElement();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [snap, setSnap] = useState<SheetSnap>("collapsed");

  // Each opening starts collapsed. Stays mounted between features of the same
  // layer, so reset as it opens rather than on mount.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSnap("collapsed");
  }

  const sheetRef = useSheetDrag({
    snap,
    bodyRef,
    onSnap: setSnap,
    onDismiss: () => onOpenChange(false),
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        ref={sheetRef}
        className={styles.sheet}
        data-expanded={snap === "expanded" || undefined}
        style={layerColorStyle(color)}
        maxWidth="450px"
        aria-describedby={undefined}
        // Portal into the fullscreen element, or the dialog opens behind it
        container={fullscreenElement}
      >
        <div className={`${styles.detailsHeader} ${styles.sheetHeader}`}>
          <div className={styles.sheetHandle} aria-hidden />
          <Dialog.Title className={styles.layerTitle} mb="0">
            <span className={styles.swatch} aria-hidden />
            {title ?? t("map.details")}
          </Dialog.Title>
        </div>
        <div ref={bodyRef} className={styles.sheetBody}>
          {children}
        </div>
        {/* Swiping down or tapping outside closes it. Screen readers, whose
            swipes move between elements instead, get a close button. */}
        <VisuallyHidden>
          <Dialog.Close>
            <button type="button">{t("map.close")}</button>
          </Dialog.Close>
        </VisuallyHidden>
      </Dialog.Content>
    </Dialog.Root>
  );
}
