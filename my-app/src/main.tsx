import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./metro.css";
import "./metro-scenes.css";
import "./retro.css";
import App from "./Ui/App.tsx";
import { startRetroReveal } from "./Ui/retroReveal";
import { RETRO_ROOM } from "./Ui/retroRoomBus";

// the parked 3D listening room (?room) brings its own styles
if (RETRO_ROOM) void import("./retro-room.css");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

startRetroReveal();
