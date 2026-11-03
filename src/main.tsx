import { createRoot } from "react-dom/client";
import App from "./App";
import { AppErrorBoundary } from "./components/shared/AppStatus";
import { registerPlanVWorker } from "./pwa/register";
import { watchClientErrors } from "./lib/client-errors";
import "./index.css";
import { takeAdminReturn } from "./context/admin-return";
import { takeReturnPath } from "./context/oauth-return";
import { takeTeamReturn } from "./context/team-return";

try {
  let back: string | null = null;
  try { back = takeReturnPath(window.sessionStorage, window.location.pathname); } catch { back = null; }
  const admin = takeAdminReturn(window.localStorage, window.location.pathname);
  const team = takeTeamReturn(window.localStorage, window.location.pathname);
  const dest = back ?? (admin ? "/admin" : team ? "/equipo" : null);
  if (dest) {
    window.history.replaceState(window.history.state, "", `${dest}${window.location.search}${window.location.hash}`);
  }
} catch { /* sin almacenamiento: se entra a /admin a mano */ }

watchClientErrors();
registerPlanVWorker();
createRoot(document.getElementById("root")!).render(<AppErrorBoundary><App /></AppErrorBoundary>);
 
