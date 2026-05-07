"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  createSheet,
  deleteSheet,
  getSheet,
  listSheets,
  renameSheet,
  resetDefaultSheets,
  updateSheetSlots,
} from "./api";
import type { Sheet, SheetDetail } from "./types";
import { getDashboardSummary } from "@/features/dashboard/api";
import {
  DEFAULT_DASHBOARD_WIDGET_DEFINITIONS,
  getDashboardWidgetDefinition,
} from "@/features/dashboard/dashboard-widget-registry";
import { WidgetRenderer } from "@/features/dashboard/WidgetRenderer";
import type {
  DashboardSummary,
  DashboardWeeklyTask,
} from "@/features/dashboard/types";
import type {
  DashboardWidgetDefinition,
  DashboardWidgetId,
  DashboardWidgetProps,
} from "@/features/dashboard/widget-types";
import type { DailyTask } from "@/features/tasks/types";
import {
  completeDailyTask,
  completeWeeklyTask,
  getTaskCategories,
  incompleteDailyTask,
  incompleteWeeklyTask,
} from "@/features/tasks/api";
import type { TaskCategory } from "@/features/tasks/types";
import {
  DateSelector,
  ErrorState,
  LoadingState,
  NoticeState,
  PageHeader,
  SectionCard,
} from "@/components/ui";
import { formatDisplayDate, todayIsoDate } from "@/lib/date";

const SLOT_COUNT = 8;

type DraftSlot = {
  slot_index: number;
  widget_key: DashboardWidgetId | null;
  config_json: {
    category_id?: number | null;
    title_override?: string;
  };
};

