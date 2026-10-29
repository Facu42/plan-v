import { createRoot } from "react-dom/client";
import App from "./App";
import { AppErrorBoundary } from "./components/shared/AppStatus";
import { registerPlanVWorker } from "./pwa/register";
import { watchClientErrors } from "./lib/client-errors";
import "./index.css";
import { takeAdminReturn } from "./context/admin-return";
import { takeTeamReturn } from "./context/team-return";

try {
  if (takeAdminReturn(window.localStorage, window.location.pathname)) {
    window.history.replaceState(window.history.state, "", `/admin${window.location.search}${window.location.hash}`);
  } else if (takeTeamReturn(window.localStorage, window.location.pathname)) {
    window.history.replaceState(window.history.state, "", `/equipo${window.location.search}${window.location.hash}`);
  }
} catch { /* sin almacenamiento: se entra a /admin a mano */ }

watchClientErrors();
registerPlanVWorker();
createRoot(document.getElementById("root")!).render(<AppErrorBoundary><App /></AppErrorBoundary>);
 
