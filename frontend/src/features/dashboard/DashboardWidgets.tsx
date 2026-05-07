"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { DashboardSummary, DashboardWeeklyTask } from "./types";
import type { DashboardWidgetConfig, DashboardWidgetProps } from "./widget-types";
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

function configuredTitle(
  defaultTitle: string,
  widgetConfig?: DashboardWidgetConfig,
) {
  return widgetConfig?.title_override?.trim() || defaultTitle;
}

function configuredCategoryId(widgetConfig?: DashboardWidgetConfig) {
  return typeof widgetConfig?.category_id === "number"
    ? widgetConfig.category_id
    : null;
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

function CompactWidgetCard({
  title,
  meta,
  actionHref,
  actionLabel = "Open",
  children,
}: {
  title: string;
  meta?: string;
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-md bg-white p-3">
      <div className="shrink-0">
        <h2 className="truncate text-sm font-semibold text-neutral-950">{title}</h2>
        {meta ? <p className="mt-1 text-xs text-neutral-600">{meta}</p> : null}
      </div>
      <div className="mt-3 min-h-0 flex-1 overflow-auto">{children}</div>
      {actionHref ? (
        <Link
          className="mt-3 shrink-0 rounded-md border border-neutral-300 px-2 py-1.5 text-center text-xs font-semibold text-neutral-800 hover:bg-neutral-100"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}

function CompactEmpty({ message }: { message: string }) {
  return <p className="text-sm text-neutral-500">{message}</p>;
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

export function TodayOverviewWidget({
  selectedDate,
  summary,
  onDateChange,
  renderMode = "normal",
}: DashboardWidgetProps) {
  const weekday = WEEKDAYS[weekdayFromIsoDate(selectedDate)];
  const dailyOpen = summary.counts.incomplete_daily_task_count;
  const weeklyOpen = summary.counts.incomplete_weekly_task_count;
  const upcomingEvents = summary.counts.upcoming_event_count;

  if (renderMode === "compact") {
    return (
      <CompactWidgetCard title={formatDisplayDate(selectedDate)} meta={weekday}>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <CompactMetric label="Daily" value={dailyOpen} />
          <CompactMetric label="Weekly" value={weeklyOpen} />
          <CompactMetric label="Events" value={upcomingEvents} />
          <CompactMetric label="Day" value={weekday} />
        </div>
      </CompactWidgetCard>
    );
  }

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
    </SectionCard>
  );
}

export function QuickActionsWidget({
  renderMode = "normal",
}: DashboardWidgetProps) {
  function openQuickAdd() {
    window.dispatchEvent(new Event("quick-add:open"));
  }

  if (renderMode === "compact") {
    return (
      <CompactWidgetCard title="Quick Actions">
        <div className="grid gap-2">
          <button
            className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            onClick={openQuickAdd}
            type="button"
          >
            Quick Add
          </button>
          <Link
            className="rounded-md border border-neutral-300 px-3 py-2 text-center text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
            href="/search"
          >
            Search
          </Link>
        </div>
      </CompactWidgetCard>
    );
  }

  return (
    <SectionCard eyebrow="Shortcuts" title="Quick Actions">
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          onClick={openQuickAdd}
          type="button"
        >
          Quick Add
        </button>
        {[
          ["Search", "/search"],
          ["Open Tasks", "/tasks"],
          ["Open Notes", "/notes"],
          ["Open Calendar", "/calendar"],
          ["Open Planning", "/planning"],
          ["Open Tracker", "/tracker"],
        ].map(([label, href]) => (
          <Link
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
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

export function DailyTasksWidget({
  summary,
  isSaving,
  onToggleDailyTask,
  widgetConfig,
  renderMode = "normal",
}: DashboardWidgetProps) {
  const categoryId = configuredCategoryId(widgetConfig);
  const tasks =
    categoryId === null
      ? summary.daily_tasks
      : summary.daily_tasks.filter((task) => task.category_id === categoryId);
  const openTasks = tasks.filter((task) => !task.is_completed);
  const title = configuredTitle("Daily Tasks", widgetConfig);
  const hiddenTaskCount = Math.max(tasks.length - 5, 0);

  if (renderMode === "compact") {
    return (
      <CompactWidgetCard
        actionHref="/tasks"
        actionLabel="Open tasks"
        title={title}
        meta={`${openTasks.length} open of ${tasks.length}`}
      >
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <CompactEmpty message="No daily tasks." />
          ) : (
            tasks.slice(0, 5).map((task) => (
              <label className="flex min-w-0 items-start gap-2 text-sm" key={task.id}>
                <input
                  checked={task.is_completed}
                  className="mt-1"
                  disabled={isSaving}
                  onChange={() => onToggleDailyTask(task)}
                  type="checkbox"
                />
                <span
                  className={`min-w-0 flex-1 truncate ${
                    task.is_completed ? "text-neutral-500 line-through" : ""
                  }`}
                >
                  {task.title}
                </span>
              </label>
            ))
          )}
          {hiddenTaskCount > 0 ? (
            <p className="text-xs font-medium text-neutral-600">
              +{hiddenTaskCount} more
            </p>
          ) : null}
        </div>
      </CompactWidgetCard>
    );
  }

  return (
    <SectionCard action={<ManageLink href="/tasks" />} eyebrow="Today" title={title}>
      <DashboardTaskList
        isSaving={isSaving}
        onToggle={onToggleDailyTask}
        tasks={tasks}
      />
    </SectionCard>
  );
}

function DashboardTaskList({
  tasks,
  isSaving,
  onToggle,
}: {
  tasks: DailyTask[];
  isSaving: boolean;
  onToggle: (task: DailyTask) => void;
}) {
  return (
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
  );
}

export function WeeklyTasksWidget({
  selectedDate,
  summary,
  isSaving,
  onToggleWeeklyTask,
  widgetConfig,
  renderMode = "normal",
}: DashboardWidgetProps) {
  const weekday = WEEKDAYS[weekdayFromIsoDate(selectedDate)];
  const categoryId = configuredCategoryId(widgetConfig);
  const tasks =
    categoryId === null
      ? summary.weekly_tasks
      : summary.weekly_tasks.filter((task) => task.category_id === categoryId);
  const openTasks = tasks.filter((task) => !task.is_completed);
  const title = configuredTitle("Weekly Tasks", widgetConfig);
  const hiddenTaskCount = Math.max(tasks.length - 5, 0);

  if (renderMode === "compact") {
    return (
      <CompactWidgetCard
        actionHref="/tasks"
        actionLabel="Open tasks"
        title={title}
        meta={`${openTasks.length} open of ${tasks.length} for ${weekday}`}
      >
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <CompactEmpty message="No weekly tasks." />
          ) : (
            tasks.slice(0, 5).map((task) => (
              <label className="flex min-w-0 items-start gap-2 text-sm" key={task.id}>
                <input
                  checked={task.is_completed}
                  className="mt-1"
                  disabled={isSaving}
                  onChange={() => onToggleWeeklyTask(task)}
                  type="checkbox"
                />
                <span
                  className={`min-w-0 flex-1 truncate ${
                    task.is_completed ? "text-neutral-500 line-through" : ""
                  }`}
                >
                  {task.title}
                </span>
              </label>
            ))
          )}
          {hiddenTaskCount > 0 ? (
            <p className="text-xs font-medium text-neutral-600">
              +{hiddenTaskCount} more
            </p>
          ) : null}
        </div>
      </CompactWidgetCard>
    );
  }

  return (
    <SectionCard action={<ManageLink href="/tasks" />} eyebrow={weekday} title={title}>
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
                onChange={() => onToggleWeeklyTask(task)}
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

export function RecentNotesWidget({
  summary,
  renderMode = "normal",
}: DashboardWidgetProps) {
  if (renderMode === "compact") {
    return (
      <CompactWidgetCard
        actionHref="/notes"
        actionLabel="Open notes"
        title="Recent Notes"
        meta={`${summary.recent_notes.length} recent`}
      >
        <div className="space-y-2">
          {summary.recent_notes.length === 0 ? (
            <CompactEmpty message="No recent notes." />
          ) : (
            summary.recent_notes.slice(0, 5).map((note) => (
              <div className="min-w-0" key={note.id}>
                <p className="truncate text-sm font-medium text-neutral-900">
                  {note.title}
                </p>
                <p className="truncate text-xs text-neutral-600">
                  {notePreview(note.content)}
                </p>
              </div>
            ))
          )}
          {summary.recent_notes.length > 5 ? (
            <p className="text-xs font-medium text-neutral-600">
              +{summary.recent_notes.length - 5} more
            </p>
          ) : null}
        </div>
      </CompactWidgetCard>
    );
  }

  return (
    <SectionCard action={<ManageLink href="/notes" />} eyebrow="Notes" title="Recent Notes">
      <div className="mt-4 space-y-2">
        {summary.recent_notes.length === 0 ? (
          <EmptyState message="No recent notes yet." />
        ) : (
          summary.recent_notes.map((note) => (
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

export function UpcomingEventsWidget({
  summary,
  renderMode = "normal",
}: DashboardWidgetProps) {
  if (renderMode === "compact") {
    return (
      <CompactWidgetCard
        actionHref="/calendar"
        actionLabel="Open calendar"
        title="Upcoming Events"
        meta={`${summary.upcoming_events.length} upcoming`}
      >
        <div className="space-y-2">
          {summary.upcoming_events.length === 0 ? (
            <CompactEmpty message="No upcoming events." />
          ) : (
            summary.upcoming_events.slice(0, 4).map((event) => (
              <div className="min-w-0" key={event.id}>
                <p className="truncate text-sm font-medium text-neutral-900">
                  {event.title}
                </p>
                <p className="text-xs text-neutral-600">
                  {formatDisplayDate(event.event_date)}
                </p>
              </div>
            ))
          )}
          {summary.upcoming_events.length > 4 ? (
            <p className="text-xs font-medium text-neutral-600">
              +{summary.upcoming_events.length - 4} more
            </p>
          ) : null}
        </div>
      </CompactWidgetCard>
    );
  }

  return (
    <SectionCard action={<ManageLink href="/calendar" />} eyebrow="Calendar" title="Upcoming Events">
      <div className="mt-4 space-y-2">
        {summary.upcoming_events.length === 0 ? (
          <EmptyState message="No upcoming events yet." />
        ) : (
          summary.upcoming_events.map((event) => (
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

export function TrackerSummaryWidget({
  summary,
  renderMode = "normal",
}: DashboardWidgetProps) {
  const trackerSummary = summary.tracker_summary;
  const hasTrackerData =
    trackerSummary.total_water_ml > 0 ||
    trackerSummary.activity_entries.length > 0 ||
    trackerSummary.total_calories_kcal > 0;

  if (renderMode === "compact") {
    return (
      <CompactWidgetCard
        actionHref="/tracker"
        actionLabel="Open tracker"
        title="Daily Tracking"
        meta={hasTrackerData ? undefined : "No entries yet"}
      >
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <CompactMetric label="Water" value={`${trackerSummary.total_water_ml} ml`} />
          <CompactMetric label="Move" value={trackerSummary.activity_count} />
          <CompactMetric label="Kcal" value={trackerSummary.total_calories_kcal} />
        </div>
      </CompactWidgetCard>
    );
  }

  return (
    <SectionCard action={<ManageLink href="/tracker" />} eyebrow="Tracker" title="Daily Tracking">
      <div className="mt-4 grid border-y border-neutral-200 sm:grid-cols-3 sm:divide-x sm:divide-neutral-200">
        <StatCell label="Water" value={`${trackerSummary.total_water_ml} ml`} />
        <StatCell
          detail={`${trackerSummary.total_activity_minutes} minutes`}
          label="Activity"
          value={`${trackerSummary.activity_count} entries`}
        />
        <StatCell label="Calories" value={`${trackerSummary.total_calories_kcal} kcal`} />
      </div>
      {!hasTrackerData ? (
        <p className="mt-4 text-sm text-neutral-600">
          No water, activity, or calorie entries for this date yet.
        </p>
      ) : null}
    </SectionCard>
  );
}

export function PlanningSummaryWidget({
  selectedDate,
  renderMode = "normal",
}: DashboardWidgetProps) {
  if (renderMode === "compact") {
    return (
      <CompactWidgetCard title="Plan Review">
        <p className="text-sm leading-6 text-neutral-700">
          Plan for {formatDisplayDate(selectedDate)}.
        </p>
        <ManageLink href="/planning" />
      </CompactWidgetCard>
    );
  }

  return (
    <SectionCard action={<ManageLink href="/planning" />} eyebrow="Planning" title="Plan Review">
      <p className="mt-4 text-sm leading-6 text-neutral-700">
        Review the daily and weekly plan composed from tasks and calendar events for{" "}
        {formatDisplayDate(selectedDate)}.
      </p>
    </SectionCard>
  );
}

function CompactMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-2">
      <p className="truncate text-xs font-semibold uppercase tracking-normal text-neutral-500">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-neutral-950">{value}</p>
    </div>
  );
}
