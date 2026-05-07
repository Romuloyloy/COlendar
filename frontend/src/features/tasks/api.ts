import type { DailyTask, WeeklyTask, WeeklyTaskCompletion } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(formatApiError(body?.detail, response.status));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function formatApiError(detail: unknown, status: number): string {
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (
          typeof item === "object" &&
          item !== null &&
          "msg" in item &&
          typeof item.msg === "string"
        ) {
          return item.msg;
        }
        return "Validation error";
      })
      .join("; ");
  }

  return `Request failed with ${status}`;
}

export function getDailyTasks(date: string): Promise<DailyTask[]> {
  return request<DailyTask[]>(`/api/tasks/daily?date=${encodeURIComponent(date)}`);
}

export function createDailyTask(input: {
  title: string;
  description: string;
  task_date: string;
}): Promise<DailyTask> {
  return request<DailyTask>("/api/tasks/daily", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateDailyTask(
  taskId: number,
  input: Partial<Pick<DailyTask, "title" | "description" | "task_date">>,
): Promise<DailyTask> {
  return request<DailyTask>(`/api/tasks/daily/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function archiveDailyTask(taskId: number): Promise<void> {
  return request<void>(`/api/tasks/daily/${taskId}`, { method: "DELETE" });
}

export function completeDailyTask(taskId: number): Promise<DailyTask> {
  return request<DailyTask>(`/api/tasks/daily/${taskId}/complete`, {
    method: "POST",
  });
}

export function incompleteDailyTask(taskId: number): Promise<DailyTask> {
  return request<DailyTask>(`/api/tasks/daily/${taskId}/incomplete`, {
    method: "POST",
  });
}

export function getWeeklyTasks(weekday?: number): Promise<WeeklyTask[]> {
  const query = weekday === undefined ? "" : `?weekday=${weekday}`;
  return request<WeeklyTask[]>(`/api/tasks/weekly${query}`);
}

export function createWeeklyTask(input: {
  title: string;
  description: string;
  weekdays: number[];
}): Promise<WeeklyTask> {
  return request<WeeklyTask>("/api/tasks/weekly", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateWeeklyTask(
  taskId: number,
  input: Partial<Pick<WeeklyTask, "title" | "description" | "weekdays">>,
): Promise<WeeklyTask> {
  return request<WeeklyTask>(`/api/tasks/weekly/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function archiveWeeklyTask(taskId: number): Promise<void> {
  return request<void>(`/api/tasks/weekly/${taskId}`, { method: "DELETE" });
}

export function getWeeklyTaskCompletions(
  completionDate: string,
): Promise<WeeklyTaskCompletion[]> {
  return request<WeeklyTaskCompletion[]>(
    `/api/tasks/weekly/completions?completion_date=${encodeURIComponent(completionDate)}`,
  );
}

export function completeWeeklyTask(
  taskId: number,
  completionDate: string,
): Promise<WeeklyTaskCompletion> {
  return request<WeeklyTaskCompletion>(
    `/api/tasks/weekly/${taskId}/complete?completion_date=${encodeURIComponent(completionDate)}`,
    { method: "POST" },
  );
}

export function incompleteWeeklyTask(
  taskId: number,
  completionDate: string,
): Promise<void> {
  return request<void>(
    `/api/tasks/weekly/${taskId}/incomplete?completion_date=${encodeURIComponent(completionDate)}`,
    { method: "POST" },
  );
}
