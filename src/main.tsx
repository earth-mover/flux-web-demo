import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router";
import Globe from "./demos/globe";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Globe />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
