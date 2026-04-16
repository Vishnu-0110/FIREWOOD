import axios from "axios";
import { store } from "../app/store";
import { clearCredentials } from "../features/authSlice";

const stripTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const resolveBaseUrl = () => {
  const envBaseUrl = stripTrailingSlash(import.meta.env.VITE_API_URL);
  if (envBaseUrl) return envBaseUrl;

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalDevHost = /^(localhost|127\.0\.0\.1)$/i.test(hostname);

    if (isLocalDevHost) {
      return `${window.location.protocol}//${hostname}:5000/api`;
    }

    return `${window.location.origin}/api`;
  }

  return "http://localhost:5000/api";
};

const baseURL = resolveBaseUrl();
const apiTimeoutMs = Number.parseInt(import.meta.env.VITE_API_TIMEOUT_MS || "20000", 10);
const AUTH_ERROR_CODES = new Set(["TOKEN_MISSING", "TOKEN_INVALID", "TOKEN_EXPIRED", "USER_NOT_FOUND"]);

const decodeTokenPayload = (token) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  if (!token) return true;
  const payload = decodeTokenPayload(token);
  const exp = Number(payload?.exp);
  if (!Number.isFinite(exp)) return false;
  const now = Math.floor(Date.now() / 1000);
  return exp <= now;
};

const clearLocalSession = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};

const redirectToLogin = () => {
  if (typeof window === "undefined" || window.location.pathname === "/login") {
    return;
  }
  window.location.href = "/login";
};

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: Number.isFinite(apiTimeoutMs) && apiTimeoutMs > 0 ? apiTimeoutMs : 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const requestUrl = config?.url || "";
  const isPublicAuthRequest = requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register");

  if (token && isTokenExpired(token) && !isPublicAuthRequest) {
    clearLocalSession();
    store.dispatch(clearCredentials());
    redirectToLogin();
    const staleSessionError = new Error("Session expired");
    staleSessionError.isSilentAuthError = true;
    return Promise.reject(staleSessionError);
  }

  if (token && !config.headers?.Authorization && !isPublicAuthRequest) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || "";
    const code = error?.response?.data?.code;

    if (status === 401 && !requestUrl.includes("/auth/login")) {
      const shouldHandleAuth = !code || AUTH_ERROR_CODES.has(code);
      if (shouldHandleAuth) {
        error.isSilentAuthError = true;
      }
      store.dispatch(clearCredentials());
      clearLocalSession();
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export default api;
