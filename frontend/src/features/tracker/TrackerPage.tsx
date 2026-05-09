"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  archiveActivityEntry,
  archiveCalorieEntry,
  archiveWaterEntry,
  createActivityEntry,
  createCalorieEntry,
  createWaterEntry,
  getTrackerSummary,
} from "./api";
import type {
  ActivityEntry,
  CalorieEntry,
  TrackerSummary,
  WaterEntry,
} from "./types";
import { DateNavigator, ErrorState, NoticeState } from "@/components/ui";
import { formatDisplayDate, todayIsoDate } from "@/lib/date";

function emptyToNull(value: string) {
  return value.trim() ? value : null;
}

function WaterEntryCard({
  entry,
  isSaving,
  onArchive,
}: {
  entry: WaterEntry;
  isSaving: boolean;
  onArchive: (entry: WaterEntry) => void;
}) {
  return (
    <div className="rounded border border-neutral-200 px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-950">
            {entry.amount_ml} ml
          </p>
          {entry.note ? (
            <p className="mt-1 text-xs leading-5 text-neutral-600">{entry.note}</p>
          ) : null}
        </div>
        <button
          className="rounded border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          disabled={isSaving}
          onClick={() => onArchive(entry)}
          type="button"
        >
          Archive
        </button>
      </div>
    </div>
  );
}

function ActivityEntryCard({
  entry,
  isSaving,
  onArchive,
}: {
  entry: ActivityEntry;
  isSaving: boolean;
  onArchive: (entry: ActivityEntry) => void;
}) {
  const details = [
    entry.duration_minutes !== null ? `${entry.duration_minutes} min` : null,
    entry.quantity !== null ? `${entry.quantity}` : null,
  ].filter(Boolean);

  return (
    <div className="rounded border border-neutral-200 px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-950">
            {entry.activity_type}
          </p>
          {details.length > 0 ? (
            <p className="mt-1 text-xs text-neutral-600">{details.join(" - ")}</p>
          ) : null}
          {entry.note ? (
            <p className="mt-1 text-xs leading-5 text-neutral-600">{entry.note}</p>
          ) : null}
        </div>
        <button
          className="rounded border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          disabled={isSaving}
          onClick={() => onArchive(entry)}
          type="button"
        >
          Archive
        </button>
      </div>
    </div>
  );
}

function CalorieEntryCard({
  entry,
  isSaving,
  onArchive,
}: {
  entry: CalorieEntry;
  isSaving: boolean;
  onArchive: (entry: CalorieEntry) => void;
}) {
  return (
    <div className="rounded border border-neutral-200 px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-950">
            {entry.amount_kcal} kcal
          </p>
          {entry.label ? (
            <p className="mt-1 text-xs text-neutral-600">{entry.label}</p>
          ) : null}
          {entry.note ? (
            <p className="mt-1 text-xs leading-5 text-neutral-600">{entry.note}</p>
          ) : null}
        </div>
        <button
          className="rounded border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          disabled={isSaving}
          onClick={() => onArchive(entry)}
          type="button"
        >
          Archive
        </button>
      </div>
    </div>
  );
}

