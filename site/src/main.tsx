import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RoleRadarApp } from "./RoleRadarApp";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RoleRadarApp />
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("./sw.js").catch(() => undefined);
  });
}
