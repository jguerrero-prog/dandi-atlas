import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "@ui";
import "./css/fonts.css";
import "./css/tokens.css";
import "./css/global.css";
import { App } from "./App";
import { watchSystemTheme } from "./theme";

watchSystemTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
