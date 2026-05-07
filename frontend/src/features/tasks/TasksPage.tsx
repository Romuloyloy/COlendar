"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  archiveDailyTask,
  archiveWeeklyTask,
  completeDailyTask,
  completeWeeklyTask,
  createDailyTask,
  createWeeklyTask,
  getDailyTasks,
  getWeeklyTaskCompletions,
  getWeeklyTasks,
  incompleteDailyTask,
  incompleteWeeklyTask,
  updateDailyTask,
  updateWeeklyTask,
} from "./api";
import type { DailyTask, WeeklyTask, WeeklyTaskCompletion } from "./types";

const WEEKDAYS = [
  { value: 0, label: "Mon" },
  { value: 1, label: "Tue" },
  { value: 2, label: "Wed" },
  { value: 3, label: "Thu" },
  { value: 4, label: "Fri" },
  { value: 5, label: "Sat" },
  { value: 6, label: "Sun" },
];

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function weekdayLabel(value: number) {
  return WEEKDAYS.find((weekday) => weekday.value === value)?.label ?? `${value}`;
}

function weekdayFromIsoDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return (date.getDay() + 6) % 7;
}

export function TasksPage() {
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([]);
  const [weeklyCompletions, setWeeklyCompletions] = useState<WeeklyTaskCompletion[]>([]);
  const [selectedDailyTaskId, setSelectedDailyTaskId] = useState<number | null>(null);
  const [selectedWeeklyTaskId, setSelectedWeeklyTaskId] = useState<number | null>(null);
  const [dailyTitle, setDailyTitle] = useState("");
  const [dailyDescription, setDailyDescription] = useState("");
  const [weeklyTitle, setWeeklyTitle] = useState("");
  const [weeklyDescription, setWeeklyDescription] = useState("");
  const [weeklyWeekdays, setWeeklyWeekdays] = useState<number[]>([]);
  const [weeklyFilter, setWeeklyFilter] = useState("");
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

  async function loadData() {
    setError(null);
    const weekday = weeklyFilter === "" ? undefined : Number(weeklyFilter);
    const [dailyData, weeklyData, completionData] = await Promise.all([
      getDailyTasks(selectedDate),
      getWeeklyTasks(weekday),
      getWeeklyTaskCompletions(selectedDate),
    ]);
    setDailyTasks(dailyData);
    setWeeklyTasks(weeklyData);
    setWeeklyCompletions(completionData);

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
  }, [selectedDate, weeklyFilter]);

  useEffect(() => {
    if (selectedDailyTask) {
      setDailyTitle(selectedDailyTask.title);
      setDailyDescription(selectedDailyTask.description);
    }
  }, [selectedDailyTask]);

  useEffect(() => {
    if (selectedWeeklyTask) {
      setWeeklyTitle(selectedWeeklyTask.title);
      setWeeklyDescription(selectedWeeklyTask.description);
      setWeeklyWeekdays(selectedWeeklyTask.weekdays);
    }
  }, [selectedWeeklyTask]);

  function resetDailyForm() {
    setSelectedDailyTaskId(null);
    setDailyTitle("");
    setDailyDescription("");
  }

  function resetWeeklyForm() {
    setSelectedWeeklyTaskId(null);
    setWeeklyTitle("");
    setWeeklyDescription("");
    setWeeklyWeekdays([]);
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

  return (
    <main className="min-h-screen px-6 py-8 text-neutral-900">
      <section className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-2">
        <header className="xl:col-span-2">
          <h1 className="text-3xl font-semibold">Tasks</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-700">
            Plan one-off daily tasks and simple weekly recurring tasks.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <label className="block text-sm font-medium">
              Working date
              <input
                className="mt-1 rounded border border-neutral-300 px-3 py-2"
                onChange={(event) => setSelectedDate(event.target.value)}
                type="date"
                value={selectedDate}
              />
            </label>
            {error ? (
              <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p className="rounded border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
                {notice}
              </p>
            ) : null}
          </div>
        </header>

        <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Daily Tasks</h2>
            <button
              className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100"
              onClick={resetDailyForm}
              type="button"
            >
              New
            </button>
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
            <label className="text-sm font-medium">
              Filter
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
