import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { installNavTelemetryConsoleApi, navLog } from "@/lib/nav-telemetry";

/** Registra cada mudança de rota para correlacionar com guards e entitlements. */
export function NavTelemetry() {
  const location = useLocation();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    installNavTelemetryConsoleApi();
  }, []);

  useEffect(() => {
    const path = location.pathname + location.search;
    navLog("route", "router", `Rota renderizada: ${path}`, {
      from: previous.current,
      to: path,
    });
    previous.current = path;
  }, [location.pathname, location.search]);

  return null;
}
