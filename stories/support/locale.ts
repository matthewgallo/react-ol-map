import { createContext, useContext } from "react";
import type { MapLabels } from "../../src";

export type Locale = "en" | "es";

// The toolbar's language, set by .storybook/preview.tsx
export const LocaleContext = createContext<Locale>("en");
export const useLocale = () => useContext(LocaleContext);

// folklorico's Spanish map text (src/i18n/locales/es.ts). English is the
// package's default.
export const SPANISH_LABELS: MapLabels = {
  details: "Detalles",
  close: "Cerrar",
  fullScreen: "Alternar pantalla completa",
  resetView: "Restablecer vista",
  loadError: "No se pudieron cargar los datos del mapa.",
  legend: "Leyenda",
  noData: "Sin datos",
  clusterCount: (count) => `${count} ubicaciones`,
};
