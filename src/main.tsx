import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "@ui";
import "./css/fonts.css";
import "./css/tokens.css";
import "./css/global.css";
import { App } from "./App";
import { setDefaultTheme, watchSystemTheme } from "./theme";

// Neurosift Brain opens dark until someone picks another theme; index.html draws the same before React.
setDefaultTheme("dark");
watchSystemTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
