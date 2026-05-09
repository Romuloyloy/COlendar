import type { CalendarEvent } from "./types";
import { apiRequest } from "@/lib/api";

export function getCalendarEventsForDate(date: string): Promise<CalendarEvent[]> {
  return apiRequest<CalendarEvent[]>(
    `/api/calendar/events?date=${encodeURIComponent(date)}`,
  );
}

export function getCalendarEventsForDateRange(
  fromDate: string,
  toDate: string,
): Promise<CalendarEvent[]> {
  return apiRequest<CalendarEvent[]>(
    `/api/calendar/events?from_date=${encodeURIComponent(
      fromDate,
    )}&to_date=${encodeURIComponent(toDate)}`,
  );
}

export function getUpcomingCalendarEvents(
  fromDate: string,
): Promise<CalendarEvent[]> {
  return apiRequest<CalendarEvent[]>(
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
  return apiRequest<CalendarEvent>("/api/calendar/events", {
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
  return apiRequest<CalendarEvent>(`/api/calendar/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function archiveCalendarEvent(eventId: number): Promise<void> {
  return apiRequest<void>(`/api/calendar/events/${eventId}`, { method: "DELETE" });
}
