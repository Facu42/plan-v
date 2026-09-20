import { createRoot } from "react-dom/client";
import App from "./App";
import { registerPlanVWorker } from "./pwa/register";
import "./index.css";

registerPlanVWorker();
createRoot(document.getElementById("root")!).render(<App />);
 
