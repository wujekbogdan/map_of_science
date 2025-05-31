import "normalize.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router";
import App from "./components/App.tsx";
import CanvasMaps from "./components/CanvasMap/CanvasMaps.tsx";
import "./css/global.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("No #root element found in the document");
}

createRoot(root).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/canvas" element={<CanvasMaps />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
);
