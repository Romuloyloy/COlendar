import type {
  DashboardSummary,
  DashboardWidgetLayout,
  DashboardWidgetLayoutUpdate,
} from "./types";
import { apiRequest } from "@/lib/api";

export function getDashboardSummary(date: string): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>(
    `/api/dashboard/summary?date=${encodeURIComponent(date)}`,
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
