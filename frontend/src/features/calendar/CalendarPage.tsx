"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  archiveCalendarEvent,
  createCalendarEvent,
  getCalendarEventsForDate,
  getUpcomingCalendarEvents,
  updateCalendarEvent,
} from "./api";
import type { CalendarEvent } from "./types";

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatEventTime(event: CalendarEvent) {
  if (!event.start_time && !event.end_time) {
    return "All day";
  }
  if (event.start_time && event.end_time) {
    return `${event.start_time.slice(0, 5)}-${event.end_time.slice(0, 5)}`;
  }
  if (event.start_time) {
    return event.start_time.slice(0, 5);
  }
  return `Until ${event.end_time?.slice(0, 5)}`;
}

function timeInputValue(value: string | null) {
  return value ? value.slice(0, 5) : "";
}

function emptyToNull(value: string) {
  return value.trim() ? value : null;
}

function EventCard({
  event,
  isSelected,
  onSelect,
}: {
  event: CalendarEvent;
  isSelected: boolean;
  onSelect: (event: CalendarEvent) => void;
}) {
  return (
    <button
      className={`w-full rounded border px-3 py-2 text-left ${
        isSelected
          ? "border-teal-700 bg-teal-50"
          : "border-neutral-200 hover:border-neutral-400"
      }`}
      onClick={() => onSelect(event)}
      type="button"
    >
      <span className="block text-sm font-medium text-neutral-950">
        {event.title}
      </span>
      <span className="mt-1 block text-xs text-neutral-600">
        {formatDisplayDate(event.event_date)} · {formatEventTime(event)}
      </span>
      {event.location ? (
        <span className="mt-1 block text-xs text-neutral-600">
          {event.location}
        </span>
      ) : null}
      {event.description ? (
        <span className="mt-1 block text-xs leading-5 text-neutral-600">
          {event.description}
        </span>
      ) : null}
    </button>
  );
}

