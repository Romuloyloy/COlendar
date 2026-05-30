"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { getCategoryOverview } from "@/features/categories/api";
import type { CategoryOverview } from "@/features/categories/types";
import type { DashboardSummary, DashboardWeeklyTask } from "./types";
import type { DashboardWidgetConfig, DashboardWidgetProps } from "./widget-types";
import { calendarEventOccurrenceKey } from "@/features/calendar/event-identity";
import type { CalendarEvent } from "@/features/calendar/types";
import { getNotes } from "@/features/notes/api";
import type { Folder, Note } from "@/features/notes/types";
import type { DailyTask } from "@/features/tasks/types";
import { AppButton, DateNavigator, EmptyState, SectionCard } from "@/components/ui";
import {
  addDaysToIsoDate,
  formatDisplayDate,
  formatTime,
  weekdayFromIsoDate,
} from "@/lib/date";

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

function configuredCategoryId(
  widgetConfig?: DashboardWidgetConfig,
  sheetContextCategoryId?: number | null,
) {
  if (widgetConfig?.category_mode === "sheet_context") {
    return typeof sheetContextCategoryId === "number" ? sheetContextCategoryId : null;
  }
  if (widgetConfig?.category_mode === "none") {
    return null;
  }
  return typeof widgetConfig?.category_id === "number"
    ? widgetConfig.category_id
    : null;
}

function configuredTaskMode(widgetConfig?: DashboardWidgetConfig) {
  return widgetConfig?.task_mode === "open" ? "open" : "selected_date";
}

function configuredEventHorizon(widgetConfig?: DashboardWidgetConfig) {
  return widgetConfig?.event_horizon_days === 7 ||
    widgetConfig?.event_horizon_days === 14 ||
    widgetConfig?.event_horizon_days === 30
    ? widgetConfig.event_horizon_days
    : 14;
}

function noteFolderPath(folderId: number | null, folders: Folder[] = []) {
  if (folderId === null) {
    return "No folder";
  }
  const folder = folders.find((item) => item.id === folderId);
  if (!folder) {
    return "Missing folder";
  }
  const names = [folder.name];
  let parentId = folder.parent_folder_id;
  while (parentId !== null) {
    const parent = folders.find((item) => item.id === parentId);
    if (!parent) {
      break;
    }
    names.unshift(parent.name);
    parentId = parent.parent_folder_id;
  }
  return names.join(" / ");
}

function taskMetadata(task: DailyTask) {
  const meta = [];
  const plannedTime = formatTime(task.planned_time);
  const dueTime = formatTime(task.due_time);
  if (plannedTime) {
    meta.push(`Planned ${plannedTime}`);
  }
  if (task.due_date) {
    meta.push(
      dueTime
        ? `Due ${formatDisplayDate(task.due_date, { month: "short", day: "numeric" })} ${dueTime}`
        : `Due ${formatDisplayDate(task.due_date, { month: "short", day: "numeric" })}`,
    );
  }
  return meta.join(" - ");
}

function openTaskMetadata(task: DailyTask, selectedDate: string) {
  const meta = [
    `Planned ${formatDisplayDate(task.task_date, {
      month: "short",
      day: "numeric",
    })}`,
  ];
  const taskMeta = taskMetadata(task);
  if (taskMeta) {
    meta.push(taskMeta);
  }
  if (task.due_date && task.due_date < selectedDate) {
    meta.push("Overdue");
  }
  return meta.join(" - ");
}

function recurringTaskMetadata(task: DashboardWeeklyTask) {
  if (task.recurrence_type === "monthly_day") {
    return `Monthly on day ${task.day_of_month}`;
  }
  if (task.recurrence_type === "biweekly") {
    return `Every 2 weeks on ${task.weekdays.map((day) => WEEKDAYS[day]).join(", ")}`;
  }
  return `Weekly on ${task.weekdays.map((day) => WEEKDAYS[day]).join(", ")}`;
}

