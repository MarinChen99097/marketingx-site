/**
 * Browser-side country detection for payment gateway routing.
 *
 * Used to pick between Stripe (default) and PayUni (Taiwan). IP geo is NOT a
 * security boundary here — we just switch UI/gateway; billing still happens
 * against whichever gateway the user actually lands on, and the backend is
 * the source of truth for credit granting.
 *
 * Strategy: try Cloudflare's /cdn-cgi/trace first (fast, no API key, unlimited),
 * then fall back to public IP-geo APIs. Cache the result per session so we
 * don't ping external services on every render.
 */

const SESSION_KEY = "mx_detected_country";
const TIMEOUT_MS = 2500;

function fetchWithTimeout(url: string, ms = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal, cache: "no-store" })
    .finally(() => clearTimeout(timer));
}

async function tryCloudflareTrace(): Promise<string | null> {
  try {
    const res = await fetchWithTimeout("https://www.cloudflare.com/cdn-cgi/trace");
    if (!res.ok) return null;
    const text = await res.text();
    // `loc=TW` line among key=value pairs.
    const match = text.match(/^loc=([A-Z]{2})$/m);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function tryCountryIs(): Promise<string | null> {
  try {
    const res = await fetchWithTimeout("https://api.country.is/");
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.country === "string" ? data.country : null;
  } catch {
    return null;
  }
}

async function tryIpApi(): Promise<string | null> {
  try {
    const res = await fetchWithTimeout("https://ipapi.co/country/");
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    return /^[A-Z]{2}$/.test(text) ? text : null;
  } catch {
    return null;
  }
}

/**
 * Detect the visitor's ISO 3166-1 alpha-2 country code (e.g. "TW", "US").
 * Returns null if all providers fail. Result cached for the browser session.
 */
export async function detectCountry(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const cached = sessionStorage.getItem(SESSION_KEY);
  if (cached) return cached === "__NULL__" ? null : cached;

  const providers = [tryCloudflareTrace, tryCountryIs, tryIpApi];
  for (const probe of providers) {
    const cc = await probe();
    if (cc) {
      sessionStorage.setItem(SESSION_KEY, cc);
      return cc;
    }
  }

  sessionStorage.setItem(SESSION_KEY, "__NULL__");
  return null;
}

export const isTaiwan = (country: string | null | undefined): boolean =>
  (country || "").toUpperCase() === "TW";
