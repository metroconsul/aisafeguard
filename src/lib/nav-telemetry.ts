// Telemetria de navegação/entitlements.
// Objetivo: diagnosticar loops de redirecionamento entre /app (Safeguard)
// e /restaurant (Turnos). Puramente client-side, sem PII sensível.

export type NavEventType =
  | "route"
  | "auth"
  | "entitlement"
  | "guard"
  | "redirect"
  | "loop";

export interface NavEvent {
  t: number;
  iso: string;
  type: NavEventType;
  source: string;
  message: string;
  data?: Record<string, unknown>;
}

const STORAGE_KEY = "ava:nav-trace";
const MAX_EVENTS = 200;
const LOOP_WINDOW_MS = 4000;
const LOOP_THRESHOLD = 4;

let buffer: NavEvent[] = [];
const listeners = new Set<(events: NavEvent[]) => void>();

function load(): NavEvent[] {
  if (buffer.length) return buffer;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    buffer = raw ? (JSON.parse(raw) as NavEvent[]) : [];
  } catch {
    buffer = [];
  }
  return buffer;
}

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(buffer.slice(-MAX_EVENTS)));
  } catch {
    /* ignore quota */
  }
}

function emit() {
  const snapshot = [...buffer];
  listeners.forEach((fn) => fn(snapshot));
}

export function isNavDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (import.meta.env.DEV) return true;
  try {
    return (
      localStorage.getItem("ava:nav-debug") === "1" ||
      new URLSearchParams(window.location.search).has("navdebug")
    );
  } catch {
    return false;
  }
}

/** Registra um evento de navegação/entitlement. */
export function navLog(
  type: NavEventType,
  source: string,
  message: string,
  data?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  load();
  const now = Date.now();
  const event: NavEvent = {
    t: now,
    iso: new Date(now).toISOString(),
    type,
    source,
    message,
    data,
  };
  buffer.push(event);
  if (buffer.length > MAX_EVENTS) buffer = buffer.slice(-MAX_EVENTS);
  persist();
  emit();

  if (isNavDebugEnabled()) {
    // eslint-disable-next-line no-console
    console.info(`[nav:${type}] ${source} — ${message}`, data ?? "");
  }

  if (type === "redirect") {
    detectLoop(source, String(data?.to ?? ""));
  }
}

/** Detecta repetição de redirecionamentos no mesmo destino em janela curta. */
function detectLoop(source: string, to: string) {
  const since = Date.now() - LOOP_WINDOW_MS;
  const recent = buffer.filter(
    (e) => e.type === "redirect" && e.t >= since && e.data?.to === to,
  );
  if (recent.length >= LOOP_THRESHOLD) {
    const already = buffer.some((e) => e.type === "loop" && e.t >= since && e.data?.to === to);
    if (already) return;
    const event: NavEvent = {
      t: Date.now(),
      iso: new Date().toISOString(),
      type: "loop",
      source,
      message: `Possível loop: ${recent.length} redirecionamentos para ${to} em ${LOOP_WINDOW_MS}ms`,
      data: {
        to,
        count: recent.length,
        sources: [...new Set(recent.map((e) => e.source))],
        from: [...new Set(recent.map((e) => e.data?.from))],
      },
    };
    buffer.push(event);
    persist();
    emit();
    // eslint-disable-next-line no-console
    console.error(`[nav:loop] ${event.message}`, event.data);
  }
}

export function getNavTrace(): NavEvent[] {
  return [...load()];
}

export function clearNavTrace() {
  buffer = [];
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

export function subscribeNavTrace(fn: (events: NavEvent[]) => void): () => void {
  listeners.add(fn);
  fn(getNavTrace());
  return () => listeners.delete(fn);
}

/** Expõe helpers no console: __navTrace(), __navClear(), __navDebug(true). */
export function installNavTelemetryConsoleApi() {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  w.__navTrace = () => {
    const rows = getNavTrace().map((e) => ({
      time: e.iso.slice(11, 23),
      type: e.type,
      source: e.source,
      message: e.message,
      ...e.data,
    }));
    // eslint-disable-next-line no-console
    console.table(rows);
    return rows;
  };
  w.__navClear = clearNavTrace;
  w.__navDebug = (on = true) => {
    try {
      if (on) localStorage.setItem("ava:nav-debug", "1");
      else localStorage.removeItem("ava:nav-debug");
    } catch {
      /* ignore */
    }
    return on;
  };
}
