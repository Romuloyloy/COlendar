import type { ComponentType } from "react";

import type { DashboardSummary, DashboardWeeklyTask } from "./types";
import type { CalendarEvent } from "@/features/calendar/types";
import type { Note } from "@/features/notes/types";
import type { SheetWidgetCategoryMode } from "@/features/sheets/types";
import type { DailyTask, TaskCategory } from "@/features/tasks/types";

export type DashboardWidgetId =
  | "today-overview"
  | "daily-tasks"
  | "weekly-tasks"
  | "upcoming-events"
  | "recent-notes"
  | "tracker-summary"
  | "category-overview"
  | "review-summary"
  | "quick-actions";

export type WidgetSizeHint = "standard" | "wide";

export type DashboardWidgetCategory =
  | "overview"
  | "tasks"
  | "calendar"
  | "notes"
  | "tracker"
  | "navigation";

export type DashboardWidgetLibraryGroup =
  | "Overview / Utility"
  | "Tasks"
  | "Notes"
  | "Calendar"
  | "Tracker";

export type DashboardWidgetProps = {
  selectedDate: string;
  summary: DashboardSummary;
  isSaving: boolean;
  widgetConfig?: DashboardWidgetConfig;
  sheetContextCategoryId?: number | null;
  renderMode?: "normal" | "compact" | "focus";
  taskCategories?: TaskCategory[];
  onDateChange: (date: string) => void;
  onToggleDailyTask: (task: DailyTask) => void;
  onToggleWeeklyTask: (task: DashboardWeeklyTask) => void;
  onPreviewDailyTask?: (task: DailyTask) => void;
  onPreviewWeeklyTask?: (task: DashboardWeeklyTask) => void;
  onPreviewEvent?: (event: CalendarEvent) => void;
  onPreviewNote?: (note: Note) => void;
};

export type DashboardWidgetConfig = {
  category_mode?: SheetWidgetCategoryMode;
  category_id?: number | null;
  title_override?: string;
};

export type DashboardWidgetDefinition = {
  id: DashboardWidgetId;
  displayName: string;
  description: string;
  category: DashboardWidgetCategory;
  libraryGroup: DashboardWidgetLibraryGroup;
  compactPreviewLabel: string;
  supportsCategoryFilter?: boolean;
  supportsTitleOverride?: boolean;
  defaultOrder: number;
  defaultSize: WidgetSizeHint;
  component: ComponentType<DashboardWidgetProps>;
};
