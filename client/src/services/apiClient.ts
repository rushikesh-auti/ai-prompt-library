import axios from "axios";

let csrfToken: string | null = null;

export const setCsrfToken = (token: string | null) => {
  csrfToken = token;
};

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (
    csrfToken &&
    ["post", "put", "patch", "delete"].includes(config.method || "")
  ) {
    config.headers.set("X-CSRF-Token", csrfToken);
  }
  return config;
});

apiClient.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth:expired"));
  }
  return Promise.reject(error);
});
