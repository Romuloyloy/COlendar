"use client";

import { useEffect, useMemo, useState } from "react";

import { getDashboardSummary, getDashboardWidgetLayout } from "./api";
import {
  DEFAULT_DASHBOARD_WIDGET_DEFINITIONS,
  getDashboardWidgetDefinition,
} from "./dashboard-widget-registry";
import { DashboardCustomizeModal } from "./DashboardCustomizeModal";
import { WidgetRenderer } from "./WidgetRenderer";
import type {
  DashboardSummary,
  DashboardWeeklyTask,
  DashboardWidgetLayout,
} from "./types";
import type { DashboardWidgetDefinition, DashboardWidgetProps } from "./widget-types";
import type { DailyTask } from "@/features/tasks/types";
import {
  completeDailyTask,
  completeWeeklyTask,
  incompleteDailyTask,
  incompleteWeeklyTask,
} from "@/features/tasks/api";
import {
  ErrorState,
  LoadingState,
  NoticeState,
  PageHeader,
  SectionCard,
  AppButton,
} from "@/components/ui";
import { formatDisplayDate, todayIsoDate } from "@/lib/date";

export function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [layout, setLayout] = useState<DashboardWidgetLayout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [layoutWarning, setLayoutWarning] = useState<string | null>(null);

  const selectedDateLabel = useMemo(
    () => formatDisplayDate(selectedDate),
    [selectedDate],
  );
  const visibleWidgetDefinitions = useMemo(
    () => resolveVisibleWidgetDefinitions(layout),
    [layout],
  );

  async function loadSummary() {
    setError(null);
    const data = await getDashboardSummary(selectedDate);
    setSummary(data);
  }

  async function loadDashboardData() {
    setError(null);
    setLayoutWarning(null);

    const [summaryResult, layoutResult] = await Promise.allSettled([
      getDashboardSummary(selectedDate),
      getDashboardWidgetLayout(),
    ]);

    if (summaryResult.status === "rejected") {
      throw summaryResult.reason;
    }

    setSummary(summaryResult.value);

    if (layoutResult.status === "fulfilled") {
      setLayout(layoutResult.value);
    } else {
      setLayout(null);
      setLayoutWarning(
        "Saved dashboard layout could not be loaded. Showing the default layout.",
      );
    }
  }

  useEffect(() => {
    setIsLoading(true);
    loadDashboardData()
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setIsLoading(false));
  }, [selectedDate]);

  useEffect(() => {
    function refreshAfterQuickAdd() {
      void loadSummary().catch((caught: Error) => setError(caught.message));
    }

    window.addEventListener("quick-add:created", refreshAfterQuickAdd);
    return () =>
      window.removeEventListener("quick-add:created", refreshAfterQuickAdd);
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
    <main className="app-page">
      <section className="app-container">
        <div className="mb-6">
          <PageHeader
            description={`A practical home base for ${selectedDateLabel}.`}
            eyebrow="Dashboard"
            actions={
              <AppButton
                onClick={() => setIsCustomizeOpen(true)}
                type="button"
              >
                Customize Dashboard
              </AppButton>
            }
            title="COlendar"
          />
          {error ? (
            <div className="mt-4">
              <ErrorState message={error} />
            </div>
          ) : null}
          {layoutWarning ? (
            <div className="mt-4">
              <NoticeState message={layoutWarning} />
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <SectionCard>
            <LoadingState message="Loading dashboard..." />
          </SectionCard>
        ) : summary ? (
          visibleWidgetDefinitions.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {visibleWidgetDefinitions.map((definition) => (
                <WidgetRenderer
                  definition={definition}
                  key={definition.id}
                  props={
                    {
                      isSaving,
                      onDateChange: setSelectedDate,
                      onToggleDailyTask: toggleDailyTask,
                      onToggleWeeklyTask: toggleWeeklyTask,
                      selectedDate,
                      summary,
                    } satisfies DashboardWidgetProps
                  }
                />
              ))}
            </div>
          ) : (
            <SectionCard title="No visible widgets">
              <p className="mt-3 text-sm leading-6 text-neutral-700">
                All dashboard widgets are hidden.
              </p>
              <button
                className="app-button-primary mt-4"
                onClick={() => setIsCustomizeOpen(true)}
                type="button"
              >
                Customize Dashboard
              </button>
            </SectionCard>
          )
        ) : (
          <SectionCard>
            <LoadingState message="Dashboard data could not be loaded." />
          </SectionCard>
        )}
      </section>
      <DashboardCustomizeModal
        isOpen={isCustomizeOpen}
        layout={layout}
        onClose={() => setIsCustomizeOpen(false)}
        onSaved={setLayout}
      />
    </main>
  );
}

function resolveVisibleWidgetDefinitions(
  layout: DashboardWidgetLayout | null,
): DashboardWidgetDefinition[] {
  if (!layout || layout.widgets.length === 0) {
    return DEFAULT_DASHBOARD_WIDGET_DEFINITIONS;
  }

  const sortedLayout = [...layout.widgets].sort(
    (left, right) => left.sort_order - right.sort_order,
  );
  const resolvedDefinitions: DashboardWidgetDefinition[] = [];
  const savedWidgetKeys = new Set<string>();

  for (const widget of sortedLayout) {
    const definition = getDashboardWidgetDefinition(widget.widget_key);
    if (!definition) {
      continue;
    }

    savedWidgetKeys.add(definition.id);
    if (widget.is_visible) {
      resolvedDefinitions.push(definition);
    }
  }

  for (const definition of DEFAULT_DASHBOARD_WIDGET_DEFINITIONS) {
    if (!savedWidgetKeys.has(definition.id)) {
      resolvedDefinitions.push(definition);
    }
  }

  return resolvedDefinitions;
}
