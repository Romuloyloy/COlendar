import type {
  ActivityEntry,
  CalorieEntry,
  TrackerSummary,
  WaterEntry,
} from "./types";

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

export function getTrackerSummary(date: string): Promise<TrackerSummary> {
  return request<TrackerSummary>(
    `/api/tracker/summary?date=${encodeURIComponent(date)}`,
  );
}

export function createWaterEntry(input: {
  entry_date: string;
  amount_ml: number;
  note: string;
}): Promise<WaterEntry> {
  return request<WaterEntry>("/api/tracker/water", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function archiveWaterEntry(entryId: number): Promise<void> {
  return request<void>(`/api/tracker/water/${entryId}`, { method: "DELETE" });
}

export function createActivityEntry(input: {
  entry_date: string;
  activity_type: string;
  duration_minutes: number | null;
  quantity: string | null;
  note: string;
}): Promise<ActivityEntry> {
  return request<ActivityEntry>("/api/tracker/activity", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function archiveActivityEntry(entryId: number): Promise<void> {
  return request<void>(`/api/tracker/activity/${entryId}`, { method: "DELETE" });
}

export function createCalorieEntry(input: {
  entry_date: string;
  amount_kcal: number;
  label: string;
  note: string;
}): Promise<CalorieEntry> {
  return request<CalorieEntry>("/api/tracker/calories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function archiveCalorieEntry(entryId: number): Promise<void> {
  return request<void>(`/api/tracker/calories/${entryId}`, { method: "DELETE" });
}
