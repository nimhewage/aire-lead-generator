import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Prefer local disk when set to "local" (e.g. Supabase unreachable). */
export function preferLocalData() {
  const mode = (process.env.AIRE_DATA_SOURCE || "").toLowerCase();
  return mode === "local" || mode === "disk" || mode === "csv";
}

export function supabaseConfigured() {
  if (preferLocalData()) return false;
  return Boolean(
    process.env.SUPABASE_URL &&
      (process.env.SUPABASE_SECRET_KEY ||
        process.env.SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  );
}

export function getSupabaseUrl() {
  return (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  );
}

const FETCH_TIMEOUT_MS = Number(process.env.SUPABASE_FETCH_TIMEOUT_MS || 4000);

/** Abort hung Supabase requests so we can fall back to local data. */
function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const parentSignal = init?.signal;
  if (parentSignal) {
    if (parentSignal.aborted) controller.abort();
    else
      parentSignal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
  }
  return fetch(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

/** Server client — prefers secret key (bypasses RLS for writes). */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!supabaseConfigured()) return null;
  const url = getSupabaseUrl();
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchWithTimeout },
  });
}