export function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [dateEvents, setDateEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedEvent = useMemo(
    () =>
      [...dateEvents, ...upcomingEvents].find((event) => event.id === selectedEventId) ??
      null,
    [dateEvents, selectedEventId, upcomingEvents],
  );

  async function loadData() {
    setError(null);
    const [dateData, upcomingData] = await Promise.all([
      getCalendarEventsForDate(selectedDate),
      getUpcomingCalendarEvents(selectedDate),
    ]);
    setDateEvents(dateData);
    setUpcomingEvents(upcomingData);

    if (
      selectedEventId !== null &&
      ![...dateData, ...upcomingData].some((event) => event.id === selectedEventId)
    ) {
      resetForm();
    }
  }

  useEffect(() => {
    setIsLoading(true);
    loadData()
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setIsLoading(false));
  }, [selectedDate]);

  useEffect(() => {
    setEventDate(selectedDate);
    setSelectedEventId(null);
    resetForm(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (selectedEvent) {
      setTitle(selectedEvent.title);
      setDescription(selectedEvent.description);
      setEventDate(selectedEvent.event_date);
      setStartTime(timeInputValue(selectedEvent.start_time));
      setEndTime(timeInputValue(selectedEvent.end_time));
      setLocation(selectedEvent.location);
    }
  }, [selectedEvent]);

  function resetForm(date = selectedDate) {
    setSelectedEventId(null);
    setTitle("");
    setDescription("");
    setEventDate(date);
    setStartTime("");
    setEndTime("");
    setLocation("");
  }

  async function runAction(action: () => Promise<void>) {
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const created = await createCalendarEvent({
        title,
        description,
        event_date: eventDate,
        start_time: emptyToNull(startTime),
        end_time: emptyToNull(endTime),
        location,
      });
      setSelectedEventId(created.id);
      setNotice("Calendar event created.");
      await loadData();
    });
  }

  async function handleUpdateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEvent) {
      return;
    }

    await runAction(async () => {
      await updateCalendarEvent(selectedEvent.id, {
        title,
        description,
        event_date: eventDate,
        start_time: emptyToNull(startTime),
        end_time: emptyToNull(endTime),
        location,
      });
      setNotice("Calendar event updated.");
      await loadData();
    });
  }

  async function handleArchiveEvent() {
    if (!selectedEvent) {
      return;
    }

    await runAction(async () => {
      await archiveCalendarEvent(selectedEvent.id);
      resetForm();
      setNotice("Calendar event archived.");
      await loadData();
    });
  }

  return (
    <main className="min-h-screen px-6 py-8 text-neutral-900">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-6">
          <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
            <h1 className="text-2xl font-semibold">Calendar</h1>
            <p className="mt-2 text-sm leading-6 text-neutral-700">
              Create simple internal events and see what is coming up.
            </p>
            <label className="mt-4 block text-sm font-medium">
              Selected date
              <input
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                onChange={(event) => setSelectedDate(event.target.value)}
                type="date"
                value={selectedDate}
              />
            </label>
            {error ? (
              <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p className="mt-4 rounded border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
                {notice}
              </p>
            ) : null}
          </section>

          <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Upcoming Events</h2>
              <button
                className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100"
                onClick={() => resetForm()}
                type="button"
              >
                New
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {isLoading ? (
                <p className="text-sm text-neutral-600">Loading upcoming events...</p>
              ) : upcomingEvents.length === 0 ? (
                <p className="text-sm text-neutral-600">No upcoming events yet.</p>
              ) : (
                upcomingEvents.map((event) => (
                  <EventCard
                    event={event}
                    isSelected={selectedEventId === event.id}
                    key={event.id}
                    onSelect={(selected) => setSelectedEventId(selected.id)}
                  />
                ))
              )}
            </div>
          </section>
        </aside>

        <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">
              Events On {formatDisplayDate(selectedDate)}
            </h2>
            <div className="mt-4 space-y-2">
              {isLoading ? (
                <p className="text-sm text-neutral-600">Loading events...</p>
              ) : dateEvents.length === 0 ? (
                <p className="text-sm text-neutral-600">
                  No events for this date.
                </p>
              ) : (
                dateEvents.map((event) => (
                  <EventCard
                    event={event}
                    isSelected={selectedEventId === event.id}
                    key={event.id}
                    onSelect={(selected) => setSelectedEventId(selected.id)}
                  />
                ))
              )}
            </div>
          </section>

          <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">
              {selectedEvent ? "Edit Event" : "Create Event"}
            </h2>
            <form
              className="mt-4 space-y-4"
              onSubmit={selectedEvent ? handleUpdateEvent : handleCreateEvent}
            >
              <label className="block text-sm font-medium">
                Title
                <input
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  type="text"
                  value={title}
                />
              </label>
              <label className="block text-sm font-medium">
                Date
                <input
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                  onChange={(event) => setEventDate(event.target.value)}
                  required
                  type="date"
                  value={eventDate}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Start time
                  <input
                    className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                    onChange={(event) => setStartTime(event.target.value)}
                    type="time"
                    value={startTime}
                  />
                </label>
                <label className="block text-sm font-medium">
                  End time
                  <input
                    className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                    onChange={(event) => setEndTime(event.target.value)}
                    type="time"
                    value={endTime}
                  />
                </label>
              </div>
              <label className="block text-sm font-medium">
                Location
                <input
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                  onChange={(event) => setLocation(event.target.value)}
                  type="text"
                  value={location}
                />
              </label>
              <label className="block text-sm font-medium">
                Description
                <textarea
                  className="mt-1 min-h-32 w-full rounded border border-neutral-300 px-3 py-2"
                  onChange={(event) => setDescription(event.target.value)}
                  value={description}
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                  disabled={isSaving}
                  type="submit"
                >
                  {selectedEvent ? "Update Event" : "Create Event"}
                </button>
                {selectedEvent ? (
                  <button
                    className="rounded border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                    disabled={isSaving}
                    onClick={handleArchiveEvent}
                    type="button"
                  >
                    Archive Event
                  </button>
                ) : null}
              </div>
            </form>
          </section>
        </section>
      </section>
    </main>
  );
}
