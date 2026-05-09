"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  archiveCalendarEvent,
  createCalendarEvent,
  getCalendarEventsForDateRange,
  getUpcomingCalendarEvents,
  updateCalendarEvent,
} from "./api";
import type { CalendarEvent } from "./types";
import { ErrorState, NoticeState } from "@/components/ui";
import {
  addDaysToIsoDate,
  formatDisplayDate,
  todayIsoDate,
  weekdayFromIsoDate,
} from "@/lib/date";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

function isoDateFromParts(year: number, monthIndex: number, day: number) {
  const month = `${monthIndex + 1}`.padStart(2, "0");
  const date = `${day}`.padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function monthStartIso(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return isoDateFromParts(date.getFullYear(), date.getMonth(), 1);
}

function addMonthsToIsoMonth(value: string, months: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setMonth(date.getMonth() + months, 1);
  return isoDateFromParts(date.getFullYear(), date.getMonth(), 1);
}

function monthLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function dayNumber(value: string) {
  return new Date(`${value}T00:00:00`).getDate();
}

function buildMonthDays(monthStart: string) {
  const startOffset = weekdayFromIsoDate(monthStart);
  const gridStart = addDaysToIsoDate(monthStart, -startOffset);
  return Array.from({ length: 42 }, (_, index) => addDaysToIsoDate(gridStart, index));
}

function sameMonth(value: string, monthStart: string) {
  return value.slice(0, 7) === monthStart.slice(0, 7);
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
        {formatDisplayDate(event.event_date)} - {formatEventTime(event)}
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
  const today = todayIsoDate();
  const [selectedDate, setSelectedDate] = useState(today);
  const [visibleMonth, setVisibleMonth] = useState(monthStartIso(today));
  const [monthEvents, setMonthEvents] = useState<CalendarEvent[]>([]);
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

  const monthDays = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);
  const monthRangeStart = monthDays[0];
  const monthRangeEnd = monthDays[monthDays.length - 1];

  const eventsByDate = useMemo(() => {
    return monthEvents.reduce<Record<string, CalendarEvent[]>>((grouped, event) => {
      grouped[event.event_date] = grouped[event.event_date] ?? [];
      grouped[event.event_date].push(event);
      return grouped;
    }, {});
  }, [monthEvents]);

  const selectedDateEvents = eventsByDate[selectedDate] ?? [];

  const selectedEvent = useMemo(
    () =>
      [...monthEvents, ...upcomingEvents].find(
        (event) => event.id === selectedEventId,
      ) ?? null,
    [monthEvents, selectedEventId, upcomingEvents],
  );

  async function loadData() {
    setError(null);
    const [monthData, upcomingData] = await Promise.all([
      getCalendarEventsForDateRange(monthRangeStart, monthRangeEnd),
      getUpcomingCalendarEvents(selectedDate),
    ]);
    setMonthEvents(monthData);
    setUpcomingEvents(upcomingData);

    if (
      selectedEventId !== null &&
      ![...monthData, ...upcomingData].some(
        (event) => event.id === selectedEventId,
      )
    ) {
      resetForm();
    }
  }

  useEffect(() => {
    setIsLoading(true);
    loadData()
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setIsLoading(false));
  }, [monthRangeStart, monthRangeEnd, selectedDate]);

  useEffect(() => {
    function refreshAfterQuickAdd() {
      void loadData().catch((caught: Error) => setError(caught.message));
    }

    window.addEventListener("quick-add:created", refreshAfterQuickAdd);
    return () =>
      window.removeEventListener("quick-add:created", refreshAfterQuickAdd);
  }, [monthRangeStart, monthRangeEnd, selectedDate]);

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

  function selectDate(date: string) {
    setSelectedDate(date);
    if (!sameMonth(date, visibleMonth)) {
      setVisibleMonth(monthStartIso(date));
    }
    resetForm(date);
  }

  function moveMonth(months: number) {
    const nextMonth = addMonthsToIsoMonth(visibleMonth, months);
    setVisibleMonth(nextMonth);
    setSelectedDate(nextMonth);
    resetForm(nextMonth);
  }

  function returnToToday() {
    const currentDate = todayIsoDate();
    setVisibleMonth(monthStartIso(currentDate));
    setSelectedDate(currentDate);
    resetForm(currentDate);
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
      setSelectedDate(created.event_date);
      setVisibleMonth(monthStartIso(created.event_date));
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
      const updated = await updateCalendarEvent(selectedEvent.id, {
        title,
        description,
        event_date: eventDate,
        start_time: emptyToNull(startTime),
        end_time: emptyToNull(endTime),
        location,
      });
      setSelectedEventId(updated.id);
      setSelectedDate(updated.event_date);
      setVisibleMonth(monthStartIso(updated.event_date));
      setNotice("Calendar event updated.");
      await loadData();
    });
  }

  async function handleArchiveEvent() {
    if (!selectedEvent) {
      return;
    }
    if (!window.confirm("Archive this calendar event?")) {
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
      <section className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <section className="rounded-md border border-neutral-300 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-teal-700">
                  Calendar
                </p>
                <h1 className="mt-1 text-3xl font-semibold text-neutral-950">
                  {monthLabel(visibleMonth)}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-700">
                  View scheduled events by month, select a day, and manage the
                  events that happen on that date.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="h-10 rounded-md border border-neutral-300 px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
                  onClick={() => moveMonth(-1)}
                  type="button"
                >
                  Prev
                </button>
                <button
                  className="h-10 rounded-md border border-neutral-300 px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
                  onClick={returnToToday}
                  type="button"
                >
                  Today
                </button>
                <button
                  className="h-10 rounded-md border border-neutral-300 px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
                  onClick={() => moveMonth(1)}
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
            {error ? (
              <div className="mt-4">
                <ErrorState message={error} />
              </div>
            ) : null}
            {notice ? (
              <div className="mt-4">
                <NoticeState message={notice} />
              </div>
            ) : null}
          </section>

          <section className="rounded-md border border-neutral-300 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-7 border-b border-neutral-200 pb-2 text-center text-xs font-semibold uppercase tracking-normal text-neutral-600">
              {WEEKDAY_LABELS.map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {monthDays.map((date) => {
                const dayEvents = eventsByDate[date] ?? [];
                const isSelected = date === selectedDate;
                const isToday = date === todayIsoDate();
                const isCurrentMonth = sameMonth(date, visibleMonth);

                return (
                  <button
                    className={`flex min-h-28 flex-col rounded-md border p-2 text-left transition ${
                      isSelected
                        ? "border-teal-700 bg-teal-50"
                        : "border-neutral-200 hover:border-neutral-400"
                    } ${isCurrentMonth ? "bg-white" : "bg-neutral-50 text-neutral-500"}`}
                    key={date}
                    onClick={() => selectDate(date)}
                    type="button"
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                        isToday ? "bg-teal-700 text-white" : "text-neutral-900"
                      }`}
                    >
                      {dayNumber(date)}
                    </span>
                    <span className="mt-2 flex flex-1 flex-col gap-1 overflow-hidden">
                      {isLoading ? (
                        <span className="text-xs text-neutral-500">Loading...</span>
                      ) : dayEvents.length === 0 ? (
                        <span className="text-xs text-neutral-400">No events</span>
                      ) : (
                        <>
                          {dayEvents.slice(0, 3).map((event) => (
                            <span
                              className="truncate rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-800"
                              key={event.id}
                            >
                              {formatEventTime(event)} - {event.title}
                            </span>
                          ))}
                          {dayEvents.length > 3 ? (
                            <span className="text-xs font-medium text-neutral-600">
                              +{dayEvents.length - 3} more
                            </span>
                          ) : null}
                        </>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
            <section className="rounded-md border border-neutral-300 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    {formatDisplayDate(selectedDate)}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    {selectedDateEvents.length} event
                    {selectedDateEvents.length === 1 ? "" : "s"} scheduled
                  </p>
                </div>
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
                  <p className="text-sm text-neutral-600">Loading events...</p>
                ) : selectedDateEvents.length === 0 ? (
                  <p className="text-sm text-neutral-600">
                    No events for this date.
                  </p>
                ) : (
                  selectedDateEvents.map((event) => (
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

            <section className="rounded-md border border-neutral-300 bg-white p-4 shadow-sm">
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
                    className="mt-1 min-h-28 w-full rounded border border-neutral-300 px-3 py-2"
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

        <aside className="rounded-md border border-neutral-300 bg-white p-4 shadow-sm xl:sticky xl:top-6 xl:self-start">
          <h2 className="text-lg font-semibold">Upcoming Events</h2>
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
                  onSelect={(selected) => {
                    setSelectedEventId(selected.id);
                    setSelectedDate(selected.event_date);
                    setVisibleMonth(monthStartIso(selected.event_date));
                  }}
                />
              ))
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
