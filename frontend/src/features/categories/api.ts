import type { CategoryOverview } from "./types";
import { apiRequest } from "@/lib/api";

export function getCategoryOverview(
  categoryId: number,
  date: string,
  options: {
    recentNotesLimit?: number;
    upcomingEventsLimit?: number;
  } = {},
): Promise<CategoryOverview> {
  const params = new URLSearchParams({ date });
  if (options.recentNotesLimit !== undefined) {
    params.set("recent_notes_limit", String(options.recentNotesLimit));
  }
  if (options.upcomingEventsLimit !== undefined) {
    params.set("upcoming_events_limit", String(options.upcomingEventsLimit));
  }

  return apiRequest<CategoryOverview>(
    `/api/categories/${categoryId}/overview?${params.toString()}`,
  );
}
