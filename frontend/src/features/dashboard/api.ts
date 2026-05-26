import type {
  DashboardSummary,
  DashboardWidgetLayout,
  DashboardWidgetLayoutUpdate,
} from "./types";
import { apiRequest } from "@/lib/api";

export function getDashboardSummary(
  date: string,
  options?: { upcomingEventsLimit?: number },
): Promise<DashboardSummary> {
  const params = new URLSearchParams({ date });
  if (options?.upcomingEventsLimit !== undefined) {
    params.set("upcoming_events_limit", String(options.upcomingEventsLimit));
  }
  return apiRequest<DashboardSummary>(
    `/api/dashboard/summary?${params.toString()}`,
  );
}

export function getDashboardWidgetLayout(): Promise<DashboardWidgetLayout> {
  return apiRequest<DashboardWidgetLayout>("/api/dashboard/widgets");
}

export function updateDashboardWidgetLayout(
  payload: DashboardWidgetLayoutUpdate,
): Promise<DashboardWidgetLayout> {
  return apiRequest<DashboardWidgetLayout>("/api/dashboard/widgets", {
    body: JSON.stringify(payload),
    method: "PUT",
  });
}

export function resetDashboardWidgetLayout(): Promise<DashboardWidgetLayout> {
  return apiRequest<DashboardWidgetLayout>("/api/dashboard/widgets/reset", {
    method: "POST",
  });
}
