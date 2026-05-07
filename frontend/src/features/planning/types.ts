import type { CalendarEvent } from "@/features/calendar/types";
import type { DailyTask } from "@/features/tasks/types";

export type PlanningWeeklyTaskOccurrence = {
  id: number;
  title: string;
  description: string;
  weekdays: number[];
  is_completed: boolean;
  completion_id: number | null;
};

export type DailyPlan = {
  selected_date: string;
  daily_tasks: DailyTask[];
  weekly_tasks: PlanningWeeklyTaskOccurrence[];
  calendar_events: CalendarEvent[];
};

export type WeeklyPlanDay = {
  date: string;
  daily_tasks: DailyTask[];
  weekly_tasks: PlanningWeeklyTaskOccurrence[];
  calendar_events: CalendarEvent[];
};

export type WeeklyPlan = {
  selected_date: string;
  week_start: string;
  week_end: string;
  days: WeeklyPlanDay[];
};
