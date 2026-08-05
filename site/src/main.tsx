import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RoleRadarApp } from "./RoleRadarApp";
import "./styles/tokens.css";
import "./styles/base.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RoleRadarApp />
  </StrictMode>,
);