export function SheetsPage() {
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);
  const [sheetDetail, setSheetDetail] = useState<SheetDetail | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [draftSlots, setDraftSlots] = useState<DraftSlot[]>(() =>
    emptyDraftSlots(),
  );
  const [newSheetName, setNewSheetName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedSheetIndex = useMemo(
    () => sheets.findIndex((sheet) => sheet.id === selectedSheetId),
    [selectedSheetId, sheets],
  );
  const selectedDateLabel = useMemo(
    () => formatDisplayDate(selectedDate),
    [selectedDate],
  );

  async function loadSheets(preferredSheetId?: number) {
    const loadedSheets = await listSheets();
    setSheets(loadedSheets);

    const nextSheetId =
      preferredSheetId ??
      selectedSheetId ??
      loadedSheets[0]?.id ??
      null;
    setSelectedSheetId(nextSheetId);
    return nextSheetId;
  }

  async function loadSheetDetail(sheetId: number) {
    const detail = await getSheet(sheetId);
    setSheetDetail(detail);
    setRenameValue(detail.name);
    setDraftSlots(createDraftSlots(detail));
  }

  async function loadSummary() {
    const data = await getDashboardSummary(selectedDate);
    setSummary(data);
  }

  async function loadCategories() {
    const data = await getTaskCategories();
    setCategories(data);
  }

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    loadSheets()
      .then((sheetId) =>
        Promise.all([
          sheetId !== null ? loadSheetDetail(sheetId) : Promise.resolve(),
          loadSummary(),
          loadCategories(),
        ]),
      )
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (selectedSheetId === null) {
      return;
    }

    setError(null);
    loadSheetDetail(selectedSheetId).catch((caught: Error) =>
      setError(caught.message),
    );
  }, [selectedSheetId]);

  useEffect(() => {
    setError(null);
    loadSummary().catch((caught: Error) => setError(caught.message));
  }, [selectedDate]);

  useEffect(() => {
    function refreshAfterQuickAdd() {
      void loadSummary().catch((caught: Error) => setError(caught.message));
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

  function selectPreviousSheet() {
    if (selectedSheetIndex > 0) {
      setSelectedSheetId(sheets[selectedSheetIndex - 1].id);
    }
  }

  function selectNextSheet() {
    if (selectedSheetIndex >= 0 && selectedSheetIndex < sheets.length - 1) {
      setSelectedSheetId(sheets[selectedSheetIndex + 1].id);
    }
  }

  async function handleCreateSheet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const created = await createSheet(newSheetName);
      setNewSheetName("");
      await loadSheets(created.id);
      await loadSheetDetail(created.id);
      setNotice("Sheet created.");
    });
  }

  async function handleRenameSheet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sheetDetail) {
      return;
    }

    await runAction(async () => {
      const renamed = await renameSheet(sheetDetail.id, renameValue);
      setSheetDetail(renamed);
      await loadSheets(renamed.id);
      setNotice("Sheet renamed.");
    });
  }

  async function handleDeleteSheet() {
    if (!sheetDetail) {
      return;
    }

    await runAction(async () => {
      await deleteSheet(sheetDetail.id);
      const loadedSheets = await listSheets();
      setSheets(loadedSheets);
      const nextSheetId = loadedSheets[0]?.id ?? null;
      setSelectedSheetId(nextSheetId);
      if (nextSheetId !== null) {
        await loadSheetDetail(nextSheetId);
      } else {
        setSheetDetail(null);
      }
      setNotice("Sheet deleted.");
    });
  }

  async function handleResetSheets() {
    await runAction(async () => {
      const resetSheets = await resetDefaultSheets();
      setSheets(resetSheets);
      const nextSheetId = resetSheets[0]?.id ?? null;
      setSelectedSheetId(nextSheetId);
      if (nextSheetId !== null) {
        await loadSheetDetail(nextSheetId);
      }
      setNotice("Default sheet restored.");
    });
  }

  async function handleSaveSlots() {
    if (!sheetDetail) {
      return;
    }

    await runAction(async () => {
      const updated = await updateSheetSlots(sheetDetail.id, {
        slots: draftSlots.map((slot) => ({
          slot_index: slot.slot_index,
          widget_key: slot.widget_key,
          config_json: slot.config_json,
        })),
      });
      setSheetDetail(updated);
      setDraftSlots(createDraftSlots(updated));
      setNotice("Sheet slots saved.");
    });
  }

  async function runTaskAction(action: () => Promise<void>) {
    await runAction(async () => {
      await action();
      await loadSummary();
    });
  }

  function toggleDailyTask(task: DailyTask) {
    void runTaskAction(async () => {
      if (task.is_completed) {
        await incompleteDailyTask(task.id);
      } else {
        await completeDailyTask(task.id);
      }
    });
  }

  function toggleWeeklyTask(task: DashboardWeeklyTask) {
    void runTaskAction(async () => {
      if (task.is_completed) {
        await incompleteWeeklyTask(task.id, selectedDate);
      } else {
        await completeWeeklyTask(task.id, selectedDate);
      }
    });
  }

  function updateDraftSlot(slotIndex: number, widgetKey: string) {
    setDraftSlots((current) =>
      current.map((slot) =>
        slot.slot_index === slotIndex
          ? {
              ...slot,
              widget_key: widgetKey ? (widgetKey as DashboardWidgetId) : null,
              config_json: widgetKey ? slot.config_json : {},
            }
          : slot,
      ),
    );
  }

  function updateDraftSlotConfig(
    slotIndex: number,
    key: "category_id" | "title_override",
    value: string,
  ) {
    setDraftSlots((current) =>
      current.map((slot) => {
        if (slot.slot_index !== slotIndex) {
          return slot;
        }

        return {
          ...slot,
          config_json: {
            ...slot.config_json,
            [key]:
              key === "category_id"
                ? value
                  ? Number(value)
                  : null
                : value,
          },
        };
      }),
    );
  }

  const widgetProps =
    summary !== null
      ? ({
          isSaving,
          onDateChange: setSelectedDate,
          onToggleDailyTask: toggleDailyTask,
          onToggleWeeklyTask: toggleWeeklyTask,
          selectedDate,
          summary,
        } satisfies DashboardWidgetProps)
      : null;

  return (
    <main className="min-h-screen px-6 py-8 text-neutral-900">
      <section className="mx-auto max-w-7xl">
        <PageHeader
          description={`Experimental 4x2 workspace prototype for ${selectedDateLabel}.`}
          eyebrow="Sheet/Grid Prototype"
          title="Sheets"
          actions={
            <DateSelector
              className="min-w-48"
              label="Widget date"
              onChange={setSelectedDate}
              value={selectedDate}
            />
          }
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

        <section className="mt-6 rounded-md border border-neutral-300 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSaving || selectedSheetIndex <= 0}
                onClick={selectPreviousSheet}
                type="button"
              >
                Previous
              </button>
              <button
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  isSaving ||
                  selectedSheetIndex < 0 ||
                  selectedSheetIndex >= sheets.length - 1
                }
                onClick={selectNextSheet}
                type="button"
              >
                Next
              </button>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-normal text-teal-700">
                Current Sheet
              </p>
              <h2 className="text-xl font-semibold text-neutral-950">
                {sheetDetail?.name ?? "Loading..."}
              </h2>
            </div>
            <button
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
              onClick={handleResetSheets}
              type="button"
            >
              Reset default sheets
            </button>
          </div>
        </section>

        {isLoading ? (
          <div className="mt-6">
            <SectionCard>
              <LoadingState message="Loading sheets..." />
            </SectionCard>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
            <SheetGrid
              draftSlots={draftSlots}
              isSummaryReady={summary !== null}
              taskCategories={categories}
              widgetProps={widgetProps}
            />

            <aside className="space-y-4">
              <SectionCard title="Manage Sheet">
                <form className="mt-4 space-y-3" onSubmit={handleCreateSheet}>
                  <label className="block text-sm font-medium text-neutral-800">
                    New sheet
                    <input
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                      onChange={(event) => setNewSheetName(event.target.value)}
                      placeholder="Work"
                      required
                      type="text"
                      value={newSheetName}
                    />
                  </label>
                  <button
                    className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSaving}
                    type="submit"
                  >
                    Create Sheet
                  </button>
                </form>

                <form
                  className="mt-5 space-y-3 border-t border-neutral-200 pt-4"
                  onSubmit={handleRenameSheet}
                >
                  <label className="block text-sm font-medium text-neutral-800">
                    Rename current
                    <input
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                      disabled={!sheetDetail}
                      onChange={(event) => setRenameValue(event.target.value)}
                      required
                      type="text"
                      value={renameValue}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSaving || !sheetDetail}
                      type="submit"
                    >
                      Rename
                    </button>
                    <button
                      className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSaving || !sheetDetail || sheets.length <= 1}
                      onClick={handleDeleteSheet}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </form>
              </SectionCard>

              <SectionCard title="Slot Editor">
                <div className="mt-4 space-y-3">
                  {draftSlots.map((slot) => (
                    <label
                      className="block text-sm font-medium text-neutral-800"
                      key={slot.slot_index}
                    >
                      Slot {slot.slot_index + 1}
                      <select
                        className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                        disabled={isSaving}
                        onChange={(event) =>
                          updateDraftSlot(slot.slot_index, event.target.value)
                        }
                        value={slot.widget_key ?? ""}
                      >
                        <option value="">Empty</option>
                        {DEFAULT_DASHBOARD_WIDGET_DEFINITIONS.map((definition) => (
                          <option key={definition.id} value={definition.id}>
                            {definition.displayName}
                          </option>
                        ))}
                      </select>
                      {slot.widget_key === "daily-tasks" ||
                      slot.widget_key === "weekly-tasks" ? (
                        <div className="mt-2 grid gap-2">
                          <select
                            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                            disabled={isSaving}
                            onChange={(event) =>
                              updateDraftSlotConfig(
                                slot.slot_index,
                                "category_id",
                                event.target.value,
                              )
                            }
                            value={slot.config_json.category_id ?? ""}
                          >
                            <option value="">All categories</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <input
                            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                            disabled={isSaving}
                            onChange={(event) =>
                              updateDraftSlotConfig(
                                slot.slot_index,
                                "title_override",
                                event.target.value,
                              )
                            }
                            placeholder="Optional title override"
                            type="text"
                            value={slot.config_json.title_override ?? ""}
                          />
                        </div>
                      ) : null}
                    </label>
                  ))}
                </div>
                <button
                  className="mt-4 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSaving || !sheetDetail}
                  onClick={handleSaveSlots}
                  type="button"
                >
                  Save slot layout
                </button>
              </SectionCard>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

