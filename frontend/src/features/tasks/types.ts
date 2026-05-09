export type DailyTask = {
  id: number;
  title: string;
  description: string;
  task_date: string;
  planned_time: string | null;
  due_date: string | null;
  due_time: string | null;
  category_id: number | null;
  is_completed: boolean;
  completed_at: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type WeeklyTask = {
  id: number;
  title: string;
  description: string;
  weekdays: number[];
  category_id: number | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type TaskCategory = {
  id: number;
  name: string;
  color: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type WeeklyTaskCompletion = {
  id: number;
  weekly_task_id: number;
  completion_date: string;
  completed_at: string;
  created_at: string;
  updated_at: string;
};
