import {
  DailyTasksWidget,
  PlanningSummaryWidget,
  QuickActionsWidget,
  RecentNotesWidget,
  TodayOverviewWidget,
  TrackerSummaryWidget,
  UpcomingEventsWidget,
  WeeklyTasksWidget,
} from "./DashboardWidgets";
import type { DashboardWidgetDefinition } from "./widget-types";

export const DASHBOARD_WIDGET_REGISTRY: DashboardWidgetDefinition[] = [
  {
    id: "today-overview",
    displayName: "Today Overview",
    description: "Selected-date counts for the fixed dashboard.",
    category: "overview",
    defaultOrder: 0,
    defaultSize: "wide",
    component: TodayOverviewWidget,
  },
  {
    id: "quick-actions",
    displayName: "Quick Actions",
    description: "Shortcuts into create, search, planning, and core modules.",
    category: "navigation",
    defaultOrder: 1,
    defaultSize: "wide",
    component: QuickActionsWidget,
  },
  {
    id: "daily-tasks",
    displayName: "One-time Tasks",
    description: "One-time tasks planned for the selected date.",
    category: "tasks",
    defaultOrder: 2,
    defaultSize: "standard",
    component: DailyTasksWidget,
  },
  {
    id: "weekly-tasks",
    displayName: "Recurring Tasks",
    description: "Recurring task occurrences for the selected date.",
    category: "tasks",
    defaultOrder: 3,
    defaultSize: "standard",
    component: WeeklyTasksWidget,
  },
  {
    id: "recent-notes",
    displayName: "Recent Notes",
    description: "Recently updated active notes.",
    category: "notes",
    defaultOrder: 4,
    defaultSize: "standard",
    component: RecentNotesWidget,
  },
  {
    id: "upcoming-events",
    displayName: "Upcoming Events",
    description: "Upcoming active calendar events from the selected date.",
    category: "calendar",
    defaultOrder: 5,
    defaultSize: "standard",
    component: UpcomingEventsWidget,
  },
  {
    id: "tracker-summary",
    displayName: "Daily Tracking",
    description: "Water, activity, and calorie totals for the selected date.",
    category: "tracker",
    defaultOrder: 6,
    defaultSize: "standard",
    component: TrackerSummaryWidget,
  },
  {
    id: "planning-summary",
    displayName: "Plan Review",
    description: "Navigation into planning views composed from tasks and calendar.",
    category: "navigation",
    defaultOrder: 7,
    defaultSize: "standard",
    component: PlanningSummaryWidget,
  },
];

export const DEFAULT_DASHBOARD_WIDGET_DEFINITIONS = [...DASHBOARD_WIDGET_REGISTRY].sort(
  (left, right) => left.defaultOrder - right.defaultOrder,
);

export function getDashboardWidgetDefinition(widgetKey: string) {
  return DASHBOARD_WIDGET_REGISTRY.find((definition) => definition.id === widgetKey);
}
