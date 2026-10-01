import { createRoot } from "react-dom/client";
import App from "./App";
import { registerPlanVWorker } from "./pwa/register";
import "./index.css";
import { takeAdminReturn } from "./context/admin-return";

try {
  if (takeAdminReturn(window.localStorage, window.location.pathname)) {
    window.history.replaceState(window.history.state, "", `/admin${window.location.search}${window.location.hash}`);
  }
} catch { /* sin almacenamiento: se entra a /admin a mano */ }

registerPlanVWorker();
createRoot(document.getElementById("root")!).render(<App />);
 
