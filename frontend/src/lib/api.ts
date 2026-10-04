/**
 * API client — dev: Vite proxies `/api` → Express :4000.
 * Production static build: set VITE_API_ORIGIN (e.g. http://127.0.0.1:4000) if there is no /api reverse proxy.
 */
const API_PREFIX = (() => {
  const o = import.meta.env.VITE_API_ORIGIN;
  if (o && String(o).trim()) {
    return `${String(o).replace(/\/$/, "")}/api`;
  }
  return "/api";
})();

const JSON_HEADERS = { "Content-Type": "application/json" };

function authHeader(): Record<string, string> {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function formatApiErrorMessage(data: Record<string, unknown>, status: number): string {
  if (typeof data.error === "string") return data.error;
  if (typeof data.message === "string") return data.message;
  if (data.error && typeof data.error === "object") {
    const o = data.error as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
    const fe = o.fieldErrors;
    if (fe && typeof fe === "object") {
      const parts = Object.entries(fe).flatMap(([k, v]) =>
        Array.isArray(v) ? v.map((x) => `${k}: ${x}`) : []
      );
      if (parts.length) return parts.join("; ");
    }
    if (Array.isArray(o.formErrors) && o.formErrors.length) return o.formErrors.join("; ");
  }
  return `HTTP ${status}`;
}

export async function apiFetch(
  path: string,
  init: RequestInit & { skipAuth?: boolean } = {}
): Promise<Response> {
  const { skipAuth, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (
    !(rest.body instanceof FormData) &&
    !headers.has("Content-Type") &&
    rest.body &&
    typeof rest.body === "string"
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (!skipAuth) {
    Object.entries(authHeader()).forEach(([k, v]) => headers.set(k, v));
  }
  let res: Response;
  try {
    res = await fetch(`${API_PREFIX}${path}`, { ...rest, headers });
  } catch {
    throw new ApiError(
      "Cannot reach the API. Start the backend on port 4000 and use Vite dev (npm run dev in frontend or repo root).",
      503,
      {}
    );
  }
  return res;
}

export async function apiJson<T = unknown>(
  path: string,
  init: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const res = await apiFetch(path, init);
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg = formatApiErrorMessage(data, res.status);
    throw new ApiError(msg, res.status, data);
  }
  return data as T;
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export function getToken() {
  return localStorage.getItem("token");
}

/** Link href for a stored upload filename (dev: proxied /uploads; prod: optional VITE_API_ORIGIN). */
export function publicUploadUrl(storedName: string): string {
  const o = import.meta.env.VITE_API_ORIGIN?.toString().trim();
  const path = `/uploads/${encodeURIComponent(storedName)}`;
  if (o) return `${o.replace(/\/$/, "")}${path}`;
  return path;
}
