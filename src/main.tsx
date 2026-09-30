import { createRoot } from "react-dom/client";
import App from "./App";
import { AppErrorBoundary } from "./components/shared/AppStatus";
import { registerPlanVWorker } from "./pwa/register";
import "./index.css";

registerPlanVWorker();
createRoot(document.getElementById("root")!).render(<AppErrorBoundary><App /></AppErrorBoundary>);
 
