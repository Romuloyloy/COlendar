"use client";

import { useEffect, useMemo, useState } from "react";

import { getDashboardSummary } from "./api";
import {
  DailyTasksSection,
  PlanningSummarySection,
  RecentNotesSection,
  TodayOverviewSection,
  TrackerSummarySection,
  UpcomingEventsSection,
  WeeklyTasksSection,
} from "./DashboardSections";
import type { DashboardSummary, DashboardWeeklyTask } from "./types";
import type { DailyTask } from "@/features/tasks/types";
import {
  completeDailyTask,
  completeWeeklyTask,
  incompleteDailyTask,
  incompleteWeeklyTask,
} from "@/features/tasks/api";
import { ErrorState, LoadingState, PageHeader, SectionCard } from "@/components/ui";
import { formatDisplayDate, todayIsoDate } from "@/lib/date";

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
        <div className="mb-6">
          <PageHeader
            description={`A practical home base for ${selectedDateLabel}.`}
            eyebrow="Fixed Dashboard"
            title="COlendar"
          />
          {error ? (
            <div className="mt-4">
              <ErrorState message={error} />
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <SectionCard>
            <LoadingState message="Loading dashboard..." />
          </SectionCard>
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
            <PlanningSummarySection selectedDate={selectedDate} />
          </div>
        ) : (
          <SectionCard>
            <LoadingState message="Dashboard data could not be loaded." />
          </SectionCard>
        )}
      </section>
    </main>
  );
}
