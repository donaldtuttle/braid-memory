import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LabShell } from "@/components/lab/LabShell";
import "@/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LabShell />
  </StrictMode>,
);
