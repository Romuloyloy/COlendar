"use client";

import Link from "next/link";
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
} from "@/components/ui";
import { formatDisplayDate, todayIsoDate } from "@/lib/date";

const SLOT_COUNT = 8;

const workspaceLinks = [
  ["Dashboard", "/"],
  ["Notes", "/notes"],
  ["Tasks", "/tasks"],
  ["Calendar", "/calendar"],
  ["Tracker", "/tracker"],
  ["Planning", "/planning"],
  ["Search", "/search"],
] as const;

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
  const [isControlOpen, setIsControlOpen] = useState(false);
  const [isSlotEditorOpen, setIsSlotEditorOpen] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState(0);
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
  const currentSheetName = sheetDetail?.name ?? "Loading sheet";
  const activeDraftSlot = draftSlots[editingSlotIndex] ?? draftSlots[0];

  async function loadSheets(preferredSheetId?: number) {
    const loadedSheets = await listSheets();
    setSheets(loadedSheets);

    const preferredExists = loadedSheets.some(
      (sheet) => sheet.id === preferredSheetId,
    );
    const selectedExists = loadedSheets.some(
      (sheet) => sheet.id === selectedSheetId,
    );
    const nextSheetId = preferredExists
      ? preferredSheetId ?? null
      : selectedExists
        ? selectedSheetId
        : loadedSheets[0]?.id ?? null;

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

  function openQuickAdd() {
    window.dispatchEvent(new Event("quick-add:open"));
    setIsControlOpen(false);
  }

  function openSlotEditor(slotIndex = editingSlotIndex) {
    setEditingSlotIndex(slotIndex);
    setIsSlotEditorOpen(true);
    setIsControlOpen(false);
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

    if (sheets.length <= 1) {
      setError("Cannot delete the last sheet. Create another sheet first.");
      return;
    }

    await runAction(async () => {
      const nextIndex = selectedSheetIndex > 0 ? selectedSheetIndex - 1 : 0;
      await deleteSheet(sheetDetail.id);
      const loadedSheets = await listSheets();
      setSheets(loadedSheets);
      const nextSheetId = loadedSheets[nextIndex]?.id ?? loadedSheets[0]?.id ?? null;
      setSelectedSheetId(nextSheetId);
      if (nextSheetId !== null) {
        await loadSheetDetail(nextSheetId);
      } else {
        setSheetDetail(null);
        setDraftSlots(emptyDraftSlots());
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
          config_json: slot.widget_key ? normalizedSlotConfig(slot) : {},
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

  function clearDraftSlot(slotIndex: number) {
    setDraftSlots((current) =>
      current.map((slot) =>
        slot.slot_index === slotIndex
          ? { ...slot, widget_key: null, config_json: {} }
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
    <main className="relative h-[calc(100vh-73px)] min-h-[680px] overflow-hidden bg-[#f2f4ef] text-neutral-900">
      <TopCenterControls
        currentSheetName={currentSheetName}
        isControlOpen={isControlOpen}
        isSaving={isSaving}
        newSheetName={newSheetName}
        onCreateSheet={handleCreateSheet}
        onDeleteSheet={handleDeleteSheet}
        onNextSheet={selectNextSheet}
        onOpenQuickAdd={openQuickAdd}
        onOpenSlotEditor={() => openSlotEditor()}
        onPreviousSheet={selectPreviousSheet}
        onRenameSheet={handleRenameSheet}
        onResetSheets={handleResetSheets}
        onSelectedSheetChange={(sheetId) => setSelectedSheetId(sheetId)}
        onSetControlOpen={setIsControlOpen}
        renameValue={renameValue}
        selectedDate={selectedDate}
        selectedDateLabel={selectedDateLabel}
        selectedSheetId={selectedSheetId}
        selectedSheetIndex={selectedSheetIndex}
        setNewSheetName={setNewSheetName}
        setRenameValue={setRenameValue}
        setSelectedDate={setSelectedDate}
        sheets={sheets}
      />

      <section className="flex h-full flex-col px-6 pb-6 pt-14">
        <div className="mb-3 flex min-h-10 items-center justify-between gap-4">
          <button
            className="rounded-md border border-neutral-300 bg-white/90 px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving || selectedSheetIndex <= 0}
            onClick={selectPreviousSheet}
            type="button"
          >
            Previous
          </button>
          <div className="min-w-0 text-center">
            <p className="text-xs font-semibold uppercase tracking-normal text-teal-700">
              Sheet Workspace
            </p>
            <h1 className="truncate text-2xl font-semibold text-neutral-950">
              {currentSheetName}
            </h1>
          </div>
          <button
            className="rounded-md border border-neutral-300 bg-white/90 px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
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

        <div className="mb-3 min-h-10">
          {error ? <ErrorState message={error} /> : null}
          {!error && notice ? <NoticeState message={notice} /> : null}
        </div>

        {isLoading ? (
          <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border border-neutral-300 bg-white">
            <LoadingState message="Loading sheet workspace..." />
          </div>
        ) : (
          <SheetGrid
            draftSlots={draftSlots}
            isSummaryReady={summary !== null}
            onEditSlot={openSlotEditor}
            taskCategories={categories}
            widgetProps={widgetProps}
          />
        )}
      </section>

      {isSlotEditorOpen ? (
        <SlotEditorPanel
          activeSlot={activeDraftSlot}
          categories={categories}
          draftSlots={draftSlots}
          isSaving={isSaving}
          onClearSlot={clearDraftSlot}
          onClose={() => setIsSlotEditorOpen(false)}
          onSaveSlots={handleSaveSlots}
          onSelectSlot={setEditingSlotIndex}
          onUpdateSlot={updateDraftSlot}
          onUpdateSlotConfig={updateDraftSlotConfig}
          sheetName={currentSheetName}
        />
      ) : null}
    </main>
  );
}

function TopCenterControls({
  currentSheetName,
  isControlOpen,
  isSaving,
  newSheetName,
  onCreateSheet,
  onDeleteSheet,
  onNextSheet,
  onOpenQuickAdd,
  onOpenSlotEditor,
  onPreviousSheet,
  onRenameSheet,
  onResetSheets,
  onSelectedSheetChange,
  onSetControlOpen,
  renameValue,
  selectedDate,
  selectedDateLabel,
  selectedSheetId,
  selectedSheetIndex,
  setNewSheetName,
  setRenameValue,
  setSelectedDate,
  sheets,
}: {
  currentSheetName: string;
  isControlOpen: boolean;
  isSaving: boolean;
  newSheetName: string;
  onCreateSheet: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onDeleteSheet: () => Promise<void>;
  onNextSheet: () => void;
  onOpenQuickAdd: () => void;
  onOpenSlotEditor: () => void;
  onPreviousSheet: () => void;
  onRenameSheet: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onResetSheets: () => Promise<void>;
  onSelectedSheetChange: (sheetId: number) => void;
  onSetControlOpen: (isOpen: boolean) => void;
  renameValue: string;
  selectedDate: string;
  selectedDateLabel: string;
  selectedSheetId: number | null;
  selectedSheetIndex: number;
  setNewSheetName: (value: string) => void;
  setRenameValue: (value: string) => void;
  setSelectedDate: (value: string) => void;
  sheets: Sheet[];
}) {
  return (
    <div className="absolute left-1/2 top-2 z-30 w-[min(92vw,760px)] -translate-x-1/2">
      <div className="flex justify-center">
        <button
          className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50"
          onClick={() => onSetControlOpen(!isControlOpen)}
          type="button"
        >
          {currentSheetName} · Workspace
        </button>
      </div>

      {isControlOpen ? (
        <div className="mt-2 rounded-md border border-neutral-300 bg-white p-4 shadow-xl">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.25fr]">
            <section>
              <p className="text-xs font-semibold uppercase tracking-normal text-teal-700">
                App Areas
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {workspaceLinks.map(([label, href]) => (
                  <Link
                    className="rounded-md border border-neutral-300 px-3 py-2 text-center text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
                    href={href}
                    key={href}
                  >
                    {label}
                  </Link>
                ))}
              </div>
              <button
                className="mt-3 w-full rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800"
                onClick={onOpenQuickAdd}
                type="button"
              >
                Quick Add
              </button>
              <DateSelector
                className="mt-3"
                label={`Widget date (${selectedDateLabel})`}
                onChange={setSelectedDate}
                value={selectedDate}
              />
            </section>

            <section className="border-t border-neutral-200 pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-teal-700">
                Sheet Controls
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-[auto_1fr_auto]">
                <button
                  className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSaving || selectedSheetIndex <= 0}
                  onClick={onPreviousSheet}
                  type="button"
                >
                  Previous
                </button>
                <select
                  className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  disabled={isSaving || sheets.length === 0}
                  onChange={(event) => onSelectedSheetChange(Number(event.target.value))}
                  value={selectedSheetId ?? ""}
                >
                  {sheets.map((sheet) => (
                    <option key={sheet.id} value={sheet.id}>
                      {sheet.name}
                    </option>
                  ))}
                </select>
                <button
                  className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    isSaving ||
                    selectedSheetIndex < 0 ||
                    selectedSheetIndex >= sheets.length - 1
                  }
                  onClick={onNextSheet}
                  type="button"
                >
                  Next
                </button>
              </div>

              <form className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={onCreateSheet}>
                <input
                  className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  onChange={(event) => setNewSheetName(event.target.value)}
                  placeholder="New sheet name"
                  required
                  type="text"
                  value={newSheetName}
                />
                <button
                  className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSaving}
                  type="submit"
                >
                  Create
                </button>
              </form>

              <form className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_auto]" onSubmit={onRenameSheet}>
                <input
                  className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  disabled={isSaving || selectedSheetId === null}
                  onChange={(event) => setRenameValue(event.target.value)}
                  required
                  type="text"
                  value={renameValue}
                />
                <button
                  className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSaving || selectedSheetId === null}
                  type="submit"
                >
                  Rename
                </button>
                <button
                  className="rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSaving || selectedSheetId === null || sheets.length <= 1}
                  onClick={onDeleteSheet}
                  type="button"
                  title={
                    sheets.length <= 1
                      ? "Create another sheet before deleting this one."
                      : "Delete current sheet"
                  }
                >
                  Delete
                </button>
              </form>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSaving || selectedSheetId === null}
                  onClick={onOpenSlotEditor}
                  type="button"
                >
                  Customize slots
                </button>
                <button
                  className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSaving}
                  onClick={onResetSheets}
                  type="button"
                >
                  Reset default
                </button>
                <button
                  className="ml-auto rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
                  onClick={() => onSetControlOpen(false)}
                  type="button"
                >
                  Close
                </button>
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SheetGrid({
  draftSlots,
  isSummaryReady,
  onEditSlot,
  taskCategories,
  widgetProps,
}: {
  draftSlots: DraftSlot[];
  isSummaryReady: boolean;
  onEditSlot: (slotIndex: number) => void;
  taskCategories: TaskCategory[];
  widgetProps: DashboardWidgetProps | null;
}) {
  return (
    <section className="grid min-h-0 flex-1 grid-cols-4 grid-rows-2 gap-3">
      {draftSlots.map((slot) => {
        const definition = slot.widget_key
          ? getDashboardWidgetDefinition(slot.widget_key)
          : undefined;
        return (
          <div
            className="min-h-0 overflow-hidden rounded-md border border-neutral-300 bg-neutral-50 shadow-sm"
            key={slot.slot_index}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-neutral-200 bg-white px-3">
                <p className="text-xs font-semibold uppercase tracking-normal text-neutral-500">
                  Slot {slot.slot_index + 1}
                </p>
                <button
                  className="min-w-0 truncate rounded-md px-2 py-1 text-right text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                  onClick={() => onEditSlot(slot.slot_index)}
                  title="Edit slot"
                  type="button"
                >
                  {definition?.displayName ?? "Empty"}
                </button>
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
                  <CompactState message="Loading..." />
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

function SlotEditorPanel({
  activeSlot,
  categories,
  draftSlots,
  isSaving,
  onClearSlot,
  onClose,
  onSaveSlots,
  onSelectSlot,
  onUpdateSlot,
  onUpdateSlotConfig,
  sheetName,
}: {
  activeSlot: DraftSlot;
  categories: TaskCategory[];
  draftSlots: DraftSlot[];
  isSaving: boolean;
  onClearSlot: (slotIndex: number) => void;
  onClose: () => void;
  onSaveSlots: () => Promise<void>;
  onSelectSlot: (slotIndex: number) => void;
  onUpdateSlot: (slotIndex: number, widgetKey: string) => void;
  onUpdateSlotConfig: (
    slotIndex: number,
    key: "category_id" | "title_override",
    value: string,
  ) => void;
  sheetName: string;
}) {
  const activeDefinition = activeSlot.widget_key
    ? getDashboardWidgetDefinition(activeSlot.widget_key)
    : undefined;
  const supportsTaskCategory =
    activeSlot.widget_key === "daily-tasks" ||
    activeSlot.widget_key === "weekly-tasks";
  const supportsTitleOverride = supportsTaskCategory;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-neutral-950/30 px-6 py-6">
      <section className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-md border border-neutral-300 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-teal-700">
              Slot Editor
            </p>
            <h2 className="truncate text-xl font-semibold text-neutral-950">
              {sheetName} · Slot {activeSlot.slot_index + 1}
            </h2>
          </div>
          <button
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 overflow-auto p-5 lg:grid-cols-[220px_1fr]">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Choose slot</p>
            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
              {draftSlots.map((slot) => {
                const definition = slot.widget_key
                  ? getDashboardWidgetDefinition(slot.widget_key)
                  : undefined;
                const isActive = slot.slot_index === activeSlot.slot_index;
                return (
                  <button
                    className={`rounded-md border px-3 py-2 text-left text-sm ${
                      isActive
                        ? "border-teal-700 bg-teal-50 text-teal-900"
                        : "border-neutral-300 text-neutral-800 hover:bg-neutral-100"
                    }`}
                    key={slot.slot_index}
                    onClick={() => onSelectSlot(slot.slot_index)}
                    type="button"
                  >
                    <span className="block font-semibold">
                      Slot {slot.slot_index + 1}
                    </span>
                    <span className="block truncate text-xs">
                      {definition?.displayName ?? "Empty"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-0">
            <label className="block text-sm font-semibold text-neutral-900">
              Widget type for slot {activeSlot.slot_index + 1}
              <select
                className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                disabled={isSaving}
                onChange={(event) =>
                  onUpdateSlot(activeSlot.slot_index, event.target.value)
                }
                value={activeSlot.widget_key ?? ""}
              >
                <option value="">Empty</option>
                {DEFAULT_DASHBOARD_WIDGET_DEFINITIONS.map((definition) => (
                  <option key={definition.id} value={definition.id}>
                    {definition.displayName}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-semibold text-neutral-900">
                {activeDefinition?.displayName ?? "Empty slot"}
              </p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                {activeDefinition?.description ??
                  "This slot will stay empty until you choose a widget type."}
              </p>
            </div>

            {supportsTaskCategory ? (
              <label className="mt-4 block text-sm font-semibold text-neutral-900">
                Category filter
                <select
                  className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  disabled={isSaving}
                  onChange={(event) =>
                    onUpdateSlotConfig(
                      activeSlot.slot_index,
                      "category_id",
                      event.target.value,
                    )
                  }
                  value={activeSlot.config_json.category_id ?? ""}
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {supportsTitleOverride ? (
              <label className="mt-4 block text-sm font-semibold text-neutral-900">
                Title override
                <input
                  className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  disabled={isSaving}
                  onChange={(event) =>
                    onUpdateSlotConfig(
                      activeSlot.slot_index,
                      "title_override",
                      event.target.value,
                    )
                  }
                  placeholder="Optional compact title"
                  type="text"
                  value={activeSlot.config_json.title_override ?? ""}
                />
              </label>
            ) : null}

            <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-neutral-200 pt-4">
              <button
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSaving}
                onClick={() => onClearSlot(activeSlot.slot_index)}
                type="button"
              >
                Clear slot
              </button>
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
                  onClick={onClose}
                  type="button"
                >
                  Done
                </button>
                <button
                  className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSaving}
                  onClick={onSaveSlots}
                  type="button"
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function EmptySlot() {
  return (
    <div className="flex h-full items-center justify-center rounded-md border border-dashed border-neutral-300 bg-white px-3 py-4 text-center">
      <p className="text-sm text-neutral-500">Empty slot</p>
    </div>
  );
}

function CompactState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-md bg-white px-3 py-4 text-center">
      <p className="text-sm text-neutral-600">{message}</p>
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

function normalizedSlotConfig(slot: DraftSlot) {
  if (slot.widget_key !== "daily-tasks" && slot.widget_key !== "weekly-tasks") {
    return {};
  }

  return {
    category_id: slot.config_json.category_id ?? null,
    title_override: slot.config_json.title_override ?? "",
  };
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
