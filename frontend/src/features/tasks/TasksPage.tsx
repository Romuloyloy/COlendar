"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  archiveTaskCategory,
  archiveDailyTask,
  archiveWeeklyTask,
  completeDailyTask,
  completeWeeklyTask,
  createTaskCategory,
  createDailyTask,
  createWeeklyTask,
  getDailyTasks,
  getTaskCategories,
  getWeeklyTaskCompletions,
  getWeeklyTasks,
  incompleteDailyTask,
  incompleteWeeklyTask,
  updateTaskCategory,
  updateDailyTask,
  updateWeeklyTask,
} from "./api";
import type {
  DailyTask,
  TaskCategory,
  WeeklyTask,
  WeeklyTaskCompletion,
} from "./types";
import { DateNavigator, ErrorState, NoticeState } from "@/components/ui";
import { formatDisplayDate, formatTime, todayIsoDate } from "@/lib/date";

const WEEKDAYS = [
  { value: 0, label: "Mon" },
  { value: 1, label: "Tue" },
  { value: 2, label: "Wed" },
  { value: 3, label: "Thu" },
  { value: 4, label: "Fri" },
  { value: 5, label: "Sat" },
  { value: 6, label: "Sun" },
];

const RECURRENCE_TYPES = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly_day", label: "Monthly by day" },
] as const;

function weekdayLabel(value: number) {
  return WEEKDAYS.find((weekday) => weekday.value === value)?.label ?? `${value}`;
}

function recurringTaskMeta(task: WeeklyTask) {
  if (task.recurrence_type === "monthly_day") {
    const end = task.end_date ? ` until ${formatDisplayDate(task.end_date)}` : "";
    return `Monthly on day ${task.day_of_month}${end}`;
  }
  const days = task.weekdays.map(weekdayLabel).join(", ");
  if (task.recurrence_type === "biweekly") {
    const anchor = task.anchor_date
      ? ` from ${formatDisplayDate(task.anchor_date)}`
      : "";
    const end = task.end_date ? ` until ${formatDisplayDate(task.end_date)}` : "";
    return `Every 2 weeks on ${days}${anchor}${end}`;
  }
  const end = task.end_date ? ` until ${formatDisplayDate(task.end_date)}` : "";
  return `Weekly on ${days}${end}`;
}

function emptyToNull(value: string) {
  return value.trim() ? value : null;
}

function timeInputValue(value: string | null) {
  return value ? value.slice(0, 5) : "";
}

function oneTimeTaskMeta(task: DailyTask, selectedDate: string) {
  const meta = [];
  const plannedTime = formatTime(task.planned_time);
  const dueTime = formatTime(task.due_time);
  if (plannedTime) {
    meta.push(`Planned ${plannedTime}`);
  }
  if (task.due_date) {
    const dueLabel =
      task.due_date === selectedDate
        ? "Due today"
        : `Due ${formatDisplayDate(task.due_date, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}`;
    meta.push(dueTime ? `${dueLabel} ${dueTime}` : dueLabel);
  }
  return meta;
}

