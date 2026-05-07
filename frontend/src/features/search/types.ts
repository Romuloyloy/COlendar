export type SearchResultType =
  | "note"
  | "folder"
  | "daily_task"
  | "weekly_task"
  | "calendar_event";

export type SearchResult = {
  id: number;
  type: SearchResultType;
  title: string;
  subtitle: string | null;
  preview: string | null;
  date: string | null;
  target_url: string;
};

export type SearchResultGroups = {
  notes: SearchResult[];
  folders: SearchResult[];
  daily_tasks: SearchResult[];
  weekly_tasks: SearchResult[];
  calendar_events: SearchResult[];
};

export type SearchResponse = {
  query: string;
  results: SearchResultGroups;
};
