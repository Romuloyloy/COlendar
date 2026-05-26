import type { CalendarEvent } from "@/features/calendar/types";
import type { Note } from "@/features/notes/types";
import type { DailyTask } from "@/features/tasks/types";
import type { TrackerSummary } from "@/features/tracker/types";

export type DashboardWeeklyTask = {
  id: number;
  title: string;
  description: string;
  weekdays: number[];
  recurrence_type: "weekly" | "biweekly" | "monthly_day";
  interval_weeks: number;
  anchor_date: string | null;
  day_of_month: number | null;
  start_date: string | null;
  end_date: string | null;
  category_id: number | null;
  is_completed: boolean;
  completion_id: number | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type DashboardCounts = {
  daily_task_count: number;
  incomplete_daily_task_count: number;
  open_daily_task_count: number;
  weekly_task_count: number;
  incomplete_weekly_task_count: number;
  recent_note_count: number;
  upcoming_event_count: number;
  total_water_ml: number;
  activity_count: number;
  total_calories_kcal: number;
};

export type DashboardSummary = {
  selected_date: string;
  daily_tasks: DailyTask[];
  open_daily_tasks: DailyTask[];
  weekly_tasks: DashboardWeeklyTask[];
  upcoming_events: CalendarEvent[];
  tracker_summary: TrackerSummary;
  recent_notes: Note[];
  counts: DashboardCounts;
};

export type DashboardWidgetPreference = {
  id: number;
  widget_key: string;
  sort_order: number;
  is_visible: boolean;
  config_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DashboardWidgetLayout = {
  widgets: DashboardWidgetPreference[];
};

export type DashboardWidgetLayoutUpdate = {
  widgets: {
    widget_key: string;
    is_visible: boolean;
    config_json?: Record<string, unknown>;
  }[];
};