function ManageLink({ href }: { href: string }) {
  return (
    <Link
      className="app-button-secondary min-h-8 px-3 py-1.5 text-xs"
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
    <section className="sheet-compact-card">
      <div className="shrink-0">
        <h2 className="truncate text-sm font-semibold text-[#2c2925]">{title}</h2>
        {meta ? <p className="app-muted mt-1 truncate text-xs font-medium">{meta}</p> : null}
      </div>
      <div className="sheet-scroll mt-3 min-h-0 flex-1 overflow-auto">{children}</div>
      {actionHref ? (
        <Link
          className="app-button-secondary mt-3 min-h-8 shrink-0 px-2 py-1.5 text-center text-xs"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}

function CompactEmpty({ message }: { message: string }) {
  return <p className="sheet-compact-muted-box">{message}</p>;
}

function SheetTaskCompletionButton({
  checked,
  disabled,
  label,
  onToggle,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className={`sheet-task-complete ${
        checked ? "sheet-task-complete-on" : ""
      }`}
      disabled={disabled}
      onClick={onToggle}
      role="checkbox"
      type="button"
    >
      <span className="sheet-task-complete-mark">{checked ? "✓" : ""}</span>
    </button>
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
    <div className="border-t border-[#ded6ca] px-4 py-3 first:border-t-0 sm:border-t-0">
      <p className="text-xs font-semibold uppercase tracking-normal text-[#8b8176]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[#2c2925]">{value}</p>
      {detail ? <p className="app-muted mt-1 text-xs">{detail}</p> : null}
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
          <CompactMetric label="One-time" value={dailyOpen} />
          <CompactMetric label="Recurring" value={weeklyOpen} />
          <CompactMetric label="Events" value={upcomingEvents} />
          <CompactMetric label="Day" value={weekday} />
        </div>
      </CompactWidgetCard>
    );
  }

  return (
    <SectionCard
      action={
        <DateNavigator
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
      <div className="app-stat-grid mt-5 grid rounded-2xl border-y border-[#ded6ca] sm:grid-cols-4 sm:divide-x sm:divide-[#ded6ca]">
        <StatCell label="Day" value={weekday} />
        <StatCell label="One-time Left" value={dailyOpen} />
        <StatCell label="Recurring Left" value={weeklyOpen} />
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
          <AppButton
            variant="primary"
            onClick={openQuickAdd}
            type="button"
          >
            Quick Add
          </AppButton>
          <Link
            className="app-button-secondary"
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
        <AppButton
          variant="primary"
          onClick={openQuickAdd}
          type="button"
        >
          Quick Add
        </AppButton>
        {[
          ["Open Sheets", "/sheets"],
          ["Search", "/search"],
          ["Open Review", "/review"],
          ["Open Tasks", "/tasks"],
          ["Open Notes", "/notes"],
          ["Open Calendar", "/calendar"],
          ["Open Tracker", "/tracker"],
        ].map(([label, href]) => (
          <Link
            className="app-button-secondary"
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
  onPreviewDailyTask,
  widgetConfig,
  sheetContextCategoryId,
  renderMode = "normal",
}: DashboardWidgetProps) {
  const categoryId = configuredCategoryId(widgetConfig, sheetContextCategoryId);
  const taskMode = configuredTaskMode(widgetConfig);
  const sourceTasks =
    taskMode === "open" ? summary.open_daily_tasks : summary.daily_tasks;
  const tasks =
    categoryId === null
      ? sourceTasks
      : sourceTasks.filter((task) => task.category_id === categoryId);
  const openTasks = tasks.filter((task) => !task.is_completed);
  const title = configuredTitle(
    taskMode === "open" ? "Open Tasks" : "One-time Tasks",
    widgetConfig,
  );
  const hiddenTaskCount = Math.max(tasks.length - 5, 0);
  const metadataForTask =
    taskMode === "open"
      ? (task: DailyTask) => openTaskMetadata(task, summary.selected_date)
      : taskMetadata;

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
            <CompactEmpty message="No one-time tasks. Open Tasks to plan one." />
          ) : (
            tasks.slice(0, 5).map((task) => (
              <div className="sheet-compact-list-item flex min-w-0 items-start gap-2 text-sm" key={task.id}>
                <SheetTaskCompletionButton
                  checked={task.is_completed}
                  disabled={isSaving}
                  label={`${task.is_completed ? "Mark incomplete" : "Complete"} ${task.title}`}
                  onToggle={() => onToggleDailyTask(task)}
                />
                <button
                  className={`min-w-0 flex-1 truncate text-left ${
                    task.is_completed ? "text-[#8b8176] line-through" : "text-[#3b3732]"
                  }`}
                  onClick={() => onPreviewDailyTask?.(task)}
                  type="button"
                >
                  {task.title}
                  {metadataForTask(task) ? (
                    <span className="block truncate text-xs font-normal text-[#766f66]">
                      {metadataForTask(task)}
                    </span>
                  ) : null}
                </button>
              </div>
            ))
          )}
          {hiddenTaskCount > 0 ? (
            <p className="px-2 text-xs font-medium text-[#766f66]">
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
        metadataForTask={metadataForTask}
        onToggle={onToggleDailyTask}
        onPreview={onPreviewDailyTask}
        tasks={tasks}
      />
    </SectionCard>
  );
}

function DashboardTaskList({
  tasks,
  isSaving,
  metadataForTask,
  onToggle,
  onPreview,
}: {
  tasks: DailyTask[];
  isSaving: boolean;
  metadataForTask: (task: DailyTask) => string;
  onToggle: (task: DailyTask) => void;
  onPreview?: (task: DailyTask) => void;
}) {
  return (
    <div className="mt-4 space-y-2">
      {tasks.length === 0 ? (
        <EmptyState message="No one-time tasks for this date." />
      ) : (
        tasks.map((task) => (
          <div
            className="app-soft-row flex items-start gap-3 rounded-xl border border-[#ded6ca] px-3 py-2 hover:border-[#cbbfb0]"
            key={task.id}
          >
            <input
              checked={task.is_completed}
              className="mt-1"
              disabled={isSaving}
              onChange={() => onToggle(task)}
              type="checkbox"
            />
            <button
              className="min-w-0 text-left"
              onClick={() => onPreview?.(task)}
              type="button"
            >
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
              {metadataForTask(task) ? (
                <span className="mt-1 block text-xs font-medium text-neutral-600">
                  {metadataForTask(task)}
                </span>
              ) : null}
            </button>
          </div>
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
  onPreviewWeeklyTask,
  widgetConfig,
  sheetContextCategoryId,
  renderMode = "normal",
}: DashboardWidgetProps) {
  const weekday = WEEKDAYS[weekdayFromIsoDate(selectedDate)];
  const categoryId = configuredCategoryId(widgetConfig, sheetContextCategoryId);
  const tasks =
    categoryId === null
      ? summary.weekly_tasks
      : summary.weekly_tasks.filter((task) => task.category_id === categoryId);
  const openTasks = tasks.filter((task) => !task.is_completed);
  const title = configuredTitle("Recurring Tasks", widgetConfig);
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
            <CompactEmpty message="No recurring tasks for this date." />
          ) : (
            tasks.slice(0, 5).map((task) => (
              <div className="sheet-compact-list-item flex min-w-0 items-start gap-2 text-sm" key={task.id}>
                <SheetTaskCompletionButton
                  checked={task.is_completed}
                  disabled={isSaving}
                  label={`${task.is_completed ? "Mark incomplete" : "Complete"} ${task.title}`}
                  onToggle={() => onToggleWeeklyTask(task)}
                />
                <button
                  className={`min-w-0 flex-1 truncate text-left ${
                    task.is_completed ? "text-[#8b8176] line-through" : "text-[#3b3732]"
                  }`}
                  onClick={() => onPreviewWeeklyTask?.(task)}
                  type="button"
                >
                  {task.title}
                  <span className="block truncate text-xs font-normal text-[#766f66]">
                    {recurringTaskMetadata(task)}
                  </span>
                </button>
              </div>
            ))
          )}
          {hiddenTaskCount > 0 ? (
            <p className="px-2 text-xs font-medium text-[#766f66]">
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
          <EmptyState message="No recurring tasks are scheduled for this date." />
        ) : (
          tasks.map((task) => (
            <div
            className="app-soft-row flex items-start gap-3 rounded-xl border border-[#ded6ca] px-3 py-2 hover:border-[#cbbfb0]"
              key={task.id}
            >
              <input
                checked={task.is_completed}
                className="mt-1"
                disabled={isSaving}
                onChange={() => onToggleWeeklyTask(task)}
                type="checkbox"
              />
              <button
                className="min-w-0 text-left"
                onClick={() => onPreviewWeeklyTask?.(task)}
                type="button"
              >
                <span
                  className={`block text-sm font-medium ${
                    task.is_completed ? "text-neutral-500 line-through" : ""
                  }`}
                >
                  {task.title}
                </span>
                <span className="mt-1 block text-xs text-neutral-600">
                  {recurringTaskMetadata(task)}
                </span>
                {task.description ? (
                  <span className="mt-1 block text-xs leading-5 text-neutral-600">
                    {task.description}
                  </span>
                ) : null}
              </button>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}

export function RecentNotesWidget({
  onPreviewNote,
  noteFolders = [],
  summary,
  widgetConfig,
  sheetContextCategoryId,
  renderMode = "normal",
}: DashboardWidgetProps) {
  const categoryId = configuredCategoryId(widgetConfig, sheetContextCategoryId);
  const folderId =
    typeof widgetConfig?.folder_id === "number" ? widgetConfig.folder_id : null;
  const includeDescendants = widgetConfig?.include_descendants !== false;
  const [folderNotes, setFolderNotes] = useState<Note[] | null>(null);
  const [folderError, setFolderError] = useState<string | null>(null);
  const sourceNotes =
    folderId === null
      ? summary.recent_notes
      : folderNotes ?? [];
  const notes =
    categoryId === null
      ? sourceNotes
      : sourceNotes.filter((note) => note.category_id === categoryId);
  const title = configuredTitle(
    folderId === null
      ? "Recent Notes"
      : noteFolderPath(folderId, noteFolders),
    widgetConfig,
  );

  useEffect(() => {
    if (folderId === null) {
      setFolderNotes(null);
      setFolderError(null);
      return;
    }
    let isMounted = true;
    getNotes({ folderId, includeDescendants })
      .then((data) => {
        if (isMounted) {
          setFolderNotes(data);
          setFolderError(null);
        }
      })
      .catch((caught) => {
        if (isMounted) {
          setFolderNotes([]);
          setFolderError(caught instanceof Error ? caught.message : "Could not load notes.");
        }
      });
    return () => {
      isMounted = false;
    };
  }, [folderId, includeDescendants]);

  if (renderMode === "compact") {
    return (
      <CompactWidgetCard
        actionHref="/notes"
        actionLabel="Open notes"
        title={title}
        meta={`${notes.length} recent`}
      >
        <div className="space-y-2">
          {folderError ? (
            <CompactEmpty message={folderError} />
          ) : notes.length === 0 ? (
            <CompactEmpty message="No recent notes." />
          ) : (
            notes.slice(0, 5).map((note) => (
              <button
                className="sheet-compact-list-item block w-full min-w-0 text-left"
                key={note.id}
                onClick={() => onPreviewNote?.(note)}
                type="button"
              >
                <p className="truncate text-sm font-medium text-[#3b3732]">
                  {note.title}
                </p>
                <p className="truncate text-xs text-[#766f66]">
                  {folderId === null
                    ? notePreview(note.content)
                    : `${noteFolderPath(note.folder_id, noteFolders)} / ${notePreview(note.content)}`}
                </p>
              </button>
            ))
          )}
          {notes.length > 5 ? (
            <p className="px-2 text-xs font-medium text-[#766f66]">
              +{notes.length - 5} more
            </p>
          ) : null}
        </div>
      </CompactWidgetCard>
    );
  }

  return (
    <SectionCard action={<ManageLink href="/notes" />} eyebrow="Notes" title={title}>
      <div className="mt-4 space-y-2">
        {folderError ? (
          <EmptyState message={folderError} />
        ) : notes.length === 0 ? (
          <EmptyState message="No recent notes yet." />
        ) : (
          notes.map((note) => (
            <div className="rounded-md border border-neutral-200 px-3 py-2" key={note.id}>
              <p className="text-sm font-medium text-neutral-950">{note.title}</p>
              <p className="mt-1 text-xs leading-5 text-neutral-600">
                {notePreview(note.content)}
              </p>
              {folderId !== null ? (
                <p className="mt-1 text-xs font-medium text-neutral-600">
                  {noteFolderPath(note.folder_id, noteFolders)}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}

export function UpcomingEventsWidget({
  summary,
  onPreviewEvent,
  widgetConfig,
  sheetContextCategoryId,
  renderMode = "normal",
}: DashboardWidgetProps) {
  const categoryId = configuredCategoryId(widgetConfig, sheetContextCategoryId);
  const horizonDays = configuredEventHorizon(widgetConfig);
  const horizonEnd = addDaysToIsoDate(summary.selected_date, horizonDays - 1);
  const events =
    categoryId === null
      ? summary.upcoming_events
      : summary.upcoming_events.filter((event) => event.category_id === categoryId);
  const horizonEvents = events.filter((event) => event.event_date <= horizonEnd);

  if (renderMode === "compact") {
    return (
      <CompactWidgetCard
        actionHref="/calendar"
        actionLabel="Open calendar"
        title="Upcoming Events"
        meta={`${horizonEvents.length} in ${horizonDays} days`}
      >
        <div className="space-y-2">
          {horizonEvents.length === 0 ? (
            <CompactEmpty message="No upcoming events. Open Calendar to add one." />
          ) : (
            horizonEvents.slice(0, 4).map((event) => (
              <button
                className="sheet-compact-list-item block w-full min-w-0 text-left"
                key={calendarEventOccurrenceKey(event)}
                onClick={() => onPreviewEvent?.(event)}
                type="button"
              >
                <p className="truncate text-sm font-medium text-[#3b3732]">
                  {event.title}
                </p>
                <p className="truncate text-xs font-medium text-[#766f66]">
                  {formatDisplayDate(event.event_date)} - {formatEventTime(event)}
                </p>
              </button>
            ))
          )}
          {horizonEvents.length > 4 ? (
            <p className="px-2 text-xs font-medium text-[#766f66]">
              +{horizonEvents.length - 4} more
            </p>
          ) : null}
        </div>
      </CompactWidgetCard>
    );
  }

  return (
    <SectionCard action={<ManageLink href="/calendar" />} eyebrow="Calendar" title="Upcoming Events">
      <div className="mt-4 space-y-2">
        {horizonEvents.length === 0 ? (
          <EmptyState message="No upcoming events yet." />
        ) : (
          horizonEvents.map((event) => (
            <button
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-left hover:border-neutral-300"
              key={calendarEventOccurrenceKey(event)}
              onClick={() => onPreviewEvent?.(event)}
              type="button"
            >
              <p className="text-sm font-medium text-neutral-950">{event.title}</p>
              <p className="mt-1 text-xs text-neutral-600">
                {formatDisplayDate(event.event_date)} - {formatEventTime(event)}
              </p>
              {event.location ? (
                <p className="mt-1 text-xs text-neutral-600">{event.location}</p>
              ) : null}
            </button>
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
      <div className="app-stat-grid mt-4 grid rounded-2xl border-y border-[#ded6ca] sm:grid-cols-3 sm:divide-x sm:divide-[#ded6ca]">
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

export function CategoryOverviewWidget({
  selectedDate,
  taskCategories = [],
  onPreviewDailyTask,
  onPreviewEvent,
  widgetConfig,
  sheetContextCategoryId,
  renderMode = "normal",
}: DashboardWidgetProps) {
  const categoryId = configuredCategoryId(widgetConfig, sheetContextCategoryId);
  const configuredCategory = taskCategories.find(
    (category) => category.id === categoryId,
  );
  const title = configuredTitle(
    configuredCategory ? `${configuredCategory.name} Overview` : "Category Overview",
    widgetConfig,
  );
  const [overview, setOverview] = useState<CategoryOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categoryId === null) {
      setOverview(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getCategoryOverview(categoryId, selectedDate)
      .then((data) => {
        if (isMounted) {
          setOverview(data);
        }
      })
      .catch((caught) => {
        if (isMounted) {
          setOverview(null);
          setError(caught instanceof Error ? caught.message : "Could not load category.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [categoryId, selectedDate]);

  if (categoryId === null) {
    return (
      <CompactWidgetCard
        actionHref="/categories"
        actionLabel="Open categories"
        title={title}
      >
        <CompactEmpty message="Choose a category in slot settings." />
      </CompactWidgetCard>
    );
  }

  if (isLoading) {
    return (
      <CompactWidgetCard title={title}>
        <CompactEmpty message="Loading category..." />
      </CompactWidgetCard>
    );
  }

  if (error || overview === null) {
    return (
      <CompactWidgetCard title={title}>
        <CompactEmpty message={error ?? "Category unavailable."} />
      </CompactWidgetCard>
    );
  }

  const openDailyTasks = overview.daily_tasks.length;
  const openRecurringTasks = overview.recurring_tasks.filter(
    (task) => !task.is_completed,
  ).length;

  if (renderMode === "compact") {
    return (
      <CompactWidgetCard
        actionHref="/categories"
        actionLabel="Open categories"
        title={title}
        meta={formatDisplayDate(selectedDate)}
      >
        <div className="grid grid-cols-2 gap-2 text-sm">
          <CompactMetric label="One-time" value={openDailyTasks} />
          <CompactMetric label="Recurring" value={openRecurringTasks} />
          <CompactMetric label="Events" value={overview.upcoming_events.length} />
          <CompactMetric label="Notes" value={overview.recent_notes.length} />
        </div>
        <div className="mt-3 space-y-2">
          {overview.daily_tasks.slice(0, 2).map((task) => (
            <button
              className="sheet-compact-list-item block w-full truncate text-left text-sm"
              key={`daily-${task.id}`}
              onClick={() => onPreviewDailyTask?.(task)}
              type="button"
            >
              {task.title}
            </button>
          ))}
          {overview.upcoming_events.slice(0, 2).map((event) => (
            <button
              className="sheet-compact-list-item block w-full truncate text-left text-sm"
              key={`event-${calendarEventOccurrenceKey(event)}`}
              onClick={() => onPreviewEvent?.(event)}
              type="button"
            >
              {event.title}
            </button>
          ))}
          {overview.daily_tasks.length === 0 &&
          overview.upcoming_events.length === 0 &&
          overview.recent_notes.length === 0 &&
          overview.recurring_tasks.length === 0 ? (
            <CompactEmpty message="Nothing active in this category." />
          ) : null}
        </div>
      </CompactWidgetCard>
    );
  }

  return (
    <SectionCard
      action={<ManageLink href="/categories" />}
      eyebrow={overview.category.name}
      title={title}
    >
      <div className="app-stat-grid mt-4 grid rounded-2xl border-y border-[#ded6ca] sm:grid-cols-4 sm:divide-x sm:divide-[#ded6ca]">
        <StatCell label="One-time" value={openDailyTasks} />
        <StatCell label="Recurring" value={openRecurringTasks} />
        <StatCell label="Events" value={overview.upcoming_events.length} />
        <StatCell label="Notes" value={overview.recent_notes.length} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {overview.daily_tasks.slice(0, 3).map((task) => (
          <p className="app-soft-row rounded-xl border border-[#ded6ca] px-3 py-2 text-sm" key={`daily-${task.id}`}>
            {task.title}
          </p>
        ))}
        {overview.upcoming_events.slice(0, 3).map((event) => (
          <p className="app-soft-row rounded-xl border border-[#ded6ca] px-3 py-2 text-sm" key={`event-${calendarEventOccurrenceKey(event)}`}>
            {event.title}
          </p>
        ))}
      </div>
    </SectionCard>
  );
}

export function ReviewSummaryWidget({
  selectedDate,
  summary,
  renderMode = "normal",
}: DashboardWidgetProps) {
  const completedDailyTasks =
    summary.counts.daily_task_count - summary.counts.incomplete_daily_task_count;
  const completedRecurringTasks =
    summary.counts.weekly_task_count - summary.counts.incomplete_weekly_task_count;

  if (renderMode === "compact") {
    return (
      <CompactWidgetCard
        actionHref="/review"
        actionLabel="Open review"
        title="Review Summary"
        meta={formatDisplayDate(selectedDate)}
      >
        <div className="grid grid-cols-2 gap-2 text-sm">
          <CompactMetric
            label="One-time"
            value={`${completedDailyTasks}/${summary.counts.daily_task_count}`}
          />
          <CompactMetric
            label="Recurring"
            value={`${completedRecurringTasks}/${summary.counts.weekly_task_count}`}
          />
          <CompactMetric label="Events" value={summary.counts.upcoming_event_count} />
          <CompactMetric
            label="Water"
            value={`${summary.tracker_summary.total_water_ml} ml`}
          />
        </div>
      </CompactWidgetCard>
    );
  }

  return (
    <SectionCard
      action={<ManageLink href="/review" />}
      eyebrow="Review"
      title="Review Summary"
    >
      <div className="app-stat-grid mt-4 grid rounded-2xl border-y border-[#ded6ca] sm:grid-cols-4 sm:divide-x sm:divide-[#ded6ca]">
        <StatCell label="Date" value={formatDisplayDate(selectedDate, { month: "short", day: "numeric" })} />
        <StatCell
          label="One-time"
          value={`${completedDailyTasks}/${summary.counts.daily_task_count}`}
          detail="completed"
        />
        <StatCell
          label="Recurring"
          value={`${completedRecurringTasks}/${summary.counts.weekly_task_count}`}
          detail="completed"
        />
        <StatCell label="Events" value={summary.counts.upcoming_event_count} />
      </div>
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
    <div className="app-soft-metric min-w-0 rounded-xl border border-[#ded6ca]/80 px-2 py-2">
      <p className="truncate text-xs font-semibold uppercase tracking-normal text-[#8b8176]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-[#2c2925]">{value}</p>
    </div>
  );
}
