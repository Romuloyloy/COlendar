export type Sheet = {
  id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SheetWidgetSlot = {
  id: number;
  sheet_id: number;
  widget_key: string | null;
  config_json: {
    category_id?: number | null;
    title_override?: string;
  };
  slot_index: number;
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
      category_id?: number | null;
      title_override?: string;
    };
  }[];
};
