import type { CalendarEvent } from "@/features/calendar/types";
import type { DashboardWeeklyTask } from "@/features/dashboard/types";
import type { Note } from "@/features/notes/types";
import type { DailyTask, TaskCategory } from "@/features/tasks/types";
import type { TrackerSummary } from "@/features/tracker/types";

export type ReviewTaskCounts = {
  completed_daily_tasks: number;
  incomplete_daily_tasks: number;
  completed_recurring_tasks: number;
  incomplete_recurring_tasks: number;
};

export type ReviewTrackerTotals = {
  total_water_ml: number;
  total_calories_kcal: number;
  activity_count: number;
  total_activity_minutes: number;
};

export type ReviewDailySummary = {
  date: string;
  daily_tasks: DailyTask[];
  recurring_tasks: DashboardWeeklyTask[];
  calendar_events: CalendarEvent[];
  notes: Note[];
  tracker_summary: TrackerSummary;
  counts: ReviewTaskCounts;
};

export type ReviewWeeklyDaySummary = {
  date: string;
  completed_daily_tasks: number;
  incomplete_daily_tasks: number;
  completed_recurring_tasks: number;
  incomplete_recurring_tasks: number;
  event_count: number;
  note_count: number;
  tracker: ReviewTrackerTotals;
};

export type ReviewWeeklyTotals = {
  completed_daily_tasks: number;
  incomplete_daily_tasks: number;
  completed_recurring_tasks: number;
  incomplete_recurring_tasks: number;
  event_count: number;
  note_count: number;
  tracker: ReviewTrackerTotals;
};

export type ReviewWeeklySummary = {
  week_start: string;
  week_end: string;
  days: ReviewWeeklyDaySummary[];
  totals: ReviewWeeklyTotals;
};

export type ReviewCategorySummary = {
  category: TaskCategory;
  daily_task_count: number;
  recurring_task_occurrence_count: number;
  note_count: number;
  event_count: number;
};

export type ReviewSummary = {
  selected_date: string;
  week_start: string;
  week_end: string;
  daily: ReviewDailySummary;
  weekly: ReviewWeeklySummary;
  categories: ReviewCategorySummary[];
};
