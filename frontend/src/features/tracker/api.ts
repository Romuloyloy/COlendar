import type {
  ActivityEntry,
  CalorieEntry,
  TrackerSummary,
  WaterEntry,
} from "./types";
import { apiRequest } from "@/lib/api";

export function getTrackerSummary(date: string): Promise<TrackerSummary> {
  return apiRequest<TrackerSummary>(
    `/api/tracker/summary?date=${encodeURIComponent(date)}`,
  );
}

export function createWaterEntry(input: {
  entry_date: string;
  amount_ml: number;
  note: string;
}): Promise<WaterEntry> {
  return apiRequest<WaterEntry>("/api/tracker/water", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function archiveWaterEntry(entryId: number): Promise<void> {
  return apiRequest<void>(`/api/tracker/water/${entryId}`, { method: "DELETE" });
}

export function createActivityEntry(input: {
  entry_date: string;
  activity_type: string;
  duration_minutes: number | null;
  quantity: string | null;
  note: string;
}): Promise<ActivityEntry> {
  return apiRequest<ActivityEntry>("/api/tracker/activity", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function archiveActivityEntry(entryId: number): Promise<void> {
  return apiRequest<void>(`/api/tracker/activity/${entryId}`, { method: "DELETE" });
}

export function createCalorieEntry(input: {
  entry_date: string;
  amount_kcal: number;
  label: string;
  note: string;
}): Promise<CalorieEntry> {
  return apiRequest<CalorieEntry>("/api/tracker/calories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function archiveCalorieEntry(entryId: number): Promise<void> {
  return apiRequest<void>(`/api/tracker/calories/${entryId}`, { method: "DELETE" });
}
