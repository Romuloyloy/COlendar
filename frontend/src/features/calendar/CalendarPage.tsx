"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  archiveCalendarEvent,
  createCalendarEvent,
  getCalendarOverview,
  getUpcomingCalendarEvents,
  updateCalendarEvent,
} from "./api";
import type {
  CalendarEvent,
  CalendarOverviewDay,
  CalendarRecurringTaskOccurrence,
} from "./types";
import { calendarEventOccurrenceKey } from "./event-identity";
import { ErrorState, NoticeState } from "@/components/ui";
import {
  completeDailyTask,
  completeWeeklyTask,
  getTaskCategories,
  incompleteDailyTask,
  incompleteWeeklyTask,
} from "@/features/tasks/api";
import type { DailyTask, TaskCategory } from "@/features/tasks/types";
import {
  addDaysToIsoDate,
  formatDisplayDate,
  formatTime,
  todayIsoDate,
  weekdayFromIsoDate,
} from "@/lib/date";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) => hour);
const HOUR_HEIGHT = 64;
const MIN_EVENT_HEIGHT = 34;

type CalendarViewMode = "month" | "week";

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

function weekLabel(weekStart: string) {
  const weekEnd = addDaysToIsoDate(weekStart, 6);
  const start = formatDisplayDate(weekStart, {
    month: "short",
    day: "numeric",
  });
  const end = formatDisplayDate(weekEnd, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${start} - ${end}`;
}

function dayNumber(value: string) {
  return new Date(`${value}T00:00:00`).getDate();
}

function buildMonthDays(monthStart: string) {
  const startOffset = weekdayFromIsoDate(monthStart);
  const gridStart = addDaysToIsoDate(monthStart, -startOffset);
  return Array.from({ length: 42 }, (_, index) => addDaysToIsoDate(gridStart, index));
}

function weekStartIso(value: string) {
  return addDaysToIsoDate(value, -weekdayFromIsoDate(value));
}

function buildWeekDays(weekStart: string) {
  return Array.from({ length: 7 }, (_, index) => addDaysToIsoDate(weekStart, index));
}

function sameMonth(value: string, monthStart: string) {
  return value.slice(0, 7) === monthStart.slice(0, 7);
}

function oneTimeTaskMeta(task: DailyTask) {
  const meta = [];
  const plannedTime = formatTime(task.planned_time);
  const dueTime = formatTime(task.due_time);
  if (plannedTime) {
    meta.push(`Planned ${plannedTime}`);
  }
  if (task.due_date) {
    meta.push(
      dueTime
        ? `Due ${formatDisplayDate(task.due_date, {
            month: "short",
            day: "numeric",
          })} ${dueTime}`
        : `Due ${formatDisplayDate(task.due_date, {
            month: "short",
            day: "numeric",
          })}`,
    );
  }
  return meta.join(" - ");
}

function recurringTaskMeta(task: CalendarRecurringTaskOccurrence) {
  if (task.recurrence_type === "monthly_day") {
    return `Monthly on day ${task.day_of_month}`;
  }
  if (task.recurrence_type === "biweekly") {
    return "Bi-weekly";
  }
  return "Weekly";
}

function eventRecurrenceMeta(event: CalendarEvent) {
  if (event.recurrence_type === "monthly_day") {
    return `Monthly on day ${event.day_of_month}`;
  }
  if (event.recurrence_type === "biweekly") {
    return "Bi-weekly event";
  }
  if (event.recurrence_type === "weekly") {
    return "Weekly event";
  }
  return "One-time event";
}

function eventCategoryLabel(event: CalendarEvent, categories: TaskCategory[]) {
  if (event.category_id === null) {
    return null;
  }

  return categories.find((category) => category.id === event.category_id)?.name ?? null;
}

function eventCategory(event: CalendarEvent, categories: TaskCategory[]) {
  if (event.category_id === null) {
    return null;
  }
  return categories.find((category) => category.id === event.category_id) ?? null;
}

function minutesFromTime(value: string | null) {
  if (!value) {
    return null;
  }
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
}

function eventHasTimedStart(event: CalendarEvent) {
  return minutesFromTime(event.start_time) !== null;
}

function timeFromHour(hour: number) {
  return `${`${hour}`.padStart(2, "0")}:00`;
}

function timeFromHourEnd(hour: number) {
  if (hour >= 23) {
    return "23:59";
  }
  return `${`${hour + 1}`.padStart(2, "0")}:00`;
}

function EventCard({
  event,
  categories,
  isSelected,
  onSelect,
}: {
  event: CalendarEvent;
  categories: TaskCategory[];
  isSelected: boolean;
  onSelect: (event: CalendarEvent) => void;
}) {
  const categoryLabel = eventCategoryLabel(event, categories);
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
      <span className="mt-1 block text-xs text-neutral-600">
        {eventRecurrenceMeta(event)}
        {categoryLabel ? ` / ${categoryLabel}` : ""}
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

function TaskCompletionButton({
  isCompleted,
  onToggle,
}: {
  isCompleted: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className={`h-8 rounded border px-3 text-xs font-semibold ${
        isCompleted
          ? "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
          : "border-teal-700 bg-teal-700 text-white hover:bg-teal-800"
      }`}
      onClick={onToggle}
      type="button"
    >
      {isCompleted ? "Undo" : "Complete"}
    </button>
  );
}

function OneTimeTaskRow({
  task,
  onToggle,
}: {
  task: DailyTask;
  onToggle: (task: DailyTask) => void;
}) {
  const meta = oneTimeTaskMeta(task);
  return (
    <div className="rounded border border-neutral-200 px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-sm font-medium ${
              task.is_completed
                ? "text-neutral-500 line-through"
                : "text-neutral-950"
            }`}
          >
            {task.title}
          </p>
          {task.description ? (
            <p className="mt-1 text-xs leading-5 text-neutral-600">
              {task.description}
            </p>
          ) : null}
          {meta ? (
            <p className="mt-1 text-xs font-medium text-neutral-600">{meta}</p>
          ) : null}
        </div>
        <TaskCompletionButton
          isCompleted={task.is_completed}
          onToggle={() => onToggle(task)}
        />
      </div>
    </div>
  );
}

