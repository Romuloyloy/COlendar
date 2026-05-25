"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { getReviewSummary } from "./api";
import type {
  ReviewCategorySummary,
  ReviewSummary,
  ReviewTrackerTotals,
  ReviewWeeklyDaySummary,
} from "./types";
import type { CalendarEvent } from "@/features/calendar/types";
import type { DashboardWeeklyTask } from "@/features/dashboard/types";
import type { Note } from "@/features/notes/types";
import type { DailyTask } from "@/features/tasks/types";
import {
  DateNavigator,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
} from "@/components/ui";
import { formatDisplayDate, formatTime, todayIsoDate } from "@/lib/date";

const SHORT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
};

export function ReviewPage() {
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedDateLabel = useMemo(
    () => formatDisplayDate(selectedDate),
    [selectedDate],
  );

  function loadReview(date: string) {
    setIsLoading(true);
    setError(null);
    getReviewSummary(date)
      .then(setSummary)
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadReview(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    function refreshAfterQuickAdd() {
      loadReview(selectedDate);
    }

    window.addEventListener("quick-add:created", refreshAfterQuickAdd);
    return () =>
      window.removeEventListener("quick-add:created", refreshAfterQuickAdd);
  }, [selectedDate]);

  return (
    <main className="app-page">
      <section className="app-container">
        <div className="mb-6">
          <PageHeader
            actions={
              <DateNavigator
                className="min-w-64"
                label="Review date"
                onChange={setSelectedDate}
                value={selectedDate}
              />
            }
            description="A read-focused day and week review composed from tasks, calendar, notes, categories, and tracker data."
            eyebrow="Workspace"
            title="Review Center"
          >
            <p className="app-muted mt-1 text-xs font-medium">
              {selectedDateLabel}
            </p>
          </PageHeader>
        </div>

        {error ? <ErrorState message={error} /> : null}
        {isLoading ? (
          <SectionCard>
            <LoadingState message="Loading review..." />
          </SectionCard>
        ) : null}
        {!isLoading && !error && summary ? (
          <div className="grid gap-5">
            <DailyReview summary={summary} />
            <WeeklyReview summary={summary} />
            <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
              <CategorySummary categories={summary.categories} />
              <TrackerSummary totals={summary.weekly.totals.tracker} />
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function DailyReview({ summary }: { summary: ReviewSummary }) {
  const daily = summary.daily;
  return (
    <SectionCard
      action={<ModuleLinks modules={["tasks", "calendar", "notes", "tracker"]} />}
      eyebrow="Daily Review"
      title={formatDisplayDate(summary.selected_date)}
    >
      <div className="app-stat-grid mt-5 grid rounded-2xl border-y border-[#ded6ca] sm:grid-cols-4 sm:divide-x sm:divide-[#ded6ca]">
        <StatCell
          label="One-time"
          value={`${daily.counts.completed_daily_tasks}/${daily.daily_tasks.length}`}
          detail="completed"
        />
        <StatCell
          label="Recurring"
          value={`${daily.counts.completed_recurring_tasks}/${daily.recurring_tasks.length}`}
          detail="completed"
        />
        <StatCell label="Events" value={daily.calendar_events.length} />
        <StatCell label="Notes" value={daily.notes.length} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-4">
        <DailyTaskList tasks={daily.daily_tasks} />
        <RecurringTaskList tasks={daily.recurring_tasks} />
        <EventList events={daily.calendar_events} />
        <NoteList notes={daily.notes} />
      </div>
    </SectionCard>
  );
}

function WeeklyReview({ summary }: { summary: ReviewSummary }) {
  const totals = summary.weekly.totals;
  return (
    <SectionCard
      action={<ModuleLinks modules={["tasks", "calendar"]} />}
      eyebrow="Weekly Review"
      title={`${formatDisplayDate(summary.week_start, SHORT_DATE_FORMAT)} - ${formatDisplayDate(summary.week_end, SHORT_DATE_FORMAT)}`}
    >
      <div className="app-stat-grid mt-5 grid rounded-2xl border-y border-[#ded6ca] sm:grid-cols-5 sm:divide-x sm:divide-[#ded6ca]">
        <StatCell
          label="One-time"
          value={`${totals.completed_daily_tasks}/${totals.completed_daily_tasks + totals.incomplete_daily_tasks}`}
          detail="completed"
        />
        <StatCell
          label="Recurring"
          value={`${totals.completed_recurring_tasks}/${totals.completed_recurring_tasks + totals.incomplete_recurring_tasks}`}
          detail="completed"
        />
        <StatCell label="Events" value={totals.event_count} />
        <StatCell label="Notes" value={totals.note_count} />
        <StatCell label="Activity" value={totals.tracker.activity_count} />
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-7">
        {summary.weekly.days.map((day) => (
          <WeeklyDayCard day={day} key={day.date} />
        ))}
      </div>
    </SectionCard>
  );
}

function CategorySummary({
  categories,
}: {
  categories: ReviewCategorySummary[];
}) {
  return (
    <SectionCard
      action={<ModuleLinks modules={["categories"]} />}
      eyebrow="Category Summary"
      title="Week by Category"
    >
      <p className="app-muted mt-3 text-sm leading-6">
        Shared categories summarize tasks, recurring occurrences, notes, and events.
        Tracker data stays category-free.
      </p>
      <div className="mt-4 space-y-2">
        {categories.length === 0 ? (
          <EmptyState message="No active categories yet." />
        ) : (
          categories.map((category) => (
            <div
              className="app-soft-row rounded-xl border border-[#ded6ca] px-3 py-3"
              key={category.category.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#2c2925]">
                    {category.category.name}
                  </p>
                  <p className="app-muted mt-1 text-xs">
                    Tasks {category.daily_task_count} / Recurring{" "}
                    {category.recurring_task_occurrence_count} / Notes{" "}
                    {category.note_count} / Events {category.event_count}
                  </p>
                </div>
                {category.category.color ? (
                  <span
                    className="size-3 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: category.category.color }}
                  />
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}

function TrackerSummary({ totals }: { totals: ReviewTrackerTotals }) {
  return (
    <SectionCard
      action={<ModuleLinks modules={["tracker"]} />}
      eyebrow="Tracker Summary"
      title="Week Totals"
    >
      <div className="app-stat-grid mt-4 grid rounded-2xl border-y border-[#ded6ca] sm:grid-cols-2 sm:divide-x sm:divide-[#ded6ca]">
        <StatCell label="Water" value={`${totals.total_water_ml} ml`} />
        <StatCell label="Calories" value={`${totals.total_calories_kcal} kcal`} />
      </div>
      <div className="app-stat-grid mt-3 grid rounded-2xl border-y border-[#ded6ca] sm:grid-cols-2 sm:divide-x sm:divide-[#ded6ca]">
        <StatCell label="Activity" value={totals.activity_count} />
        <StatCell label="Minutes" value={totals.total_activity_minutes} />
      </div>
      <p className="app-muted mt-4 text-sm leading-6">
        Tracker totals are shown for the week and are not grouped by category.
      </p>
    </SectionCard>
  );
}

function WeeklyDayCard({ day }: { day: ReviewWeeklyDaySummary }) {
  const taskTotal = day.completed_daily_tasks + day.incomplete_daily_tasks;
  const recurringTotal =
    day.completed_recurring_tasks + day.incomplete_recurring_tasks;
  return (
    <section className="rounded-xl border border-[#ded6ca] bg-[var(--color-surface)] px-3 py-3">
      <h3 className="text-sm font-semibold text-[#2c2925]">
        {formatDisplayDate(day.date, { weekday: "short", day: "numeric" })}
      </h3>
      <dl className="mt-3 space-y-1.5 text-xs text-[#766f66]">
        <MetricLine label="Tasks" value={`${day.completed_daily_tasks}/${taskTotal}`} />
        <MetricLine
          label="Recurring"
          value={`${day.completed_recurring_tasks}/${recurringTotal}`}
        />
        <MetricLine label="Events" value={day.event_count} />
        <MetricLine label="Notes" value={day.note_count} />
        <MetricLine label="Water" value={`${day.tracker.total_water_ml} ml`} />
      </dl>
    </section>
  );
}

function DailyTaskList({ tasks }: { tasks: DailyTask[] }) {
  return (
    <ReviewList title="One-time Tasks" href="/tasks">
      {tasks.length === 0 ? (
        <EmptyState message="No one-time tasks for this date." />
      ) : (
        tasks.slice(0, 5).map((task) => (
          <ListRow
            key={task.id}
            title={task.title}
            meta={[
              task.is_completed ? "Completed" : "Open",
              formatTime(task.planned_time)
                ? `Planned ${formatTime(task.planned_time)}`
                : null,
            ]
              .filter(Boolean)
              .join(" / ")}
          />
        ))
      )}
    </ReviewList>
  );
}

function RecurringTaskList({ tasks }: { tasks: DashboardWeeklyTask[] }) {
  return (
    <ReviewList title="Recurring Tasks" href="/tasks">
      {tasks.length === 0 ? (
        <EmptyState message="No recurring tasks for this date." />
      ) : (
        tasks.slice(0, 5).map((task) => (
          <ListRow
            key={task.id}
            title={task.title}
            meta={task.is_completed ? "Completed occurrence" : "Open occurrence"}
          />
        ))
      )}
    </ReviewList>
  );
}

function EventList({ events }: { events: CalendarEvent[] }) {
  return (
    <ReviewList title="Calendar Events" href="/calendar">
      {events.length === 0 ? (
        <EmptyState message="No calendar events for this date." />
      ) : (
        events.slice(0, 5).map((event) => (
          <ListRow
            key={`${event.id}-${event.event_date}`}
            title={event.title}
            meta={event.start_time ? event.start_time.slice(0, 5) : "All day"}
          />
        ))
      )}
    </ReviewList>
  );
}

function NoteList({ notes }: { notes: Note[] }) {
  return (
    <ReviewList title="Notes" href="/notes">
      {notes.length === 0 ? (
        <EmptyState message="No notes created or updated on this date." />
      ) : (
        notes.slice(0, 5).map((note) => (
          <ListRow key={note.id} title={note.title} meta="Created or updated" />
        ))
      )}
    </ReviewList>
  );
}

function ReviewList({
  children,
  href,
  title,
}: {
  children: ReactNode;
  href: string;
  title: string;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#2c2925]">{title}</h3>
        <Link className="text-xs font-semibold text-[var(--color-primary-strong)]" href={href}>
          Open
        </Link>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function ListRow({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="app-soft-row rounded-xl border border-[#ded6ca] px-3 py-2">
      <p className="truncate text-sm font-semibold text-[#2c2925]">{title}</p>
      <p className="app-muted mt-1 truncate text-xs">{meta}</p>
    </div>
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
    <div className="px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-normal text-[#8b8176]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[#2c2925]">{value}</p>
      {detail ? <p className="app-muted mt-1 text-xs">{detail}</p> : null}
    </div>
  );
}

function MetricLine({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt>{label}</dt>
      <dd className="font-semibold text-[#2c2925]">{value}</dd>
    </div>
  );
}

function ModuleLinks({
  modules,
}: {
  modules: Array<"tasks" | "calendar" | "notes" | "tracker" | "categories">;
}) {
  const hrefs = {
    tasks: "/tasks",
    calendar: "/calendar",
    notes: "/notes",
    tracker: "/tracker",
    categories: "/categories",
  };
  const labels = {
    tasks: "Tasks",
    calendar: "Calendar",
    notes: "Notes",
    tracker: "Tracker",
    categories: "Categories",
  };
  return (
    <div className="flex flex-wrap gap-2">
      {modules.map((module) => (
        <Link
          className="app-button-secondary min-h-8 px-3 py-1.5 text-xs"
          href={hrefs[module]}
          key={module}
        >
          {labels[module]}
        </Link>
      ))}
    </div>
  );
}
