export type Profile = {
  id: number;
  name: string;
};

export type Page = {
  id: number;
  profile_id: number;
  title: string;
  order_index: number;
};

export type Widget = {
  id: number;
  page_id: number;

  type: string; // "note" for v1
  title: string;

  x: number;
  y: number;
  w: number;
  h: number;

  config_json: string;
  created_at: string;
  updated_at: string;
};

export type NoteConfig = {
  text: string;
};

export function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
