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
import { todayIsoDate, weekdayFromIsoDate } from "@/lib/date";

const WEEKDAYS = [
  { value: 0, label: "Mon" },
  { value: 1, label: "Tue" },
  { value: 2, label: "Wed" },
  { value: 3, label: "Thu" },
  { value: 4, label: "Fri" },
  { value: 5, label: "Sat" },
  { value: 6, label: "Sun" },
];

function weekdayLabel(value: number) {
  return WEEKDAYS.find((weekday) => weekday.value === value)?.label ?? `${value}`;
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
  const [dailyCategoryId, setDailyCategoryId] = useState("");
  const [dailyCategoryFilter, setDailyCategoryFilter] = useState("");
  const [weeklyTitle, setWeeklyTitle] = useState("");
  const [weeklyDescription, setWeeklyDescription] = useState("");
  const [weeklyWeekdays, setWeeklyWeekdays] = useState<number[]>([]);
  const [weeklyFilter, setWeeklyFilter] = useState("");
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
  const selectedWeekday = weekdayFromIsoDate(selectedDate);
  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  async function loadData() {
    setError(null);
    const weekday = weeklyFilter === "" ? undefined : Number(weeklyFilter);
    const dailyCategory =
      dailyCategoryFilter === "" ? undefined : Number(dailyCategoryFilter);
    const weeklyCategory =
      weeklyCategoryFilter === "" ? undefined : Number(weeklyCategoryFilter);
    const [dailyData, weeklyData, completionData, categoryData] = await Promise.all([
      getDailyTasks(selectedDate, dailyCategory),
      getWeeklyTasks(weekday, weeklyCategory),
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
  }, [selectedDate, weeklyFilter, dailyCategoryFilter, weeklyCategoryFilter]);

  useEffect(() => {
    function refreshAfterQuickAdd() {
      void loadData().catch((caught: Error) => setError(caught.message));
    }

    window.addEventListener("quick-add:created", refreshAfterQuickAdd);
    return () =>
      window.removeEventListener("quick-add:created", refreshAfterQuickAdd);
  }, [selectedDate, weeklyFilter, dailyCategoryFilter, weeklyCategoryFilter]);

  useEffect(() => {
    if (selectedDailyTask) {
      setDailyTitle(selectedDailyTask.title);
      setDailyDescription(selectedDailyTask.description);
      setDailyCategoryId(selectedDailyTask.category_id?.toString() ?? "");
    }
  }, [selectedDailyTask]);

  useEffect(() => {
    if (selectedWeeklyTask) {
      setWeeklyTitle(selectedWeeklyTask.title);
      setWeeklyDescription(selectedWeeklyTask.description);
      setWeeklyWeekdays(selectedWeeklyTask.weekdays);
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
    setDailyCategoryId("");
  }

  function resetWeeklyForm() {
    setSelectedWeeklyTaskId(null);
    setWeeklyTitle("");
    setWeeklyDescription("");
    setWeeklyWeekdays([]);
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
        category_id: dailyCategoryId ? Number(dailyCategoryId) : null,
      });
      setSelectedDailyTaskId(task.id);
      setNotice("Daily task created.");
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
        category_id: dailyCategoryId ? Number(dailyCategoryId) : null,
      });
      setNotice("Daily task updated.");
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
      setNotice("Daily task archived.");
      await loadData();
    });
  }

  async function handleCreateWeeklyTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const task = await createWeeklyTask({
        title: weeklyTitle,
        description: weeklyDescription,
        weekdays: weeklyWeekdays,
        category_id: weeklyCategoryId ? Number(weeklyCategoryId) : null,
      });
      setSelectedWeeklyTaskId(task.id);
      setNotice("Weekly task created.");
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
        weekdays: weeklyWeekdays,
        category_id: weeklyCategoryId ? Number(weeklyCategoryId) : null,
      });
      setNotice("Weekly task updated.");
      await loadData();
    });
  }

  async function toggleWeeklyOccurrence(task: WeeklyTask) {
    if (!task.weekdays.includes(selectedWeekday)) {
      setError("This weekly task is not scheduled for the selected date.");
      return;
    }

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
      setNotice("Weekly task archived.");
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
    <main className="min-h-screen px-6 py-8 text-neutral-900">
      <section className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-2">
        <header className="xl:col-span-2">
          <h1 className="text-3xl font-semibold">Tasks</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-700">
            Plan one-off daily tasks and simple weekly recurring tasks.
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
            <h2 className="text-xl font-semibold">Daily Tasks</h2>
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
              <p className="text-sm text-neutral-600">Loading daily tasks...</p>
            ) : dailyTasks.length === 0 ? (
              <p className="text-sm text-neutral-600">No daily tasks for this date.</p>
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
              {selectedDailyTask ? "Edit Daily Task" : "Create Daily Task"}
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
                {selectedDailyTask ? "Update Daily Task" : "Create Daily Task"}
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
            <h2 className="text-xl font-semibold">Weekly Tasks</h2>
            <div className="flex flex-wrap gap-2">
              <label className="text-sm font-medium">
                Day
                <select
                  className="ml-2 rounded border border-neutral-300 px-2 py-1.5"
                  onChange={(event) => setWeeklyFilter(event.target.value)}
                  value={weeklyFilter}
                >
                  <option value="">All days</option>
                  {WEEKDAYS.map((weekday) => (
                    <option key={weekday.value} value={weekday.value}>
                      {weekday.label}
                    </option>
                  ))}
                </select>
              </label>
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
              <p className="text-sm text-neutral-600">Loading weekly tasks...</p>
            ) : weeklyTasks.length === 0 ? (
              <p className="text-sm text-neutral-600">No weekly tasks yet.</p>
            ) : (
              weeklyTasks.map((task) => {
                const completed = completedWeeklyTaskIds.has(task.id);
                const isScheduledForSelectedDate = task.weekdays.includes(selectedWeekday);
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
                        disabled={!isScheduledForSelectedDate || isSaving}
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
                          {task.weekdays.map(weekdayLabel).join(", ")}
                        </span>
                        {!isScheduledForSelectedDate ? (
                          <span className="mt-1 block text-xs text-neutral-500">
                            Not scheduled for the selected date
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
                {selectedWeeklyTask ? "Edit Weekly Task" : "Create Weekly Task"}
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
                {selectedWeeklyTask ? "Update Weekly Task" : "Create Weekly Task"}
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
