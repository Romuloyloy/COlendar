import type { DailyTask, WeeklyTask, WeeklyTaskCompletion } from "./types";
import { apiRequest } from "@/lib/api";

export function getDailyTasks(date: string): Promise<DailyTask[]> {
  return apiRequest<DailyTask[]>(`/api/tasks/daily?date=${encodeURIComponent(date)}`);
}

export function createDailyTask(input: {
  title: string;
  description: string;
  task_date: string;
}): Promise<DailyTask> {
  return apiRequest<DailyTask>("/api/tasks/daily", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateDailyTask(
  taskId: number,
  input: Partial<Pick<DailyTask, "title" | "description" | "task_date">>,
): Promise<DailyTask> {
  return apiRequest<DailyTask>(`/api/tasks/daily/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function archiveDailyTask(taskId: number): Promise<void> {
  return apiRequest<void>(`/api/tasks/daily/${taskId}`, { method: "DELETE" });
}

export function completeDailyTask(taskId: number): Promise<DailyTask> {
  return apiRequest<DailyTask>(`/api/tasks/daily/${taskId}/complete`, {
    method: "POST",
  });
}

export function incompleteDailyTask(taskId: number): Promise<DailyTask> {
  return apiRequest<DailyTask>(`/api/tasks/daily/${taskId}/incomplete`, {
    method: "POST",
  });
}

export function getWeeklyTasks(weekday?: number): Promise<WeeklyTask[]> {
  const query = weekday === undefined ? "" : `?weekday=${weekday}`;
  return apiRequest<WeeklyTask[]>(`/api/tasks/weekly${query}`);
}

export function createWeeklyTask(input: {
  title: string;
  description: string;
  weekdays: number[];
}): Promise<WeeklyTask> {
  return apiRequest<WeeklyTask>("/api/tasks/weekly", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateWeeklyTask(
  taskId: number,
  input: Partial<Pick<WeeklyTask, "title" | "description" | "weekdays">>,
): Promise<WeeklyTask> {
  return apiRequest<WeeklyTask>(`/api/tasks/weekly/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function archiveWeeklyTask(taskId: number): Promise<void> {
  return apiRequest<void>(`/api/tasks/weekly/${taskId}`, { method: "DELETE" });
}

export function getWeeklyTaskCompletions(
  completionDate: string,
): Promise<WeeklyTaskCompletion[]> {
  return apiRequest<WeeklyTaskCompletion[]>(
    `/api/tasks/weekly/completions?completion_date=${encodeURIComponent(completionDate)}`,
  );
}

export function completeWeeklyTask(
  taskId: number,
  completionDate: string,
): Promise<WeeklyTaskCompletion> {
  return apiRequest<WeeklyTaskCompletion>(
    `/api/tasks/weekly/${taskId}/complete?completion_date=${encodeURIComponent(completionDate)}`,
    { method: "POST" },
  );
}

export function incompleteWeeklyTask(
  taskId: number,
  completionDate: string,
): Promise<void> {
  return apiRequest<void>(
    `/api/tasks/weekly/${taskId}/incomplete?completion_date=${encodeURIComponent(completionDate)}`,
    { method: "POST" },
  );
}
