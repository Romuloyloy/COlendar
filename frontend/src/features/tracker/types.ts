export type WaterEntry = {
  id: number;
  entry_date: string;
  amount_ml: number;
  note: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type ActivityEntry = {
  id: number;
  entry_date: string;
  activity_type: string;
  duration_minutes: number | null;
  quantity: string | null;
  note: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type TrackerSummary = {
  selected_date: string;
  water_entries: WaterEntry[];
  activity_entries: ActivityEntry[];
  total_water_ml: number;
  activity_count: number;
  total_activity_minutes: number;
};
