export type Sheet = {
  id: number;
  name: string;
  sort_order: number;
  context_category_id: number | null;
  created_at: string;
  updated_at: string;
};

export type SheetWidgetCategoryMode = "none" | "sheet_context" | "specific";

export type SheetWidgetSlot = {
  id: number;
  sheet_id: number;
  widget_key: string | null;
  config_json: {
    category_mode?: SheetWidgetCategoryMode;
    category_id?: number | null;
    event_horizon_days?: 7 | 14 | 30;
    folder_id?: number | null;
    include_descendants?: boolean;
    task_mode?: "selected_date" | "open";
    title_override?: string;
  };
  slot_index: number;
  col_span: number;
  row_span: number;
  created_at: string;
  updated_at: string;
};

export type SheetDetail = Sheet & {
  slots: SheetWidgetSlot[];
};

export type SheetSlotsUpdate = {
  slots: {
    slot_index: number;
    widget_key: string | null;
    config_json?: {
      category_mode?: SheetWidgetCategoryMode;
      category_id?: number | null;
      event_horizon_days?: 7 | 14 | 30;
      folder_id?: number | null;
      include_descendants?: boolean;
      task_mode?: "selected_date" | "open";
      title_override?: string;
    };
    col_span?: number;
    row_span?: number;
  }[];
};
