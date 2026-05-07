import type { DailyPlan, WeeklyPlan } from "./types";
import { apiRequest } from "@/lib/api";

export function getDailyPlan(date: string): Promise<DailyPlan> {
  return apiRequest<DailyPlan>(`/api/planning/daily?date=${encodeURIComponent(date)}`);
}

export function getWeeklyPlan(date: string): Promise<WeeklyPlan> {
  return apiRequest<WeeklyPlan>(`/api/planning/weekly?date=${encodeURIComponent(date)}`);
}
