import { apiClient } from "./client";

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
  };
};

export type RegisterResponse = {
  success: boolean;
  message: string;
  data?: {
    user: User;
  };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  return apiClient<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
};

export const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<RegisterResponse> => {
  return apiClient<RegisterResponse>("/api/users/register", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });
};