import type { CalendarEvent } from "./types";

export function calendarEventOccurrenceKey(
  event: Pick<CalendarEvent, "id" | "event_date">,
) {
  return `${event.id}-${event.event_date}`;
}
