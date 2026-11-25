const rawApiUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");

function isLocalBrowser() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export const API_BASE_URL =
  rawApiUrl || (import.meta.env.DEV || isLocalBrowser() ? "http://localhost:5000" : "");

export function apiUrl(path) {
  if (!API_BASE_URL) {
    throw new Error("Backend API URL is not configured (missing VITE_API_URL).");
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
