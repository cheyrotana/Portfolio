import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import "./themes/metro/metro.css";
import "./themes/metro/metro-scenes.css";
import "./themes/retro/retro.css";
import App from "./App.tsx";
import { startRetroReveal } from "./themes/retro/retroReveal";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

startRetroReveal();
