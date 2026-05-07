export type DashboardSectionId =
  | "today-overview"
  | "daily-tasks"
  | "weekly-tasks"
  | "upcoming-events"
  | "recent-notes"
  | "tracker-summary"
  | "planning-summary";

export type DashboardSectionMeta = {
  id: DashboardSectionId;
  title: string;
  description: string;
  futureWidgetType: string;
};

export const DASHBOARD_SECTION_REGISTRY: DashboardSectionMeta[] = [
  {
    id: "today-overview",
    title: "Today Overview",
    description: "Selected-date counts and quick navigation.",
    futureWidgetType: "today_overview",
  },
  {
    id: "daily-tasks",
    title: "Daily Tasks",
    description: "Daily task occurrences for one date.",
    futureWidgetType: "daily_tasks",
  },
  {
    id: "weekly-tasks",
    title: "Weekly Tasks",
    description: "Weekly recurring tasks scheduled for one date.",
    futureWidgetType: "weekly_tasks",
  },
  {
    id: "upcoming-events",
    title: "Upcoming Events",
    description: "Calendar events from the selected date onward.",
    futureWidgetType: "upcoming_events",
  },
  {
    id: "recent-notes",
    title: "Recent Notes",
    description: "Most recently updated active notes.",
    futureWidgetType: "recent_notes",
  },
  {
    id: "tracker-summary",
    title: "Daily Tracking",
    description: "Water, activity, and calorie summary for one date.",
    futureWidgetType: "tracker_summary",
  },
  {
    id: "planning-summary",
    title: "Planning",
    description: "Navigation into the read-only planning module.",
    futureWidgetType: "planning_summary",
  },
];
