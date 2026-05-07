import type { ComponentType } from "react";

import type { DashboardSummary, DashboardWeeklyTask } from "./types";
import type { DailyTask } from "@/features/tasks/types";

export type DashboardWidgetId =
  | "today-overview"
  | "daily-tasks"
  | "weekly-tasks"
  | "upcoming-events"
  | "recent-notes"
  | "tracker-summary"
  | "planning-summary"
  | "quick-actions";

export type WidgetSizeHint = "standard" | "wide";

export type DashboardWidgetCategory =
  | "overview"
  | "tasks"
  | "calendar"
  | "notes"
  | "tracker"
  | "navigation";

export type DashboardWidgetProps = {
  selectedDate: string;
  summary: DashboardSummary;
  isSaving: boolean;
  onDateChange: (date: string) => void;
  onToggleDailyTask: (task: DailyTask) => void;
  onToggleWeeklyTask: (task: DashboardWeeklyTask) => void;
};

export type DashboardWidgetDefinition = {
  id: DashboardWidgetId;
  displayName: string;
  description: string;
  category: DashboardWidgetCategory;
  defaultOrder: number;
  defaultSize: WidgetSizeHint;
  component: ComponentType<DashboardWidgetProps>;
};
