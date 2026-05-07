export type CalendarEvent = {
  id: number;
  title: string;
  description: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};
