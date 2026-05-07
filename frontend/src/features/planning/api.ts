import type { DailyPlan, WeeklyPlan } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(formatApiError(body?.detail, response.status));
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

export function getDailyPlan(date: string): Promise<DailyPlan> {
  return request<DailyPlan>(`/api/planning/daily?date=${encodeURIComponent(date)}`);
}

export function getWeeklyPlan(date: string): Promise<WeeklyPlan> {
  return request<WeeklyPlan>(`/api/planning/weekly?date=${encodeURIComponent(date)}`);
}
