import type { DailyTask } from "@/features/tasks/types";

export type CalendarEvent = {
  id: number;
  title: string;
  description: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type CalendarRecurringTaskOccurrence = {
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
  is_completed: boolean;
  completion_id: number | null;
};

export type CalendarOverviewDay = {
  date: string;
  calendar_events: CalendarEvent[];
  daily_tasks: DailyTask[];
  recurring_tasks: CalendarRecurringTaskOccurrence[];
};

export type CalendarOverview = {
  from_date: string;
  to_date: string;
  days: CalendarOverviewDay[];
};
