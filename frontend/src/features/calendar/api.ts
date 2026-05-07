import type { CalendarEvent } from "./types";

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

export function getCalendarEventsForDate(date: string): Promise<CalendarEvent[]> {
  return request<CalendarEvent[]>(
    `/api/calendar/events?date=${encodeURIComponent(date)}`,
  );
}

export function getUpcomingCalendarEvents(
  fromDate: string,
): Promise<CalendarEvent[]> {
  return request<CalendarEvent[]>(
    `/api/calendar/events?upcoming=true&from_date=${encodeURIComponent(fromDate)}`,
  );
}

export function createCalendarEvent(input: {
  title: string;
  description: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string;
}): Promise<CalendarEvent> {
  return request<CalendarEvent>("/api/calendar/events", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCalendarEvent(
  eventId: number,
  input: Partial<
    Pick<
      CalendarEvent,
      "title" | "description" | "event_date" | "start_time" | "end_time" | "location"
    >
  >,
): Promise<CalendarEvent> {
  return request<CalendarEvent>(`/api/calendar/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function archiveCalendarEvent(eventId: number): Promise<void> {
  return request<void>(`/api/calendar/events/${eventId}`, { method: "DELETE" });
}
