import type {
  DailyTask,
  TaskCategory,
  WeeklyTask,
  WeeklyTaskCompletion,
} from "./types";
import { apiRequest } from "@/lib/api";

export function getTaskCategories(): Promise<TaskCategory[]> {
  return apiRequest<TaskCategory[]>("/api/tasks/categories");
}

export function createTaskCategory(input: {
  name: string;
  color: string;
}): Promise<TaskCategory> {
  return apiRequest<TaskCategory>("/api/tasks/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTaskCategory(
  categoryId: number,
  input: Partial<Pick<TaskCategory, "name" | "color">>,
): Promise<TaskCategory> {
  return apiRequest<TaskCategory>(`/api/tasks/categories/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function archiveTaskCategory(categoryId: number): Promise<void> {
  return apiRequest<void>(`/api/tasks/categories/${categoryId}`, {
    method: "DELETE",
  });
}

export function getDailyTasks(
  date: string,
  categoryId?: number,
  mode: "selected" | "open" = "selected",
): Promise<DailyTask[]> {
  const params = new URLSearchParams({ date });
  if (mode !== "selected") {
    params.set("mode", mode);
  }
  if (categoryId !== undefined) {
    params.set("category_id", String(categoryId));
  }
  return apiRequest<DailyTask[]>(`/api/tasks/daily?${params.toString()}`);
}

export function createDailyTask(input: {
  title: string;
  description: string;
  task_date: string;
  planned_time?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  category_id?: number | null;
}): Promise<DailyTask> {
  return apiRequest<DailyTask>("/api/tasks/daily", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateDailyTask(
  taskId: number,
  input: Partial<
    Pick<
      DailyTask,
      | "title"
      | "description"
      | "task_date"
      | "planned_time"
      | "due_date"
      | "due_time"
      | "category_id"
    >
  >,
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

export function getWeeklyTasks(
  date?: string,
  categoryId?: number,
): Promise<WeeklyTask[]> {
  const params = new URLSearchParams();
  if (date !== undefined) {
    params.set("date", date);
  }
  if (categoryId !== undefined) {
    params.set("category_id", String(categoryId));
  }
  const query = params.toString();
  return apiRequest<WeeklyTask[]>(`/api/tasks/weekly${query ? `?${query}` : ""}`);
}

export function createWeeklyTask(input: {
  title: string;
  description: string;
  weekdays: number[];
  recurrence_type?: WeeklyTask["recurrence_type"];
  anchor_date?: string | null;
  day_of_month?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  category_id?: number | null;
}): Promise<WeeklyTask> {
  return apiRequest<WeeklyTask>("/api/tasks/weekly", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateWeeklyTask(
  taskId: number,
  input: Partial<
    Pick<
      WeeklyTask,
      | "title"
      | "description"
      | "weekdays"
      | "recurrence_type"
      | "anchor_date"
      | "day_of_month"
      | "start_date"
      | "end_date"
      | "category_id"
    >
  >,
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
