"use client";

import Link from "next/link";

import type { DashboardSummary, DashboardWeeklyTask } from "./types";
import type { CalendarEvent } from "@/features/calendar/types";
import type { DailyTask } from "@/features/tasks/types";
import { DateSelector, EmptyState, SectionCard } from "@/components/ui";
import { formatDisplayDate, weekdayFromIsoDate } from "@/lib/date";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

function ManageLink({ href }: { href: string }) {
  return (
    <Link
      className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100"
      href={href}
    >
      Manage
    </Link>
  );
}

function StatCell({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="border-t border-neutral-200 px-4 py-3 first:border-t-0 sm:border-t-0">
      <p className="text-xs font-semibold uppercase tracking-normal text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-neutral-950">{value}</p>
      {detail ? <p className="mt-1 text-xs text-neutral-600">{detail}</p> : null}
    </div>
  );
}

export function TodayOverviewSection({
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
    <SectionCard
      action={
        <DateSelector
          className="min-w-48"
          label="Date"
          onChange={onDateChange}
          value={selectedDate}
        />
      }
      className="lg:col-span-2"
      eyebrow="Today Overview"
      title={formatDisplayDate(selectedDate)}
    >
      <div className="mt-5 grid border-y border-neutral-200 sm:grid-cols-4 sm:divide-x sm:divide-neutral-200">
        <StatCell label="Day" value={weekday} />
        <StatCell label="Daily Left" value={dailyOpen} />
        <StatCell label="Weekly Left" value={weeklyOpen} />
        <StatCell label="Upcoming" value={upcomingEvents} />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        {[
          ["Open Tasks", "/tasks"],
          ["Open Notes", "/notes"],
          ["Open Calendar", "/calendar"],
          ["Open Planning", "/planning"],
          ["Open Tracker", "/tracker"],
        ].map(([label, href], index) => (
          <Link
            className={
              index === 0
                ? "rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
                : "rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
            }
            href={href}
            key={href}
          >
            {label}
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}

export function DailyTasksSection({
  tasks,
  isSaving,
  onToggle,
}: {
  tasks: DailyTask[];
  isSaving: boolean;
  onToggle: (task: DailyTask) => void;
}) {
  return (
    <SectionCard action={<ManageLink href="/tasks" />} eyebrow="Today" title="Daily Tasks">
      <div className="mt-4 space-y-2">
        {tasks.length === 0 ? (
          <EmptyState message="No daily tasks for this date." />
        ) : (
          tasks.map((task) => (
            <label
              className="flex items-start gap-3 rounded-md border border-neutral-200 px-3 py-2 hover:border-neutral-300"
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
    </SectionCard>
  );
}

export function WeeklyTasksSection({
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
    <SectionCard action={<ManageLink href="/tasks" />} eyebrow={weekday} title="Weekly Tasks">
      <div className="mt-4 space-y-2">
        {tasks.length === 0 ? (
          <EmptyState message="No weekly tasks are scheduled for this date." />
        ) : (
          tasks.map((task) => (
            <label
              className="flex items-start gap-3 rounded-md border border-neutral-200 px-3 py-2 hover:border-neutral-300"
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
    </SectionCard>
  );
}

export function RecentNotesSection({
  notes,
}: {
  notes: DashboardSummary["recent_notes"];
}) {
  return (
    <SectionCard action={<ManageLink href="/notes" />} eyebrow="Notes" title="Recent Notes">
      <div className="mt-4 space-y-2">
        {notes.length === 0 ? (
          <EmptyState message="No recent notes yet." />
        ) : (
          notes.map((note) => (
            <div className="rounded-md border border-neutral-200 px-3 py-2" key={note.id}>
              <p className="text-sm font-medium text-neutral-950">{note.title}</p>
              <p className="mt-1 text-xs leading-5 text-neutral-600">
                {notePreview(note.content)}
              </p>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}

export function UpcomingEventsSection({ events }: { events: CalendarEvent[] }) {
  return (
    <SectionCard action={<ManageLink href="/calendar" />} eyebrow="Calendar" title="Upcoming Events">
      <div className="mt-4 space-y-2">
        {events.length === 0 ? (
          <EmptyState message="No upcoming events yet." />
        ) : (
          events.map((event) => (
            <div className="rounded-md border border-neutral-200 px-3 py-2" key={event.id}>
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
    </SectionCard>
  );
}

export function TrackerSummarySection({
  summary,
}: {
  summary: DashboardSummary["tracker_summary"];
}) {
  const hasTrackerData =
    summary.total_water_ml > 0 ||
    summary.activity_entries.length > 0 ||
    summary.total_calories_kcal > 0;

  return (
    <SectionCard action={<ManageLink href="/tracker" />} eyebrow="Tracker" title="Daily Tracking">
      <div className="mt-4 grid border-y border-neutral-200 sm:grid-cols-3 sm:divide-x sm:divide-neutral-200">
        <StatCell label="Water" value={`${summary.total_water_ml} ml`} />
        <StatCell
          detail={`${summary.total_activity_minutes} minutes`}
          label="Activity"
          value={`${summary.activity_count} entries`}
        />
        <StatCell label="Calories" value={`${summary.total_calories_kcal} kcal`} />
      </div>
      {!hasTrackerData ? (
        <p className="mt-4 text-sm text-neutral-600">
          No water, activity, or calorie entries for this date yet.
        </p>
      ) : null}
    </SectionCard>
  );
}

export function PlanningSummarySection({ selectedDate }: { selectedDate: string }) {
  return (
    <SectionCard action={<ManageLink href="/planning" />} eyebrow="Planning" title="Plan Review">
      <p className="mt-4 text-sm leading-6 text-neutral-700">
        Review the daily and weekly plan composed from tasks and calendar events for{" "}
        {formatDisplayDate(selectedDate)}.
      </p>
    </SectionCard>
  );
}
