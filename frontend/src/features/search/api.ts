import type { SearchResponse } from "./types";
import { apiRequest } from "@/lib/api";

export function globalSearch(query: string): Promise<SearchResponse> {
  return apiRequest<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}`);
}
