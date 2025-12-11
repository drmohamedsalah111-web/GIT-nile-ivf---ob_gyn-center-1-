import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { PowerSyncProvider } from "./src/context/PowerSyncContext";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <PowerSyncProvider>
        <App />
      </PowerSyncProvider>
    </React.StrictMode>
  );
}