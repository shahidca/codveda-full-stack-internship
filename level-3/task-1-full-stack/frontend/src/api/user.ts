import { apiClient } from "./client";

export type CurrentUserResponse = {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
    };
  };
};

export const getCurrentUser = async (): Promise<CurrentUserResponse> => {
  return apiClient<CurrentUserResponse>("/api/users/me");
};

export const getAdminDashboard = async () => {
  return apiClient<{
    success: boolean;
    message: string;
  }>("/api/users/admin");
};