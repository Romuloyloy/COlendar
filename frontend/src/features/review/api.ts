import type { ReviewSummary } from "./types";
import { apiRequest } from "@/lib/api";

export function getReviewSummary(date: string): Promise<ReviewSummary> {
  return apiRequest<ReviewSummary>(
    `/api/review/summary?date=${encodeURIComponent(date)}`,
  );
}