export function TrackerPage() {
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [summary, setSummary] = useState<TrackerSummary | null>(null);
  const [waterAmount, setWaterAmount] = useState("");
  const [waterNote, setWaterNote] = useState("");
  const [activityType, setActivityType] = useState("");
  const [activityDuration, setActivityDuration] = useState("");
  const [activityQuantity, setActivityQuantity] = useState("");
  const [activityNote, setActivityNote] = useState("");
  const [calorieAmount, setCalorieAmount] = useState("");
  const [calorieLabel, setCalorieLabel] = useState("");
  const [calorieNote, setCalorieNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const waterLiters = useMemo(() => {
    if (!summary) {
      return "0.00";
    }
    return (summary.total_water_ml / 1000).toFixed(2);
  }, [summary]);

  async function loadData() {
    setError(null);
    const data = await getTrackerSummary(selectedDate);
    setSummary(data);
  }

  useEffect(() => {
    setIsLoading(true);
    loadData()
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setIsLoading(false));
  }, [selectedDate]);

  useEffect(() => {
    function refreshAfterQuickAdd() {
      void loadData().catch((caught: Error) => setError(caught.message));
    }

    window.addEventListener("quick-add:created", refreshAfterQuickAdd);
    return () =>
      window.removeEventListener("quick-add:created", refreshAfterQuickAdd);
  }, [selectedDate]);

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

  async function handleCreateWaterEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await createWaterEntry({
        entry_date: selectedDate,
        amount_ml: Number(waterAmount),
        note: waterNote,
      });
      setWaterAmount("");
      setWaterNote("");
      setNotice("Water entry added.");
      await loadData();
    });
  }

  async function handleArchiveWaterEntry(entry: WaterEntry) {
    await runAction(async () => {
      await archiveWaterEntry(entry.id);
      setNotice("Water entry archived.");
      await loadData();
    });
  }

  async function handleCreateActivityEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await createActivityEntry({
        entry_date: selectedDate,
        activity_type: activityType,
        duration_minutes: activityDuration ? Number(activityDuration) : null,
        quantity: emptyToNull(activityQuantity),
        note: activityNote,
      });
      setActivityType("");
      setActivityDuration("");
      setActivityQuantity("");
      setActivityNote("");
      setNotice("Activity entry added.");
      await loadData();
    });
  }

  async function handleArchiveActivityEntry(entry: ActivityEntry) {
    await runAction(async () => {
      await archiveActivityEntry(entry.id);
      setNotice("Activity entry archived.");
      await loadData();
    });
  }

  async function handleCreateCalorieEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await createCalorieEntry({
        entry_date: selectedDate,
        amount_kcal: Number(calorieAmount),
        label: calorieLabel,
        note: calorieNote,
      });
      setCalorieAmount("");
      setCalorieLabel("");
      setCalorieNote("");
      setNotice("Calorie entry added.");
      await loadData();
    });
  }

  async function handleArchiveCalorieEntry(entry: CalorieEntry) {
    await runAction(async () => {
      await archiveCalorieEntry(entry.id);
      setNotice("Calorie entry archived.");
      await loadData();
    });
  }

  return (
    <main className="min-h-screen px-6 py-8 text-neutral-900">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-6">
          <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
            <h1 className="text-2xl font-semibold">Tracker</h1>
            <p className="mt-2 text-sm leading-6 text-neutral-700">
              Log water intake and lightweight activity for a selected date.
            </p>
            <DateNavigator
              className="mt-4"
              label="Selected date"
              onChange={setSelectedDate}
              value={selectedDate}
            />
            {error ? (
              <div className="mt-4">
                <ErrorState message={error} />
              </div>
            ) : null}
            {notice ? (
              <div className="mt-4">
                <NoticeState message={notice} />
              </div>
            ) : null}
          </section>

          <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Daily Summary</h2>
            {isLoading ? (
              <p className="mt-4 text-sm text-neutral-600">Loading tracker...</p>
            ) : (
              <div className="mt-4 grid gap-3">
                <div className="border-y border-neutral-200 px-1 py-3">
                  <p className="text-xs font-semibold uppercase text-neutral-500">
                    Water
                  </p>
                  <p className="mt-1 text-xl font-semibold">
                    {summary?.total_water_ml ?? 0} ml
                  </p>
                  <p className="mt-1 text-xs text-neutral-600">{waterLiters} L</p>
                </div>
                <div className="border-b border-neutral-200 px-1 pb-3">
                  <p className="text-xs font-semibold uppercase text-neutral-500">
                    Calories
                  </p>
                  <p className="mt-1 text-xl font-semibold">
                    {summary?.total_calories_kcal ?? 0} kcal
                  </p>
                </div>
                <div className="border-b border-neutral-200 px-1 pb-3">
                  <p className="text-xs font-semibold uppercase text-neutral-500">
                    Activity
                  </p>
                  <p className="mt-1 text-xl font-semibold">
                    {summary?.activity_count ?? 0} entries
                  </p>
                  <p className="mt-1 text-xs text-neutral-600">
                    {summary?.total_activity_minutes ?? 0} logged minutes
                  </p>
                </div>
              </div>
            )}
          </section>
        </aside>

        <section className="grid gap-6 xl:grid-cols-3">
          <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">
              Water On {formatDisplayDate(selectedDate)}
            </h2>
            <div className="mt-4 space-y-2">
              {isLoading ? (
                <p className="text-sm text-neutral-600">Loading water entries...</p>
              ) : summary?.water_entries.length === 0 ? (
                <p className="text-sm text-neutral-600">
                  No water entries for this date.
                </p>
              ) : (
                summary?.water_entries.map((entry) => (
                  <WaterEntryCard
                    entry={entry}
                    isSaving={isSaving}
                    key={entry.id}
                    onArchive={handleArchiveWaterEntry}
                  />
                ))
              )}
            </div>
            <form
              className="mt-5 space-y-3 border-t border-neutral-200 pt-4"
              onSubmit={handleCreateWaterEntry}
            >
              <h3 className="text-sm font-semibold">Add Water</h3>
              <label className="block text-sm font-medium">
                Amount in ml
                <input
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                  min="1"
                  onChange={(event) => setWaterAmount(event.target.value)}
                  required
                  type="number"
                  value={waterAmount}
                />
              </label>
              <label className="block text-sm font-medium">
                Note
                <input
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                  onChange={(event) => setWaterNote(event.target.value)}
                  type="text"
                  value={waterNote}
                />
              </label>
              <button
                className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                Add Water
              </button>
            </form>
          </section>

          <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">
              Calories On {formatDisplayDate(selectedDate)}
            </h2>
            <div className="mt-4 space-y-2">
              {isLoading ? (
                <p className="text-sm text-neutral-600">
                  Loading calorie entries...
                </p>
              ) : summary?.calorie_entries.length === 0 ? (
                <p className="text-sm text-neutral-600">
                  No calorie entries for this date.
                </p>
              ) : (
                summary?.calorie_entries.map((entry) => (
                  <CalorieEntryCard
                    entry={entry}
                    isSaving={isSaving}
                    key={entry.id}
                    onArchive={handleArchiveCalorieEntry}
                  />
                ))
              )}
            </div>
            <form
              className="mt-5 space-y-3 border-t border-neutral-200 pt-4"
              onSubmit={handleCreateCalorieEntry}
            >
              <h3 className="text-sm font-semibold">Add Calories</h3>
              <label className="block text-sm font-medium">
                Amount in kcal
                <input
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                  min="1"
                  onChange={(event) => setCalorieAmount(event.target.value)}
                  required
                  type="number"
                  value={calorieAmount}
                />
              </label>
              <label className="block text-sm font-medium">
                Label
                <input
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                  onChange={(event) => setCalorieLabel(event.target.value)}
                  type="text"
                  value={calorieLabel}
                />
              </label>
              <label className="block text-sm font-medium">
                Note
                <textarea
                  className="mt-1 min-h-24 w-full rounded border border-neutral-300 px-3 py-2"
                  onChange={(event) => setCalorieNote(event.target.value)}
                  value={calorieNote}
                />
              </label>
              <button
                className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                Add Calories
              </button>
            </form>
          </section>

          <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">
              Activity On {formatDisplayDate(selectedDate)}
            </h2>
            <div className="mt-4 space-y-2">
              {isLoading ? (
                <p className="text-sm text-neutral-600">
                  Loading activity entries...
                </p>
              ) : summary?.activity_entries.length === 0 ? (
                <p className="text-sm text-neutral-600">
                  No activity entries for this date.
                </p>
              ) : (
                summary?.activity_entries.map((entry) => (
                  <ActivityEntryCard
                    entry={entry}
                    isSaving={isSaving}
                    key={entry.id}
                    onArchive={handleArchiveActivityEntry}
                  />
                ))
              )}
            </div>
            <form
              className="mt-5 space-y-3 border-t border-neutral-200 pt-4"
              onSubmit={handleCreateActivityEntry}
            >
              <h3 className="text-sm font-semibold">Add Activity</h3>
              <label className="block text-sm font-medium">
                Activity type
                <input
                  className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                  onChange={(event) => setActivityType(event.target.value)}
                  required
                  type="text"
                  value={activityType}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Duration in minutes
                  <input
                    className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                    min="0"
                    onChange={(event) => setActivityDuration(event.target.value)}
                    type="number"
                    value={activityDuration}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Quantity
                  <input
                    className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
                    min="0"
                    onChange={(event) => setActivityQuantity(event.target.value)}
                    step="0.01"
                    type="number"
                    value={activityQuantity}
                  />
                </label>
              </div>
              <label className="block text-sm font-medium">
                Note
                <textarea
                  className="mt-1 min-h-24 w-full rounded border border-neutral-300 px-3 py-2"
                  onChange={(event) => setActivityNote(event.target.value)}
                  value={activityNote}
                />
              </label>
              <button
                className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                Add Activity
              </button>
            </form>
          </section>
        </section>
      </section>
    </main>
  );
}
