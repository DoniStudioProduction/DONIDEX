type EventName = 'app_open' | 'auth_success' | 'billing_open' | 'billing_checkout_started' | 'billing_verified' | 'billing_error';

const KEY = 'donidex:telemetry';
const MAX = 40;

export function track(name: EventName, details: Record<string, string | number | boolean> = {}) {
  try {
    const current = JSON.parse(localStorage.getItem(KEY) || '[]') as Array<Record<string, unknown>>;
    current.push({ name, at: new Date().toISOString(), ...details });
    localStorage.setItem(KEY, JSON.stringify(current.slice(-MAX)));
  } catch { /* telemetry must never interrupt the application */ }
}

export function readTelemetry() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as Array<Record<string, unknown>>; }
  catch { return []; }
}
