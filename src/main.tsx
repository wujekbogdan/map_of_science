import "normalize.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import App from "./components/App.tsx";
import CanvasMap from "./components/CanvasMap.tsx";
import "./css/global.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("No #root element found in the document");
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/canvas" element={<CanvasMap />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