function RecurringTaskRow({
  task,
  onToggle,
}: {
  task: CalendarRecurringTaskOccurrence;
  onToggle: (task: CalendarRecurringTaskOccurrence) => void;
}) {
  return (
    <div className="rounded border border-neutral-200 px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-sm font-medium ${
              task.is_completed
                ? "text-neutral-500 line-through"
                : "text-neutral-950"
            }`}
          >
            {task.title}
          </p>
          {task.description ? (
            <p className="mt-1 text-xs leading-5 text-neutral-600">
              {task.description}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-neutral-600">{recurringTaskMeta(task)}</p>
        </div>
        <TaskCompletionButton
          isCompleted={task.is_completed}
          onToggle={() => onToggle(task)}
        />
      </div>
    </div>
  );
}

function VisibilityToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800">
      <input
        checked={checked}
        className="h-4 w-4 accent-teal-700"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function WeekCalendarView({
  categories,
  isLoading,
  onCreateAt,
  onSelectDate,
  onSelectEvent,
  overviewByDate,
  selectedDate,
  selectedEventId,
  weekDays,
}: {
  categories: TaskCategory[];
  isLoading: boolean;
  onCreateAt: (date: string, hour: number) => void;
  onSelectDate: (date: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  overviewByDate: Record<string, CalendarOverviewDay>;
  selectedDate: string;
  selectedEventId: number | null;
  weekDays: string[];
}) {
  return (
    <section className="overflow-hidden rounded-md border border-neutral-300 bg-white shadow-sm">
      <div className="grid grid-cols-[72px_repeat(7,minmax(128px,1fr))] border-b border-neutral-200 bg-[var(--color-app-bg-soft)]">
        <div className="border-r border-neutral-200 px-3 py-3 text-xs font-semibold uppercase text-neutral-500">
          Week
        </div>
        {weekDays.map((date) => {
          const isSelected = date === selectedDate;
          const isToday = date === todayIsoDate();
          return (
            <button
              className={`border-r border-neutral-200 px-3 py-3 text-left transition last:border-r-0 ${
                isSelected ? "bg-teal-50" : "hover:bg-white"
              }`}
              key={date}
              onClick={() => onSelectDate(date)}
              type="button"
            >
              <span className="block text-xs font-semibold uppercase text-neutral-500">
                {WEEKDAY_LABELS[weekdayFromIsoDate(date)]}
              </span>
              <span
                className={`mt-1 inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-semibold ${
                  isToday ? "bg-teal-700 text-white" : "text-neutral-950"
                }`}
              >
                {dayNumber(date)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-[72px_repeat(7,minmax(128px,1fr))] border-b border-neutral-200 bg-white">
        <div className="border-r border-neutral-200 px-3 py-3 text-xs font-semibold text-neutral-500">
          All-day
        </div>
        {weekDays.map((date) => {
          const dayEvents = overviewByDate[date]?.calendar_events ?? [];
          const unscheduledEvents = dayEvents.filter(
            (event) => !eventHasTimedStart(event),
          );
          return (
            <div
              className="min-h-20 space-y-1 border-r border-neutral-200 p-2 last:border-r-0"
              key={date}
            >
              {isLoading ? (
                <p className="text-xs text-neutral-500">Loading...</p>
              ) : unscheduledEvents.length === 0 ? (
                <p className="text-xs text-neutral-400">No unscheduled events</p>
              ) : (
                unscheduledEvents.map((event) => (
                  <WeekEventPill
                    categories={categories}
                    event={event}
                    isSelected={
                      selectedEventId === event.id && selectedDate === event.event_date
                    }
                    key={calendarEventOccurrenceKey(event)}
                    onSelect={onSelectEvent}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>

      <div className="max-h-[720px] overflow-auto">
        <div
          className="grid grid-cols-[72px_repeat(7,minmax(128px,1fr))]"
          style={{ minHeight: HOUR_LABELS.length * HOUR_HEIGHT }}
        >
          <div className="border-r border-neutral-200 bg-[var(--color-app-bg-soft)]">
            {HOUR_LABELS.map((hour) => (
              <div
                className="border-b border-neutral-200 px-2 pt-1 text-right text-xs font-medium text-neutral-500"
                key={hour}
                style={{ height: HOUR_HEIGHT }}
              >
                {timeFromHour(hour)}
              </div>
            ))}
          </div>

          {weekDays.map((date) => {
            const dayEvents = overviewByDate[date]?.calendar_events ?? [];
            const timedEvents = dayEvents.filter(eventHasTimedStart);
            return (
              <div
                className={`relative border-r border-neutral-200 last:border-r-0 ${
                  date === selectedDate ? "bg-teal-50/30" : "bg-white"
                }`}
                key={date}
              >
                {HOUR_LABELS.map((hour) => (
                  <button
                    aria-label={`Create event on ${formatDisplayDate(date)} at ${timeFromHour(hour)}`}
                    className="block w-full border-b border-neutral-100 text-left hover:bg-teal-50/50"
                    key={hour}
                    onClick={() => onCreateAt(date, hour)}
                    style={{ height: HOUR_HEIGHT }}
                    type="button"
                  />
                ))}
                {timedEvents.map((event, index) => (
                  <WeekTimedEvent
                    categories={categories}
                    event={event}
                    index={index}
                    isSelected={
                      selectedEventId === event.id && selectedDate === event.event_date
                    }
                    key={calendarEventOccurrenceKey(event)}
                    onSelect={onSelectEvent}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WeekEventPill({
  categories,
  event,
  isSelected,
  onSelect,
}: {
  categories: TaskCategory[];
  event: CalendarEvent;
  isSelected: boolean;
  onSelect: (event: CalendarEvent) => void;
}) {
  const category = eventCategory(event, categories);
  return (
    <button
      className={`w-full rounded-md border px-2 py-1.5 text-left text-xs transition ${
        isSelected
          ? "border-teal-700 bg-teal-50 text-teal-950"
          : "border-sky-200 bg-sky-50 text-sky-950 hover:border-sky-400"
      }`}
      onClick={() => onSelect(event)}
      style={{ borderLeftColor: category?.color || undefined, borderLeftWidth: 4 }}
      type="button"
    >
      <span className="block truncate font-semibold">{event.title}</span>
      <span className="block truncate text-[11px] text-neutral-600">
        {formatEventTime(event)}
        {category ? ` / ${category.name}` : ""}
        {event.recurrence_type !== "none" ? " / recurring" : ""}
      </span>
    </button>
  );
}

function WeekTimedEvent({
  categories,
  event,
  index,
  isSelected,
  onSelect,
}: {
  categories: TaskCategory[];
  event: CalendarEvent;
  index: number;
  isSelected: boolean;
  onSelect: (event: CalendarEvent) => void;
}) {
  const category = eventCategory(event, categories);
  const startMinutes = minutesFromTime(event.start_time) ?? 0;
  const endMinutes = minutesFromTime(event.end_time) ?? startMinutes + 60;
  const durationMinutes = Math.max(endMinutes - startMinutes, 30);
  const stackOffset = index % 3;
  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, MIN_EVENT_HEIGHT);

  return (
    <button
      className={`absolute z-10 overflow-hidden rounded-md border px-2 py-1 text-left text-xs shadow-sm transition ${
        isSelected
          ? "border-teal-700 bg-teal-50 text-teal-950 ring-2 ring-teal-200"
          : "border-sky-200 bg-sky-50 text-sky-950 hover:border-sky-400"
      }`}
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        onSelect(event);
      }}
      style={{
        borderLeftColor: category?.color || undefined,
        borderLeftWidth: 4,
        height,
        left: 6 + stackOffset * 10,
        right: 6,
        top,
      }}
      type="button"
    >
      <span className="block truncate font-semibold">{event.title}</span>
      <span className="block truncate text-[11px] text-neutral-600">
        {formatEventTime(event)}
      </span>
      <span className="block truncate text-[11px] text-neutral-600">
        {category?.name ?? "No category"}
        {event.recurrence_type !== "none" ? " / recurring" : ""}
      </span>
    </button>
  );
}

export function CalendarPage() {
  const today = todayIsoDate();
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [selectedDate, setSelectedDate] = useState(today);
  const [visibleMonth, setVisibleMonth] = useState(monthStartIso(today));
  const [overviewDays, setOverviewDays] = useState<CalendarOverviewDay[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [showEvents, setShowEvents] = useState(true);
  const [showOneTimeTasks, setShowOneTimeTasks] = useState(true);
  const [showRecurringTasks, setShowRecurringTasks] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [recurrenceType, setRecurrenceType] =
    useState<CalendarEvent["recurrence_type"]>("none");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [anchorDate, setAnchorDate] = useState(selectedDate);
  const [dayOfMonth, setDayOfMonth] = useState(`${dayNumber(selectedDate)}`);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const calendarRequestId = useRef(0);

  const monthDays = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);
  const monthRangeStart = monthDays[0];
  const monthRangeEnd = monthDays[monthDays.length - 1];
  const visibleWeekStart = useMemo(() => weekStartIso(selectedDate), [selectedDate]);
  const weekDays = useMemo(() => buildWeekDays(visibleWeekStart), [visibleWeekStart]);
  const visibleRangeStart = viewMode === "week" ? weekDays[0] : monthRangeStart;
  const visibleRangeEnd =
    viewMode === "week" ? weekDays[weekDays.length - 1] : monthRangeEnd;

  const overviewByDate = useMemo(() => {
    return overviewDays.reduce<Record<string, CalendarOverviewDay>>((grouped, day) => {
      grouped[day.date] = day;
      return grouped;
    }, {});
  }, [overviewDays]);

  const monthEvents = useMemo(
    () => overviewDays.flatMap((day) => day.calendar_events),
    [overviewDays],
  );
  const selectedOverviewDay = overviewByDate[selectedDate];
  const selectedDateEvents = selectedOverviewDay?.calendar_events ?? [];
  const selectedDateDailyTasks = selectedOverviewDay?.daily_tasks ?? [];
  const selectedDateRecurringTasks = selectedOverviewDay?.recurring_tasks ?? [];

  const selectedEvent = useMemo(
    () => {
      const events = [...monthEvents, ...upcomingEvents];
      return (
        events.find(
          (event) =>
            event.id === selectedEventId && event.event_date === selectedDate,
        ) ??
        events.find((event) => event.id === selectedEventId) ??
        null
      );
    },
    [monthEvents, selectedDate, selectedEventId, upcomingEvents],
  );

  async function loadData({ showInitialLoading = false } = {}) {
    const requestId = calendarRequestId.current + 1;
    calendarRequestId.current = requestId;
    setError(null);
    if (showInitialLoading && overviewDays.length === 0) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const [overview, upcomingData, categoryData] = await Promise.all([
        getCalendarOverview(visibleRangeStart, visibleRangeEnd),
        getUpcomingCalendarEvents(selectedDate),
        getTaskCategories(),
      ]);

      if (calendarRequestId.current !== requestId) {
        return;
      }

      setOverviewDays(overview.days);
      setUpcomingEvents(upcomingData);
      setCategories(categoryData);

      if (
        selectedEventId !== null &&
        ![...overview.days.flatMap((day) => day.calendar_events), ...upcomingData].some(
          (event) => event.id === selectedEventId,
        )
      ) {
        resetForm();
      }
    } finally {
      if (calendarRequestId.current === requestId) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }

  useEffect(() => {
    loadData({ showInitialLoading: true }).catch((caught: Error) =>
      setError(caught.message),
    );
  }, [visibleRangeStart, visibleRangeEnd, selectedDate]);

  useEffect(() => {
    function refreshAfterQuickAdd() {
      void loadData().catch((caught: Error) => setError(caught.message));
    }

    window.addEventListener("quick-add:created", refreshAfterQuickAdd);
    return () =>
      window.removeEventListener("quick-add:created", refreshAfterQuickAdd);
  }, [visibleRangeStart, visibleRangeEnd, selectedDate]);

  useEffect(() => {
    if (selectedEvent) {
      setTitle(selectedEvent.title);
      setDescription(selectedEvent.description);
      setEventDate(selectedEvent.event_date);
      setStartTime(timeInputValue(selectedEvent.start_time));
      setEndTime(timeInputValue(selectedEvent.end_time));
      setLocation(selectedEvent.location);
      setCategoryId(selectedEvent.category_id?.toString() ?? "");
      setRecurrenceType(selectedEvent.recurrence_type);
      setWeekdays(selectedEvent.weekdays);
      setAnchorDate(selectedEvent.anchor_date ?? selectedEvent.event_date);
      setDayOfMonth(`${selectedEvent.day_of_month ?? dayNumber(selectedEvent.event_date)}`);
      setRecurrenceEndDate(selectedEvent.recurrence_end_date ?? "");
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
    setCategoryId("");
    setRecurrenceType("none");
    setWeekdays([]);
    setAnchorDate(date);
    setDayOfMonth(`${dayNumber(date)}`);
    setRecurrenceEndDate("");
  }

  function toggleEventWeekday(weekday: number) {
    setWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((item) => item !== weekday)
        : [...current, weekday].sort(),
    );
  }

  function calendarEventPayload() {
    return {
      title,
      description,
      event_date: eventDate,
      start_time: emptyToNull(startTime),
      end_time: emptyToNull(endTime),
      location,
      category_id: categoryId ? Number(categoryId) : null,
      recurrence_type: recurrenceType,
      weekdays: recurrenceType === "weekly" || recurrenceType === "biweekly" ? weekdays : [],
      anchor_date: recurrenceType === "biweekly" ? emptyToNull(anchorDate) : null,
      day_of_month: recurrenceType === "monthly_day" ? Number(dayOfMonth) : null,
      recurrence_end_date:
        recurrenceType === "none" ? null : emptyToNull(recurrenceEndDate),
    };
  }

  function selectDate(date: string) {
    setSelectedDate(date);
    resetForm(date);
  }

  function moveMonth(months: number) {
    const nextMonth = addMonthsToIsoMonth(visibleMonth, months);
    setVisibleMonth(nextMonth);
    setSelectedDate(nextMonth);
    resetForm(nextMonth);
  }

  function moveWeek(weeks: number) {
    const nextDate = addDaysToIsoDate(selectedDate, weeks * 7);
    setSelectedDate(nextDate);
    setVisibleMonth(monthStartIso(nextDate));
    resetForm(nextDate);
  }

  function returnToToday() {
    const currentDate = todayIsoDate();
    setVisibleMonth(monthStartIso(currentDate));
    setSelectedDate(currentDate);
    resetForm(currentDate);
  }

  function handleCalendarPrevious() {
    if (viewMode === "week") {
      moveWeek(-1);
    } else {
      moveMonth(-1);
    }
  }

  function handleCalendarNext() {
    if (viewMode === "week") {
      moveWeek(1);
    } else {
      moveMonth(1);
    }
  }

  function handleCreateAt(date: string, hour: number) {
    setSelectedDate(date);
    setVisibleMonth(monthStartIso(date));
    resetForm(date);
    setEventDate(date);
    setStartTime(timeFromHour(hour));
    setEndTime(timeFromHourEnd(hour));
  }

  function handleSelectEvent(event: CalendarEvent) {
    setSelectedEventId(event.id);
    setSelectedDate(event.event_date);
    setVisibleMonth(monthStartIso(event.event_date));
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
        ...calendarEventPayload(),
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
        ...calendarEventPayload(),
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

  async function handleToggleDailyTask(task: DailyTask) {
    await runAction(async () => {
      if (task.is_completed) {
        await incompleteDailyTask(task.id);
      } else {
        await completeDailyTask(task.id);
      }
      setNotice(
        task.is_completed
          ? "One-time task marked incomplete."
          : "One-time task completed.",
      );
      await loadData();
    });
  }

  async function handleToggleRecurringTask(task: CalendarRecurringTaskOccurrence) {
    await runAction(async () => {
      if (task.is_completed) {
        await incompleteWeeklyTask(task.id, selectedDate);
      } else {
        await completeWeeklyTask(task.id, selectedDate);
      }
      setNotice(
        task.is_completed
          ? "Recurring task marked incomplete."
          : "Recurring task completed.",
      );
      await loadData();
    });
  }

  return (
    <main className="app-page">
      <section className="mx-auto grid w-full max-w-[90vw] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <section className="rounded-md border border-neutral-300 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-teal-700">
                  Calendar
                </p>
                <h1 className="mt-1 text-3xl font-semibold text-neutral-950">
                  {viewMode === "week"
                    ? weekLabel(visibleWeekStart)
                    : monthLabel(visibleMonth)}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-700">
                  {viewMode === "week"
                    ? "Plan the selected week by hour while keeping event editing in the existing calendar flow."
                    : "View events, one-time tasks, and recurring task occurrences together without merging how they are managed."}
                </p>
                {isRefreshing && !isLoading ? (
                  <p className="mt-1 text-xs font-semibold text-teal-700">
                    Updating calendar...
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <div className="flex rounded-md border border-neutral-300 bg-white p-1">
                  {(["month", "week"] as const).map((mode) => (
                    <button
                      aria-pressed={viewMode === mode}
                      className={`h-8 rounded px-3 text-sm font-semibold ${
                        viewMode === mode
                          ? "bg-teal-700 text-white"
                          : "text-neutral-700 hover:bg-neutral-100"
                      }`}
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      type="button"
                    >
                      {mode === "month" ? "Month" : "Week"}
                    </button>
                  ))}
                </div>
                <button
                  className="h-10 rounded-md border border-neutral-300 px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
                  onClick={handleCalendarPrevious}
                  type="button"
                >
                  {viewMode === "week" ? "Previous week" : "Prev"}
                </button>
                <button
                  className="h-10 rounded-md border border-neutral-300 px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
                  onClick={returnToToday}
                  type="button"
                >
                  {viewMode === "week" ? "This week" : "Today"}
                </button>
                <button
                  className="h-10 rounded-md border border-neutral-300 px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
                  onClick={handleCalendarNext}
                  type="button"
                >
                  {viewMode === "week" ? "Next week" : "Next"}
                </button>
              </div>
            </div>
            {viewMode === "month" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <VisibilityToggle
                  checked={showEvents}
                  label="Show events"
                  onChange={setShowEvents}
                />
                <VisibilityToggle
                  checked={showOneTimeTasks}
                  label="Show one-time tasks"
                  onChange={setShowOneTimeTasks}
                />
                <VisibilityToggle
                  checked={showRecurringTasks}
                  label="Show recurring tasks"
                  onChange={setShowRecurringTasks}
                />
              </div>
            ) : null}
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

          {viewMode === "month" ? (
            <section className="rounded-md border border-neutral-300 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-7 border-b border-neutral-200 pb-2 text-center text-xs font-semibold uppercase tracking-normal text-neutral-600">
                {WEEKDAY_LABELS.map((weekday) => (
                  <span key={weekday}>{weekday}</span>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1">
                {monthDays.map((date) => {
                  const dayOverview = overviewByDate[date];
                  const dayEvents = dayOverview?.calendar_events ?? [];
                  const dayDailyTasks = dayOverview?.daily_tasks ?? [];
                  const dayRecurringTasks = dayOverview?.recurring_tasks ?? [];
                  const visibleItemCount =
                    (showEvents ? dayEvents.length : 0) +
                    (showOneTimeTasks ? dayDailyTasks.length : 0) +
                    (showRecurringTasks ? dayRecurringTasks.length : 0);
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
                        ) : visibleItemCount === 0 ? (
                          <span className="text-xs text-neutral-400">No items</span>
                        ) : (
                          <>
                            {showEvents && dayEvents.length > 0 ? (
                              <span className="rounded bg-sky-50 px-2 py-1 text-xs font-medium text-sky-800">
                                {dayEvents.length} event
                                {dayEvents.length === 1 ? "" : "s"}
                              </span>
                            ) : null}
                            {showOneTimeTasks && dayDailyTasks.length > 0 ? (
                              <span className="rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                                {dayDailyTasks.length} task
                                {dayDailyTasks.length === 1 ? "" : "s"}
                              </span>
                            ) : null}
                            {showRecurringTasks && dayRecurringTasks.length > 0 ? (
                              <span className="rounded bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800">
                                {dayRecurringTasks.length} recurring
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
          ) : (
            <WeekCalendarView
              categories={categories}
              isLoading={isLoading}
              onCreateAt={handleCreateAt}
              onSelectDate={selectDate}
              onSelectEvent={handleSelectEvent}
              overviewByDate={overviewByDate}
              selectedDate={selectedDate}
              selectedEventId={selectedEventId}
              weekDays={weekDays}
            />
          )}

          <section className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
            <section className="rounded-md border border-neutral-300 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    {formatDisplayDate(selectedDate)}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    {selectedDateEvents.length} event
                    {selectedDateEvents.length === 1 ? "" : "s"},{" "}
                    {selectedDateDailyTasks.length} one-time task
                    {selectedDateDailyTasks.length === 1 ? "" : "s"},{" "}
                    {selectedDateRecurringTasks.length} recurring
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
              <div className="mt-4 space-y-5">
                {showEvents ? (
                  <section>
                    <h3 className="mb-2 text-sm font-semibold">Events</h3>
                    <div className="space-y-2">
                      {isLoading ? (
                        <p className="text-sm text-neutral-600">Loading events...</p>
                      ) : selectedDateEvents.length === 0 ? (
                        <p className="text-sm text-neutral-600">
                          No events for this date.
                        </p>
                      ) : (
                        selectedDateEvents.map((event) => (
                          <EventCard
                            categories={categories}
                            event={event}
                            isSelected={selectedEventId === event.id}
                            key={calendarEventOccurrenceKey(event)}
                            onSelect={handleSelectEvent}
                          />
                        ))
                      )}
                    </div>
                  </section>
                ) : null}

                {showOneTimeTasks ? (
                  <section>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold">One-time Tasks</h3>
                      <Link
                        className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                        href="/tasks"
                      >
                        Open Tasks
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {isLoading ? (
                        <p className="text-sm text-neutral-600">Loading tasks...</p>
                      ) : selectedDateDailyTasks.length === 0 ? (
                        <p className="text-sm text-neutral-600">
                          No one-time tasks for this date.
                        </p>
                      ) : (
                        selectedDateDailyTasks.map((task) => (
                          <OneTimeTaskRow
                            key={task.id}
                            onToggle={handleToggleDailyTask}
                            task={task}
                          />
                        ))
                      )}
                    </div>
                  </section>
                ) : null}

                {showRecurringTasks ? (
                  <section>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold">Recurring Tasks</h3>
                      <Link
                        className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                        href="/tasks"
                      >
                        Open Tasks
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {isLoading ? (
                        <p className="text-sm text-neutral-600">
                          Loading recurring tasks...
                        </p>
                      ) : selectedDateRecurringTasks.length === 0 ? (
                        <p className="text-sm text-neutral-600">
                          No recurring tasks scheduled for this date.
                        </p>
                      ) : (
                        selectedDateRecurringTasks.map((task) => (
                          <RecurringTaskRow
                            key={task.id}
                            onToggle={handleToggleRecurringTask}
                            task={task}
                          />
                        ))
                      )}
                    </div>
                  </section>
                ) : null}
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
                  Category
                  <select
                    className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                    onChange={(event) => setCategoryId(event.target.value)}
                    value={categoryId}
                  >
                    <option value="">No category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <section className="rounded border border-neutral-200 bg-neutral-50 p-3">
                  <label className="block text-sm font-medium">
                    Recurrence
                    <select
                      className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                      onChange={(event) =>
                        setRecurrenceType(
                          event.target.value as CalendarEvent["recurrence_type"],
                        )
                      }
                      value={recurrenceType}
                    >
                      <option value="none">None</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly_day">Monthly by day</option>
                    </select>
                  </label>
                  {recurrenceType === "weekly" || recurrenceType === "biweekly" ? (
                    <fieldset className="mt-3">
                      <legend className="text-sm font-medium text-neutral-800">
                        Weekdays
                      </legend>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {WEEKDAY_LABELS.map((label, index) => (
                          <label
                            className={`rounded-md border px-3 py-2 text-sm ${
                              weekdays.includes(index)
                                ? "border-teal-700 bg-teal-50 text-teal-900"
                                : "border-neutral-300 text-neutral-800"
                            }`}
                            key={label}
                          >
                            <input
                              checked={weekdays.includes(index)}
                              className="mr-2"
                              onChange={() => toggleEventWeekday(index)}
                              type="checkbox"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ) : null}
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {recurrenceType === "biweekly" ? (
                      <label className="block text-sm font-medium">
                        Anchor date
                        <input
                          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                          onChange={(event) => setAnchorDate(event.target.value)}
                          required
                          type="date"
                          value={anchorDate}
                        />
                      </label>
                    ) : null}
                    {recurrenceType === "monthly_day" ? (
                      <label className="block text-sm font-medium">
                        Day of month
                        <input
                          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                          max="31"
                          min="1"
                          onChange={(event) => setDayOfMonth(event.target.value)}
                          required
                          type="number"
                          value={dayOfMonth}
                        />
                      </label>
                    ) : null}
                    {recurrenceType !== "none" ? (
                      <label className="block text-sm font-medium">
                        End date
                        <input
                          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                          onChange={(event) =>
                            setRecurrenceEndDate(event.target.value)
                          }
                          type="date"
                          value={recurrenceEndDate}
                        />
                      </label>
                    ) : null}
                  </div>
                </section>
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
                  categories={categories}
                  event={event}
                  isSelected={selectedEventId === event.id}
                  key={calendarEventOccurrenceKey(event)}
                  onSelect={handleSelectEvent}
                />
              ))
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
