import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";
import { useState } from "react";
import { CompatibilityWidget } from "../components/CompatibilityWidget";
import { generateMockAnalysis, ofertaDetectadaMock } from "../lib/mock/oferta-analysis.mock";
import styleText from "data-text:../style.css";

export const config: PlasmoCSConfig = {
  matches: [
    "https://*.trabajando.com/*",
    "https://*.trabajando.cl/*",
    "https://*.laborum.cl/*",
    "https://www.linkedin.com/jobs/*",
    "https://*.chiletrabajos.cl/*",
    "https://*.computrabajo.cl/*",
  ],
};

// Inyección limpia del CSS en el Shadow DOM
export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style");
  style.textContent = styleText;
  return style;
};

export default function JobWidget() {
  const [visible, setVisible] = useState(true);
  const [analysis] = useState(() => generateMockAnalysis());

  if (!visible) return null;

  return (
    <CompatibilityWidget
      oferta={ofertaDetectadaMock}
      compatibilidad={analysis}
      onClose={() => setVisible(false)}
    />
  );
}