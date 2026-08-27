import { apiClient } from "./client";

export type TaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED";

export type Task = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  user_id: number;
  created_at?: string;
  updated_at?: string;
};

export type TaskListResponse = {
  success: boolean;
  message?: string;
  data: Task[];
};

export type TaskResponse = {
  success: boolean;
  message: string;
  data: Task;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  status?: TaskStatus;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string;
  status?: TaskStatus;
};

// ======================================================
// Get all tasks
// ======================================================

export const getTasks = async (): Promise<TaskListResponse> => {
  return apiClient<TaskListResponse>("/api/tasks");
};

// ======================================================
// Get single task
// ======================================================

export const getTask = async (
  id: number
): Promise<TaskResponse> => {
  return apiClient<TaskResponse>(`/api/tasks/${id}`);
};

// ======================================================
// Create task
// ======================================================

export const createTask = async (
  input: CreateTaskInput
): Promise<TaskResponse> => {
  return apiClient<TaskResponse>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
};

// ======================================================
// Update task
// ======================================================

export const updateTask = async (
  id: number,
  input: UpdateTaskInput
): Promise<TaskResponse> => {
  return apiClient<TaskResponse>(`/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
};

// ======================================================
// Delete task
// ======================================================

export const deleteTask = async (
  id: number
): Promise<{
  success: boolean;
  message: string;
}> => {
  return apiClient<{
    success: boolean;
    message: string;
  }>(`/api/tasks/${id}`, {
    method: "DELETE",
  });
};