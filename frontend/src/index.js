import React from "react";
import ReactDOM from "react-dom/client";
import "@/lightswindv1.0.css";
import "@/index.css";
import App from "@/App";
import { registerServiceWorker } from "./serviceWorkerRegistration";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register service worker for offline support
registerServiceWorker();
