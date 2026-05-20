export type Folder = {
  id: number;
  name: string;
  parent_folder_id: number | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: number;
  title: string;
  content: string;
  folder_id: number | null;
  category_id: number | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};
