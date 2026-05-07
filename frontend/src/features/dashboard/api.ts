import type { DashboardSummary } from "./types";
import { apiRequest } from "@/lib/api";

export function getDashboardSummary(date: string): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>(
    `/api/dashboard/summary?date=${encodeURIComponent(date)}`,
  );
}