export function TasksPage() {
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([]);
  const [weeklyCompletions, setWeeklyCompletions] = useState<WeeklyTaskCompletion[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [selectedDailyTaskId, setSelectedDailyTaskId] = useState<number | null>(null);
  const [selectedWeeklyTaskId, setSelectedWeeklyTaskId] = useState<number | null>(null);
  const [dailyTitle, setDailyTitle] = useState("");
  const [dailyDescription, setDailyDescription] = useState("");
  const [dailyPlannedTime, setDailyPlannedTime] = useState("");
  const [dailyDueDate, setDailyDueDate] = useState("");
  const [dailyDueTime, setDailyDueTime] = useState("");
  const [dailyCategoryId, setDailyCategoryId] = useState("");
  const [dailyCategoryFilter, setDailyCategoryFilter] = useState("");
  const [weeklyTitle, setWeeklyTitle] = useState("");
  const [weeklyDescription, setWeeklyDescription] = useState("");
  const [weeklyWeekdays, setWeeklyWeekdays] = useState<number[]>([]);
  const [weeklyRecurrenceType, setWeeklyRecurrenceType] =
    useState<WeeklyTask["recurrence_type"]>("weekly");
  const [weeklyAnchorDate, setWeeklyAnchorDate] = useState(todayIsoDate());
  const [weeklyDayOfMonth, setWeeklyDayOfMonth] = useState(
    `${new Date(`${todayIsoDate()}T00:00:00`).getDate()}`,
  );
  const [weeklyEndDate, setWeeklyEndDate] = useState("");
  const [weeklyCategoryId, setWeeklyCategoryId] = useState("");
  const [weeklyCategoryFilter, setWeeklyCategoryFilter] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("#14b8a6");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedDailyTask = useMemo(
    () => dailyTasks.find((task) => task.id === selectedDailyTaskId) ?? null,
    [dailyTasks, selectedDailyTaskId],
  );
  const selectedWeeklyTask = useMemo(
    () => weeklyTasks.find((task) => task.id === selectedWeeklyTaskId) ?? null,
    [weeklyTasks, selectedWeeklyTaskId],
  );
  const completedWeeklyTaskIds = useMemo(
    () => new Set(weeklyCompletions.map((completion) => completion.weekly_task_id)),
    [weeklyCompletions],
  );
  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  async function loadData() {
    setError(null);
    const dailyCategory =
      dailyCategoryFilter === "" ? undefined : Number(dailyCategoryFilter);
    const weeklyCategory =
      weeklyCategoryFilter === "" ? undefined : Number(weeklyCategoryFilter);
    const [dailyData, weeklyData, completionData, categoryData] = await Promise.all([
      getDailyTasks(selectedDate, dailyCategory),
      getWeeklyTasks(selectedDate, weeklyCategory),
      getWeeklyTaskCompletions(selectedDate),
      getTaskCategories(),
    ]);
    setDailyTasks(dailyData);
    setWeeklyTasks(weeklyData);
    setWeeklyCompletions(completionData);
    setCategories(categoryData);

    if (
      selectedDailyTaskId !== null &&
      !dailyData.some((task) => task.id === selectedDailyTaskId)
    ) {
      resetDailyForm();
    }
    if (
      selectedWeeklyTaskId !== null &&
      !weeklyData.some((task) => task.id === selectedWeeklyTaskId)
    ) {
      resetWeeklyForm();
    }
  }

  useEffect(() => {
    setIsLoading(true);
    loadData()
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setIsLoading(false));
  }, [selectedDate, dailyCategoryFilter, weeklyCategoryFilter]);

  useEffect(() => {
    function refreshAfterQuickAdd() {
      void loadData().catch((caught: Error) => setError(caught.message));
    }

    window.addEventListener("quick-add:created", refreshAfterQuickAdd);
    return () =>
      window.removeEventListener("quick-add:created", refreshAfterQuickAdd);
  }, [selectedDate, dailyCategoryFilter, weeklyCategoryFilter]);

  useEffect(() => {
    if (selectedDailyTask) {
      setDailyTitle(selectedDailyTask.title);
      setDailyDescription(selectedDailyTask.description);
      setDailyPlannedTime(timeInputValue(selectedDailyTask.planned_time));
      setDailyDueDate(selectedDailyTask.due_date ?? "");
      setDailyDueTime(timeInputValue(selectedDailyTask.due_time));
      setDailyCategoryId(selectedDailyTask.category_id?.toString() ?? "");
    }
  }, [selectedDailyTask]);

  useEffect(() => {
    if (selectedWeeklyTask) {
      setWeeklyTitle(selectedWeeklyTask.title);
      setWeeklyDescription(selectedWeeklyTask.description);
      setWeeklyWeekdays(selectedWeeklyTask.weekdays);
      setWeeklyRecurrenceType(selectedWeeklyTask.recurrence_type);
      setWeeklyAnchorDate(selectedWeeklyTask.anchor_date ?? selectedDate);
      setWeeklyDayOfMonth(selectedWeeklyTask.day_of_month?.toString() ?? "1");
      setWeeklyEndDate(selectedWeeklyTask.end_date ?? "");
      setWeeklyCategoryId(selectedWeeklyTask.category_id?.toString() ?? "");
    }
  }, [selectedWeeklyTask]);

  useEffect(() => {
    if (selectedCategory) {
      setCategoryName(selectedCategory.name);
      setCategoryColor(selectedCategory.color || "#14b8a6");
    }
  }, [selectedCategory]);

  function resetDailyForm() {
    setSelectedDailyTaskId(null);
    setDailyTitle("");
    setDailyDescription("");
    setDailyPlannedTime("");
    setDailyDueDate("");
    setDailyDueTime("");
    setDailyCategoryId("");
  }

  function resetWeeklyForm() {
    setSelectedWeeklyTaskId(null);
    setWeeklyTitle("");
    setWeeklyDescription("");
    setWeeklyWeekdays([]);
    setWeeklyRecurrenceType("weekly");
    setWeeklyAnchorDate(selectedDate);
    setWeeklyDayOfMonth(`${new Date(`${selectedDate}T00:00:00`).getDate()}`);
    setWeeklyEndDate("");
    setWeeklyCategoryId("");
  }

  function resetCategoryForm() {
    setSelectedCategoryId(null);
    setCategoryName("");
    setCategoryColor("#14b8a6");
  }

  async function runAction(action: () => Promise<void>) {
    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateDailyTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const task = await createDailyTask({
        title: dailyTitle,
        description: dailyDescription,
        task_date: selectedDate,
        planned_time: emptyToNull(dailyPlannedTime),
        due_date: emptyToNull(dailyDueDate),
        due_time: emptyToNull(dailyDueTime),
        category_id: dailyCategoryId ? Number(dailyCategoryId) : null,
      });
      setSelectedDailyTaskId(task.id);
      setNotice("One-time task created.");
      await loadData();
    });
  }

  async function handleUpdateDailyTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDailyTask) {
      return;
    }
    await runAction(async () => {
      await updateDailyTask(selectedDailyTask.id, {
        title: dailyTitle,
        description: dailyDescription,
        task_date: selectedDate,
        planned_time: emptyToNull(dailyPlannedTime),
        due_date: emptyToNull(dailyDueDate),
        due_time: emptyToNull(dailyDueTime),
        category_id: dailyCategoryId ? Number(dailyCategoryId) : null,
      });
      setNotice("One-time task updated.");
      await loadData();
    });
  }

  async function toggleDailyTask(task: DailyTask) {
    await runAction(async () => {
      if (task.is_completed) {
        await incompleteDailyTask(task.id);
      } else {
        await completeDailyTask(task.id);
      }
      await loadData();
    });
  }

  async function handleArchiveDailyTask() {
    if (!selectedDailyTask) {
      return;
    }
    await runAction(async () => {
      await archiveDailyTask(selectedDailyTask.id);
      resetDailyForm();
      setNotice("One-time task archived.");
      await loadData();
    });
  }

  async function handleCreateWeeklyTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const task = await createWeeklyTask({
        title: weeklyTitle,
        description: weeklyDescription,
        recurrence_type: weeklyRecurrenceType,
        weekdays: weeklyWeekdays,
        anchor_date:
          weeklyRecurrenceType === "biweekly" ? emptyToNull(weeklyAnchorDate) : null,
        day_of_month:
          weeklyRecurrenceType === "monthly_day"
            ? Number(weeklyDayOfMonth)
            : null,
        end_date: emptyToNull(weeklyEndDate),
        category_id: weeklyCategoryId ? Number(weeklyCategoryId) : null,
      });
      setSelectedWeeklyTaskId(task.id);
      setNotice("Recurring task created.");
      await loadData();
    });
  }

  async function handleUpdateWeeklyTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedWeeklyTask) {
      return;
    }
    await runAction(async () => {
      await updateWeeklyTask(selectedWeeklyTask.id, {
        title: weeklyTitle,
        description: weeklyDescription,
        recurrence_type: weeklyRecurrenceType,
        weekdays: weeklyWeekdays,
        anchor_date:
          weeklyRecurrenceType === "biweekly" ? emptyToNull(weeklyAnchorDate) : null,
        day_of_month:
          weeklyRecurrenceType === "monthly_day"
            ? Number(weeklyDayOfMonth)
            : null,
        end_date: emptyToNull(weeklyEndDate),
        category_id: weeklyCategoryId ? Number(weeklyCategoryId) : null,
      });
      setNotice("Recurring task updated.");
      await loadData();
    });
  }

  async function toggleWeeklyOccurrence(task: WeeklyTask) {
    await runAction(async () => {
      if (completedWeeklyTaskIds.has(task.id)) {
        await incompleteWeeklyTask(task.id, selectedDate);
      } else {
        await completeWeeklyTask(task.id, selectedDate);
      }
      await loadData();
    });
  }

  async function handleArchiveWeeklyTask() {
    if (!selectedWeeklyTask) {
      return;
    }
    await runAction(async () => {
      await archiveWeeklyTask(selectedWeeklyTask.id);
      resetWeeklyForm();
      setNotice("Recurring task archived.");
      await loadData();
    });
  }

  function toggleWeekday(weekday: number) {
    setWeeklyWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((item) => item !== weekday)
        : [...current, weekday].sort(),
    );
  }

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const category = await createTaskCategory({
        name: categoryName,
        color: categoryColor,
      });
      setSelectedCategoryId(category.id);
      setNotice("Category created.");
      await loadData();
    });
  }

  async function handleUpdateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCategory) {
      return;
    }
    await runAction(async () => {
      await updateTaskCategory(selectedCategory.id, {
        name: categoryName,
        color: categoryColor,
      });
      setNotice("Category updated.");
      await loadData();
    });
  }

  async function handleArchiveCategory() {
    if (!selectedCategory) {
      return;
    }
    await runAction(async () => {
      await archiveTaskCategory(selectedCategory.id);
      resetCategoryForm();
      setNotice("Category archived.");
      await loadData();
    });
  }

  function categoryNameFor(categoryId: number | null) {
    if (categoryId === null) {
      return null;
    }
    return categories.find((category) => category.id === categoryId)?.name ?? "Archived category";
  }

  function CategoryBadge({ categoryId }: { categoryId: number | null }) {
    const category = categories.find((item) => item.id === categoryId);
    const name = categoryNameFor(categoryId);
    if (!name) {
      return null;
    }
    return (
      <span className="mt-1 inline-flex items-center gap-1 rounded border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: category?.color || "#a3a3a3" }}
        />
        {name}
      </span>
    );
  }

  return (
    <main className="app-page">
      <section className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-2">
        <header className="xl:col-span-2">
          <h1 className="text-3xl font-semibold">Tasks</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-700">
            Plan one-time tasks to complete and simple recurring tasks.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <DateNavigator
              className="min-w-48"
              label="Working date"
              onChange={setSelectedDate}
              value={selectedDate}
            />
            {error ? (
              <ErrorState message={error} />
            ) : null}
            {notice ? (
              <NoticeState message={notice} />
            ) : null}
          </div>
        </header>

        <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Task Categories</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.length === 0 ? (
                  <p className="text-sm text-neutral-600">No categories yet.</p>
                ) : (
                  categories.map((category) => (
                    <button
                      className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm ${
                        selectedCategoryId === category.id
                          ? "border-teal-700 bg-teal-50"
                          : "border-neutral-300 hover:bg-neutral-100"
                      }`}
                      key={category.id}
                      onClick={() => setSelectedCategoryId(category.id)}
                      type="button"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: category.color || "#a3a3a3" }}
                      />
                      {category.name}
                    </button>
                  ))
                )}
              </div>
            </div>
            <form
              className="grid min-w-80 gap-3 sm:grid-cols-[1fr_120px_auto]"
              onSubmit={selectedCategory ? handleUpdateCategory : handleCreateCategory}
            >
              <label className="text-sm font-medium">
                Name
                <input
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                  onChange={(event) => setCategoryName(event.target.value)}
                  required
                  type="text"
                  value={categoryName}
                />
              </label>
              <label className="text-sm font-medium">
                Color
                <input
                  className="mt-1 h-10 w-full rounded border border-neutral-300 px-2 py-1"
                  onChange={(event) => setCategoryColor(event.target.value)}
                  type="color"
                  value={categoryColor}
                />
              </label>
              <div className="flex items-end gap-2">
                <button
                  className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                  disabled={isSaving}
                  type="submit"
                >
                  {selectedCategory ? "Update" : "Create"}
                </button>
                {selectedCategory ? (
                  <>
                    <button
                      className="rounded border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
                      onClick={resetCategoryForm}
                      type="button"
                    >
                      New
                    </button>
                    <button
                      className="rounded border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                      disabled={isSaving}
                      onClick={handleArchiveCategory}
                      type="button"
                    >
                      Archive
                    </button>
                  </>
                ) : null}
              </div>
            </form>
          </div>
        </section>

        <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">One-time Tasks</h2>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">
                Category
                <select
                  className="ml-2 rounded border border-neutral-300 px-2 py-1.5"
                  onChange={(event) => setDailyCategoryFilter(event.target.value)}
                  value={dailyCategoryFilter}
                >
                  <option value="">All</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100"
                onClick={resetDailyForm}
                type="button"
              >
                New
              </button>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {isLoading ? (
              <p className="text-sm text-neutral-600">Loading one-time tasks...</p>
            ) : dailyTasks.length === 0 ? (
              <p className="text-sm text-neutral-600">No one-time tasks for this date.</p>
            ) : (
              dailyTasks.map((task) => (
                <div
                  className={`rounded border px-3 py-2 ${
                    selectedDailyTaskId === task.id ? "border-teal-700 bg-teal-50" : "border-neutral-200"
                  }`}
                  key={task.id}
                >
                  <div className="flex items-start gap-3">
                    <input
                      checked={task.is_completed}
                      className="mt-1"
                      onChange={() => toggleDailyTask(task)}
                      type="checkbox"
                    />
                    <button
                      className="flex-1 text-left"
                      onClick={() => setSelectedDailyTaskId(task.id)}
                      type="button"
                    >
                      <span className={`block text-sm font-medium ${task.is_completed ? "line-through text-neutral-500" : ""}`}>
                        {task.title}
                      </span>
                      {oneTimeTaskMeta(task, selectedDate).length > 0 ? (
                        <span className="mt-1 block text-xs font-medium text-neutral-600">
                          {oneTimeTaskMeta(task, selectedDate).join(" - ")}
                        </span>
                      ) : null}
                      {task.description ? (
                        <span className="mt-1 block text-xs text-neutral-600">
                        {task.description}
                      </span>
                    ) : null}
                      <CategoryBadge categoryId={task.category_id} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <form
            className="mt-5 space-y-3 border-t border-neutral-200 pt-4"
            onSubmit={selectedDailyTask ? handleUpdateDailyTask : handleCreateDailyTask}
          >
            <h3 className="text-sm font-semibold">
              {selectedDailyTask ? "Edit One-time Task" : "Create One-time Task"}
            </h3>
            <label className="block text-sm font-medium">
              Title
              <input
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                onChange={(event) => setDailyTitle(event.target.value)}
                required
                type="text"
                value={dailyTitle}
              />
            </label>
            <label className="block text-sm font-medium">
              Description
              <textarea
                className="mt-1 min-h-24 w-full rounded border border-neutral-300 px-3 py-2"
                onChange={(event) => setDailyDescription(event.target.value)}
                value={dailyDescription}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm font-medium">
                Planned time
                <input
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                  onChange={(event) => setDailyPlannedTime(event.target.value)}
                  type="time"
                  value={dailyPlannedTime}
                />
              </label>
              <label className="block text-sm font-medium">
                Due date
                <input
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                  onChange={(event) => setDailyDueDate(event.target.value)}
                  type="date"
                  value={dailyDueDate}
                />
              </label>
              <label className="block text-sm font-medium">
                Due time
                <input
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                  onChange={(event) => setDailyDueTime(event.target.value)}
                  type="time"
                  value={dailyDueTime}
                />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Category
              <select
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                onChange={(event) => setDailyCategoryId(event.target.value)}
                value={dailyCategoryId}
              >
                <option value="">None</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                {selectedDailyTask ? "Update One-time Task" : "Create One-time Task"}
              </button>
              {selectedDailyTask ? (
                <button
                  className="rounded border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                  disabled={isSaving}
                  onClick={handleArchiveDailyTask}
                  type="button"
                >
                  Archive
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Recurring Tasks</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Showing occurrences scheduled for {formatDisplayDate(selectedDate)}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="text-sm font-medium">
                Category
                <select
                  className="ml-2 rounded border border-neutral-300 px-2 py-1.5"
                  onChange={(event) => setWeeklyCategoryFilter(event.target.value)}
                  value={weeklyCategoryFilter}
                >
                  <option value="">All</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {isLoading ? (
              <p className="text-sm text-neutral-600">Loading recurring tasks...</p>
            ) : weeklyTasks.length === 0 ? (
              <p className="text-sm text-neutral-600">
                No recurring tasks scheduled for this date.
              </p>
            ) : (
              weeklyTasks.map((task) => {
                const completed = completedWeeklyTaskIds.has(task.id);
                return (
                  <div
                    className={`rounded border px-3 py-2 ${
                      selectedWeeklyTaskId === task.id ? "border-teal-700 bg-teal-50" : "border-neutral-200"
                    }`}
                    key={task.id}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        checked={completed}
                        className="mt-1"
                        disabled={isSaving}
                        onChange={() => toggleWeeklyOccurrence(task)}
                        type="checkbox"
                      />
                      <button
                        className="flex-1 text-left"
                        onClick={() => setSelectedWeeklyTaskId(task.id)}
                        type="button"
                      >
                        <span className={`block text-sm font-medium ${completed ? "line-through text-neutral-500" : ""}`}>
                          {task.title}
                        </span>
                        <span className="mt-1 block text-xs text-neutral-600">
                          {recurringTaskMeta(task)}
                        </span>
                        {task.description ? (
                          <span className="mt-1 block text-xs text-neutral-600">
                        {task.description}
                      </span>
                    ) : null}
                        <CategoryBadge categoryId={task.category_id} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <form
            className="mt-5 space-y-3 border-t border-neutral-200 pt-4"
            onSubmit={selectedWeeklyTask ? handleUpdateWeeklyTask : handleCreateWeeklyTask}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">
                {selectedWeeklyTask ? "Edit Recurring Task" : "Create Recurring Task"}
              </h3>
              <button
                className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100"
                onClick={resetWeeklyForm}
                type="button"
              >
                New
              </button>
            </div>
            <label className="block text-sm font-medium">
              Title
              <input
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                onChange={(event) => setWeeklyTitle(event.target.value)}
                required
                type="text"
                value={weeklyTitle}
              />
            </label>
            <label className="block text-sm font-medium">
              Description
              <textarea
                className="mt-1 min-h-24 w-full rounded border border-neutral-300 px-3 py-2"
                onChange={(event) => setWeeklyDescription(event.target.value)}
                value={weeklyDescription}
              />
            </label>
            <label className="block text-sm font-medium">
              Recurrence
              <select
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                onChange={(event) =>
                  setWeeklyRecurrenceType(
                    event.target.value as WeeklyTask["recurrence_type"],
                  )
                }
                value={weeklyRecurrenceType}
              >
                {RECURRENCE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            {weeklyRecurrenceType === "monthly_day" ? (
              <label className="block text-sm font-medium">
                Day of month
                <input
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                  max="31"
                  min="1"
                  onChange={(event) => setWeeklyDayOfMonth(event.target.value)}
                  required
                  type="number"
                  value={weeklyDayOfMonth}
                />
              </label>
            ) : (
              <fieldset>
                <legend className="text-sm font-medium">Weekdays</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WEEKDAYS.map((weekday) => (
                    <label
                      className={`rounded border px-3 py-2 text-sm ${
                        weeklyWeekdays.includes(weekday.value)
                          ? "border-teal-700 bg-teal-50"
                          : "border-neutral-300"
                      }`}
                      key={weekday.value}
                    >
                      <input
                        checked={weeklyWeekdays.includes(weekday.value)}
                        className="mr-2"
                        onChange={() => toggleWeekday(weekday.value)}
                        type="checkbox"
                      />
                      {weekday.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {weeklyRecurrenceType === "biweekly" ? (
                <label className="block text-sm font-medium">
                  Anchor date
                  <input
                    className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                    onChange={(event) => setWeeklyAnchorDate(event.target.value)}
                    required
                    type="date"
                    value={weeklyAnchorDate}
                  />
                </label>
              ) : null}
              <label className="block text-sm font-medium">
                End date
                <input
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                  onChange={(event) => setWeeklyEndDate(event.target.value)}
                  type="date"
                  value={weeklyEndDate}
                />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Category
              <select
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                onChange={(event) => setWeeklyCategoryId(event.target.value)}
                value={weeklyCategoryId}
              >
                <option value="">None</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                {selectedWeeklyTask ? "Update Recurring Task" : "Create Recurring Task"}
              </button>
              {selectedWeeklyTask ? (
                <button
                  className="rounded border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                  disabled={isSaving}
                  onClick={handleArchiveWeeklyTask}
                  type="button"
                >
                  Archive
                </button>
              ) : null}
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