function SheetGrid({
  draftSlots,
  isSummaryReady,
  taskCategories,
  widgetProps,
}: {
  draftSlots: DraftSlot[];
  isSummaryReady: boolean;
  taskCategories: TaskCategory[];
  widgetProps: DashboardWidgetProps | null;
}) {
  return (
    <section className="grid min-h-[560px] grid-cols-4 grid-rows-2 gap-3">
      {draftSlots.map((slot) => {
        const definition = slot.widget_key
          ? getDashboardWidgetDefinition(slot.widget_key)
          : undefined;
        return (
          <div
            className="min-h-0 overflow-hidden rounded-md border border-neutral-300 bg-neutral-50"
            key={slot.slot_index}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-normal text-neutral-500">
                  Slot {slot.slot_index + 1}
                </p>
                <p className="truncate text-xs font-medium text-neutral-700">
                  {definition?.displayName ?? "Empty"}
                </p>
              </div>
              <div className="min-h-0 flex-1 overflow-auto p-2 [&>section]:h-full [&>section]:overflow-auto [&>section]:shadow-none">
                {definition && widgetProps ? (
                  <WidgetRenderer
                    definition={definition}
                    props={{
                      ...widgetProps,
                      renderMode: "compact",
                      taskCategories,
                      widgetConfig: slot.config_json,
                    }}
                  />
                ) : definition && !isSummaryReady ? (
                  <LoadingState message="Loading widget data..." />
                ) : (
                  <EmptySlot />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function EmptySlot() {
  return (
    <div className="flex h-full items-center justify-center rounded-md border border-dashed border-neutral-300 bg-white px-3 py-4 text-center">
      <p className="text-sm text-neutral-500">Empty slot</p>
    </div>
  );
}

function emptyDraftSlots(): DraftSlot[] {
  return Array.from({ length: SLOT_COUNT }, (_, slotIndex) => ({
    slot_index: slotIndex,
    widget_key: null,
    config_json: {},
  }));
}

function createDraftSlots(sheet: SheetDetail): DraftSlot[] {
  const slotsByIndex = new Map(sheet.slots.map((slot) => [slot.slot_index, slot]));

  return Array.from({ length: SLOT_COUNT }, (_, slotIndex) => {
    const slot = slotsByIndex.get(slotIndex);
    const widgetKey = slot?.widget_key;
    const definition: DashboardWidgetDefinition | undefined =
      widgetKey !== null && widgetKey !== undefined
        ? getDashboardWidgetDefinition(widgetKey)
        : undefined;

    return {
      slot_index: slotIndex,
      widget_key: definition ? definition.id : null,
      config_json: definition ? slot?.config_json ?? {} : {},
    };
  });
}
