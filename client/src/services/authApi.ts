import { apiClient, setCsrfToken } from "./apiClient";
import type { AuthUser } from "../types/auth";

interface SessionResponse {
  data: { user: AuthUser; csrfToken: string };
}
const readSession = (response: SessionResponse) => {
  setCsrfToken(response.data.csrfToken);
  return response.data.user;
};

export const register = async (data: {
  name: string;
  email: string;
  password: string;
}) =>
  readSession(
    (await apiClient.post<SessionResponse>("/auth/register", data)).data,
  );
export const login = async (data: { email: string; password: string }) =>
  readSession(
    (await apiClient.post<SessionResponse>("/auth/login", data)).data,
  );
export const getCurrentUser = async () =>
  readSession((await apiClient.get<SessionResponse>("/auth/me")).data);
export const logout = async () => {
  await apiClient.post("/auth/logout");
  setCsrfToken(null);
};
