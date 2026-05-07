"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getDashboardSummary } from "./api";
import type { DashboardSummary, DashboardWeeklyTask } from "./types";
import type { CalendarEvent } from "@/features/calendar/types";
import type { DailyTask } from "@/features/tasks/types";
import {
  completeDailyTask,
  completeWeeklyTask,
  incompleteDailyTask,
  incompleteWeeklyTask,
} from "@/features/tasks/api";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

function weekdayFromIsoDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return (date.getDay() + 6) % 7;
}

function notePreview(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "No note body yet.";
  }
  return normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
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

type SectionProps = {
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

function DashboardSection({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: SectionProps) {
  return (
    <section
      className={`rounded border border-neutral-300 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase text-teal-700">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 text-xl font-semibold text-neutral-950">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function TodayOverviewSection({
  selectedDate,
  summary,
  onDateChange,
}: {
  selectedDate: string;
  summary: DashboardSummary | null;
  onDateChange: (date: string) => void;
}) {
  const weekday = WEEKDAYS[weekdayFromIsoDate(selectedDate)];
  const dailyOpen = summary?.counts.incomplete_daily_task_count ?? 0;
  const weeklyOpen = summary?.counts.incomplete_weekly_task_count ?? 0;
  const upcomingEvents = summary?.counts.upcoming_event_count ?? 0;

  return (
    <DashboardSection
      action={
        <label className="text-sm font-medium text-neutral-800">
          Date
          <input
            className="ml-2 rounded border border-neutral-300 px-3 py-2"
            onChange={(event) => onDateChange(event.target.value)}
            type="date"
            value={selectedDate}
          />
        </label>
      }
      className="lg:col-span-2"
      eyebrow="Today Overview"
      title={formatDisplayDate(selectedDate)}
    >
      <div className="mt-5 grid border-y border-neutral-200 sm:grid-cols-4 sm:divide-x sm:divide-neutral-200">
        <div className="px-4 py-3">
          <p className="text-xs font-semibold uppercase text-neutral-500">Day</p>
          <p className="mt-1 text-lg font-semibold">{weekday}</p>
        </div>
        <div className="border-t border-neutral-200 px-4 py-3 sm:border-t-0">
          <p className="text-xs font-semibold uppercase text-neutral-500">
            Daily Left
          </p>
          <p className="mt-1 text-lg font-semibold">{dailyOpen}</p>
        </div>
        <div className="border-t border-neutral-200 px-4 py-3 sm:border-t-0">
          <p className="text-xs font-semibold uppercase text-neutral-500">
            Weekly Left
          </p>
          <p className="mt-1 text-lg font-semibold">{weeklyOpen}</p>
        </div>
        <div className="border-t border-neutral-200 px-4 py-3 sm:border-t-0">
          <p className="text-xs font-semibold uppercase text-neutral-500">
            Upcoming
          </p>
          <p className="mt-1 text-lg font-semibold">{upcomingEvents}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          href="/tasks"
        >
          Open Tasks
        </Link>
        <Link
          className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
          href="/notes"
        >
          Open Notes
        </Link>
        <Link
          className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
          href="/calendar"
        >
          Open Calendar
        </Link>
      </div>
    </DashboardSection>
  );
}

function DailyTasksSection({
  tasks,
  isSaving,
  onToggle,
}: {
  tasks: DailyTask[];
  isSaving: boolean;
  onToggle: (task: DailyTask) => void;
}) {
  return (
    <DashboardSection
      action={
        <Link
          className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100"
          href="/tasks"
        >
          Manage
        </Link>
      }
      eyebrow="Today"
      title="Daily Tasks"
    >
      <div className="mt-4 space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-neutral-600">No daily tasks for this date.</p>
        ) : (
          tasks.map((task) => (
            <label
              className="flex items-start gap-3 rounded border border-neutral-200 px-3 py-2"
              key={task.id}
            >
              <input
                checked={task.is_completed}
                className="mt-1"
                disabled={isSaving}
                onChange={() => onToggle(task)}
                type="checkbox"
              />
              <span className="min-w-0">
                <span
                  className={`block text-sm font-medium ${
                    task.is_completed ? "text-neutral-500 line-through" : ""
                  }`}
                >
                  {task.title}
                </span>
                {task.description ? (
                  <span className="mt-1 block text-xs leading-5 text-neutral-600">
                    {task.description}
                  </span>
                ) : null}
              </span>
            </label>
          ))
        )}
      </div>
    </DashboardSection>
  );
}

function WeeklyTasksSection({
  selectedDate,
  tasks,
  isSaving,
  onToggle,
}: {
  selectedDate: string;
  tasks: DashboardWeeklyTask[];
  isSaving: boolean;
  onToggle: (task: DashboardWeeklyTask) => void;
}) {
  const weekday = WEEKDAYS[weekdayFromIsoDate(selectedDate)];

  return (
    <DashboardSection
      action={
        <Link
          className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100"
          href="/tasks"
        >
          Manage
        </Link>
      }
      eyebrow={weekday}
      title="Weekly Tasks"
    >
      <div className="mt-4 space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-neutral-600">
            No weekly tasks are scheduled for this date.
          </p>
        ) : (
          tasks.map((task) => (
            <label
              className="flex items-start gap-3 rounded border border-neutral-200 px-3 py-2"
              key={task.id}
            >
              <input
                checked={task.is_completed}
                className="mt-1"
                disabled={isSaving}
                onChange={() => onToggle(task)}
                type="checkbox"
              />
              <span className="min-w-0">
                <span
                  className={`block text-sm font-medium ${
                    task.is_completed ? "text-neutral-500 line-through" : ""
                  }`}
                >
                  {task.title}
                </span>
                <span className="mt-1 block text-xs text-neutral-600">
                  {task.weekdays.map((day) => WEEKDAYS[day]).join(", ")}
                </span>
                {task.description ? (
                  <span className="mt-1 block text-xs leading-5 text-neutral-600">
                    {task.description}
                  </span>
                ) : null}
              </span>
            </label>
          ))
        )}
      </div>
    </DashboardSection>
  );
}

function RecentNotesSection({ notes }: { notes: DashboardSummary["recent_notes"] }) {
  return (
    <DashboardSection
      action={
        <Link
          className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100"
          href="/notes"
        >
          Manage
        </Link>
      }
      eyebrow="Notes"
      title="Recent Notes"
    >
      <div className="mt-4 space-y-2">
        {notes.length === 0 ? (
          <p className="text-sm text-neutral-600">No recent notes yet.</p>
        ) : (
          notes.map((note) => (
            <div
              className="rounded border border-neutral-200 px-3 py-2"
              key={note.id}
            >
              <p className="text-sm font-medium text-neutral-950">{note.title}</p>
              <p className="mt-1 text-xs leading-5 text-neutral-600">
                {notePreview(note.content)}
              </p>
            </div>
          ))
        )}
      </div>
    </DashboardSection>
  );
}

function UpcomingEventsSection({ events }: { events: CalendarEvent[] }) {
  return (
    <DashboardSection
      action={
        <Link
          className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100"
          href="/calendar"
        >
          Manage
        </Link>
      }
      eyebrow="Calendar"
      title="Upcoming Events"
    >
      <div className="mt-4 space-y-2">
        {events.length === 0 ? (
          <p className="text-sm text-neutral-600">No upcoming events yet.</p>
        ) : (
          events.map((event) => (
            <div
              className="rounded border border-neutral-200 px-3 py-2"
              key={event.id}
            >
              <p className="text-sm font-medium text-neutral-950">{event.title}</p>
              <p className="mt-1 text-xs text-neutral-600">
                {formatDisplayDate(event.event_date)} - {formatEventTime(event)}
              </p>
              {event.location ? (
                <p className="mt-1 text-xs text-neutral-600">{event.location}</p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </DashboardSection>
  );
}

function TrackerSummarySection({
  summary,
}: {
  summary: DashboardSummary["tracker_summary"];
}) {
  const hasTrackerData =
    summary.total_water_ml > 0 || summary.activity_entries.length > 0;

  return (
    <DashboardSection
      action={
        <Link
          className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100"
          href="/tracker"
        >
          Manage
        </Link>
      }
      eyebrow="Tracker"
      title="Daily Tracking"
    >
      <div className="mt-4 grid border-y border-neutral-200 sm:grid-cols-2 sm:divide-x sm:divide-neutral-200">
        <div className="px-3 py-3">
          <p className="text-xs font-semibold uppercase text-neutral-500">Water</p>
          <p className="mt-1 text-lg font-semibold">{summary.total_water_ml} ml</p>
        </div>
        <div className="border-t border-neutral-200 px-3 py-3 sm:border-t-0">
          <p className="text-xs font-semibold uppercase text-neutral-500">
            Activity
          </p>
          <p className="mt-1 text-lg font-semibold">
            {summary.activity_count} entries
          </p>
          <p className="mt-1 text-xs text-neutral-600">
            {summary.total_activity_minutes} minutes
          </p>
        </div>
      </div>
      {!hasTrackerData ? (
        <p className="mt-4 text-sm text-neutral-600">
          No water or activity entries for this date yet.
        </p>
      ) : null}
    </DashboardSection>
  );
}

export function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDateLabel = useMemo(
    () => formatDisplayDate(selectedDate),
    [selectedDate],
  );

  async function loadSummary() {
    setError(null);
    const data = await getDashboardSummary(selectedDate);
    setSummary(data);
  }

  useEffect(() => {
    setIsLoading(true);
    loadSummary()
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setIsLoading(false));
  }, [selectedDate]);

  async function runTaskAction(action: () => Promise<void>) {
    setIsSaving(true);
    setError(null);
    try {
      await action();
      await loadSummary();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleDailyTask(task: DailyTask) {
    void runTaskAction(async () => {
      if (task.is_completed) {
        await incompleteDailyTask(task.id);
      } else {
        await completeDailyTask(task.id);
      }
    });
  }

  function toggleWeeklyTask(task: DashboardWeeklyTask) {
    void runTaskAction(async () => {
      if (task.is_completed) {
        await incompleteWeeklyTask(task.id, selectedDate);
      } else {
        await completeWeeklyTask(task.id, selectedDate);
      }
    });
  }

  return (
    <main className="min-h-screen px-6 py-8 text-neutral-900">
      <section className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-teal-700">
              Fixed Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-neutral-950">
              COlendar
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-700">
              A practical home base for {selectedDateLabel}.
            </p>
          </div>
          {error ? (
            <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}
        </header>

        {isLoading ? (
          <section className="rounded border border-neutral-300 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-600">Loading dashboard...</p>
          </section>
        ) : summary ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <TodayOverviewSection
              onDateChange={setSelectedDate}
              selectedDate={selectedDate}
              summary={summary}
            />
            <DailyTasksSection
              isSaving={isSaving}
              onToggle={toggleDailyTask}
              tasks={summary.daily_tasks}
            />
            <WeeklyTasksSection
              isSaving={isSaving}
              onToggle={toggleWeeklyTask}
              selectedDate={selectedDate}
              tasks={summary.weekly_tasks}
            />
            <RecentNotesSection notes={summary.recent_notes} />
            <UpcomingEventsSection events={summary.upcoming_events} />
            <TrackerSummarySection summary={summary.tracker_summary} />
          </div>
        ) : (
          <section className="rounded border border-neutral-300 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-600">
              Dashboard data could not be loaded.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
