import type { CalendarEvent } from "@/features/calendar/types";
import type { DashboardWeeklyTask } from "@/features/dashboard/types";
import type { Note } from "@/features/notes/types";
import type { DailyTask, TaskCategory } from "@/features/tasks/types";

export type CategoryOverview = {
  selected_date: string;
  category: TaskCategory;
  daily_tasks: DailyTask[];
  recurring_tasks: DashboardWeeklyTask[];
  upcoming_events: CalendarEvent[];
  recent_notes: Note[];
};
