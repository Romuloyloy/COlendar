"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getCategoryOverview } from "./api";
import type { CategoryOverview } from "./types";
import { calendarEventOccurrenceKey } from "@/features/calendar/event-identity";
import { getTaskCategories } from "@/features/tasks/api";
import type { TaskCategory } from "@/features/tasks/types";
import {
  DateNavigator,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
} from "@/components/ui";
import { formatDisplayDate, todayIsoDate } from "@/lib/date";

export function CategoriesPage() {
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [overview, setOverview] = useState<CategoryOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getTaskCategories()
      .then((items) => {
        if (!isMounted) {
          return;
        }
        setCategories(items);
        setSelectedCategoryId((current) => current ?? items[0]?.id ?? null);
      })
      .catch((caught) => {
        if (isMounted) {
          setError(caught instanceof Error ? caught.message : "Could not load categories.");
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
  }, []);

  useEffect(() => {
    if (selectedCategoryId === null) {
      setOverview(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getCategoryOverview(selectedCategoryId, selectedDate, {
      recentNotesLimit: 10,
      upcomingEventsLimit: 10,
    })
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
  }, [selectedCategoryId, selectedDate]);

  return (
    <main className="app-page">
      <section className="app-container">
        <div className="mb-6">
          <PageHeader
            actions={
              <DateNavigator
                className="min-w-64"
                label="Workspace date"
                onChange={setSelectedDate}
                value={selectedDate}
              />
            }
            description="Use shared categories as read-focused contexts across tasks, notes, and calendar events."
            eyebrow="Workspace"
            title="Categories"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <SectionCard title="Active Categories">
            <div className="mt-4 space-y-2">
              {categories.length === 0 ? (
                <EmptyState message="Create a category from Tasks to start using category workspaces." />
              ) : (
                categories.map((category) => (
                  <button
                    className={`app-soft-row flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left ${
                      category.id === selectedCategoryId
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                        : "border-[#ded6ca]"
                    }`}
                    key={category.id}
                    onClick={() => setSelectedCategoryId(category.id)}
                    type="button"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#2c2925]">
                        {category.name}
                      </span>
                      <span className="app-muted mt-0.5 block text-xs">
                        Tasks, notes, and events
                      </span>
                    </span>
                    {category.color ? (
                      <span
                        className="size-3 shrink-0 rounded-full border border-black/10"
                        style={{ backgroundColor: category.color }}
                      />
                    ) : null}
                  </button>
                ))
              )}
            </div>
            <Link className="app-button-secondary mt-4 w-full text-center" href="/tasks">
              Manage Categories
            </Link>
          </SectionCard>

          <div className="grid gap-5">
            {error ? <ErrorState message={error} /> : null}
            {isLoading ? <LoadingState message="Loading category workspace..." /> : null}
            {!isLoading && !error && selectedCategory === null ? (
              <EmptyState message="Select a category to see its workspace." />
            ) : null}
            {!isLoading && !error && overview ? (
              <CategoryOverviewSections overview={overview} selectedDate={selectedDate} />
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function CategoryOverviewSections({
  overview,
  selectedDate,
}: {
  overview: CategoryOverview;
  selectedDate: string;
}) {
  return (
    <>
      <SectionCard
        action={<Link className="app-button-secondary" href="/tasks">Open Tasks</Link>}
        eyebrow="Category Context"
        title={overview.category.name}
      >
        <p className="app-muted mt-3 text-sm leading-6">
          Showing category-linked work for {formatDisplayDate(selectedDate)}. Tracker data stays separate.
        </p>
        <div className="app-stat-grid mt-5 grid rounded-2xl border-y border-[#ded6ca] sm:grid-cols-4 sm:divide-x sm:divide-[#ded6ca]">
          <CategoryStat label="One-time" value={overview.daily_tasks.length} />
          <CategoryStat label="Recurring" value={overview.recurring_tasks.length} />
          <CategoryStat label="Events" value={overview.upcoming_events.length} />
          <CategoryStat label="Notes" value={overview.recent_notes.length} />
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <WorkspaceList
          emptyMessage="No incomplete one-time tasks for this date."
          href="/tasks"
          items={overview.daily_tasks.map((task) => ({
            id: task.id,
            title: task.title,
            meta: task.planned_time ? `Planned ${task.planned_time.slice(0, 5)}` : "One-time task",
          }))}
          title="One-time Tasks"
        />
        <WorkspaceList
          emptyMessage="No recurring tasks scheduled for this date."
          href="/tasks"
          items={overview.recurring_tasks.map((task) => ({
            id: task.id,
            title: task.title,
            meta: task.is_completed ? "Completed occurrence" : "Open occurrence",
          }))}
          title="Recurring Tasks"
        />
        <WorkspaceList
          emptyMessage="No upcoming events in this category."
          href="/calendar"
          items={overview.upcoming_events.map((event) => ({
            id: calendarEventOccurrenceKey(event),
            title: event.title,
            meta: `${formatDisplayDate(event.event_date)}${event.start_time ? ` at ${event.start_time.slice(0, 5)}` : ""}`,
          }))}
          title="Upcoming Events"
        />
        <WorkspaceList
          emptyMessage="No recent notes in this category."
          href="/notes"
          items={overview.recent_notes.map((note) => ({
            id: note.id,
            title: note.title,
            meta: note.content ? note.content.replace(/\s+/g, " ").trim() || "Note" : "Note",
          }))}
          title="Recent Notes"
        />
      </div>
    </>
  );
}

function CategoryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-normal text-[#8b8176]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[#2c2925]">{value}</p>
    </div>
  );
}

function WorkspaceList({
  emptyMessage,
  href,
  items,
  title,
}: {
  emptyMessage: string;
  href: string;
  items: Array<{ id: number | string; title: string; meta: string }>;
  title: string;
}) {
  return (
    <SectionCard
      action={<Link className="app-button-secondary min-h-8 px-3 py-1.5 text-xs" href={href}>Open</Link>}
      title={title}
    >
      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          items.map((item) => (
            <Link
              className="app-soft-row block rounded-xl border border-[#ded6ca] px-3 py-2 hover:border-[#cbbfb0]"
              href={href}
              key={`${title}-${item.id}`}
            >
              <p className="truncate text-sm font-semibold text-[#2c2925]">
                {item.title}
              </p>
              <p className="app-muted mt-1 truncate text-xs">{item.meta}</p>
            </Link>
          ))
        )}
      </div>
    </SectionCard>
  );
}
