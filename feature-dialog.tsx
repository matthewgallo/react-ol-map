import type { ReactNode } from "react";
import { Button, Dialog, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { useFullscreenElement } from "../../hooks/useFullscreenElement";

import styles from "./map.module.css";

interface FeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
}

// Details sheet for a tapped feature (touch screens)
export function FeatureDialog({
  open,
  onOpenChange,
  title,
  children,
}: FeatureDialogProps) {
  const { t } = useTranslation();
  const fullscreenElement = useFullscreenElement();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        className={styles.dialogContent}
        maxWidth="450px"
        aria-describedby={undefined}
        // Portal into the fullscreen element, or the dialog opens behind it
        container={fullscreenElement}
      >
        <Dialog.Title>{title ?? t("map.details")}</Dialog.Title>
        {children}
        <Flex justify="end" mt="4">
          <Dialog.Close>
            <Button variant="soft">{t("map.close")}</Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
