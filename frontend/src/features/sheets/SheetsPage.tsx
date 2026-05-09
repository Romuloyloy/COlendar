"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  createSheet,
  deleteSheet,
  getSheet,
  listSheets,
  moveSheetLeft,
  moveSheetRight,
  renameSheet,
  resetDefaultSheets,
  updateSheetSlots,
} from "./api";
import type { Sheet, SheetDetail } from "./types";
import {
  getDashboardSummary,
  getDashboardWidgetLayout,
} from "@/features/dashboard/api";
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
import type { Note } from "@/features/notes/types";
import {
  completeDailyTask,
  completeWeeklyTask,
  getTaskCategories,
  incompleteDailyTask,
  incompleteWeeklyTask,
} from "@/features/tasks/api";
import type { TaskCategory } from "@/features/tasks/types";
import {
  AppButton,
  DateNavigator,
  ErrorState,
  LoadingState,
  NoticeState,
  inputClassName,
} from "@/components/ui";
import { formatDisplayDate, todayIsoDate } from "@/lib/date";

const SLOT_COUNT = 8;
const LAST_ACTIVE_SHEET_STORAGE_KEY = "calendar:last-active-sheet-id";

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

type PendingConfirmation = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
} | null;

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
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmation>(null);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);

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
  const hasUnsavedSlotChanges = useMemo(() => {
    if (!sheetDetail) {
      return false;
    }
    return (
      JSON.stringify(draftSlots.map(normalizedDraftSlotForCompare)) !==
      JSON.stringify(createDraftSlots(sheetDetail).map(normalizedDraftSlotForCompare))
    );
  }, [draftSlots, sheetDetail]);

  function selectSheet(sheetId: number | null) {
    setSelectedSheetId(sheetId);
    if (sheetId !== null) {
      window.localStorage.setItem(LAST_ACTIVE_SHEET_STORAGE_KEY, String(sheetId));
    }
  }

  function savedSheetId() {
    const value = window.localStorage.getItem(LAST_ACTIVE_SHEET_STORAGE_KEY);
    if (!value) {
      return undefined;
    }
    const sheetId = Number(value);
    return Number.isInteger(sheetId) ? sheetId : undefined;
  }

  async function loadSheets(preferredSheetId?: number) {
    const loadedSheets = await listSheets();
    setSheets(loadedSheets);

    const savedId = savedSheetId();
    const targetSheetId = preferredSheetId ?? selectedSheetId ?? savedId;
    const preferredExists = loadedSheets.some(
      (sheet) => sheet.id === targetSheetId,
    );
    const nextSheetId = preferredExists
      ? targetSheetId ?? null
      : loadedSheets[0]?.id ?? null;

    selectSheet(nextSheetId);
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
    loadSheetDetail(selectedSheetId).catch((caught: Error) => {
      if (caught.message === "Sheet not found") {
        void loadSheets().then((sheetId) => {
          if (sheetId !== null) {
            void loadSheetDetail(sheetId);
          }
        });
        return;
      }
      setError(caught.message);
    });
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

  useEffect(() => {
    function handleWorkspaceKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "Escape") {
        if (isSlotEditorOpen) {
          event.preventDefault();
          setIsSlotEditorOpen(false);
          return;
        }
        if (isControlOpen) {
          event.preventDefault();
          setIsControlOpen(false);
        }
        return;
      }

      if (isSlotEditorOpen || isControlOpen) {
        return;
      }

      if (event.key === "ArrowLeft" && selectedSheetIndex > 0) {
        event.preventDefault();
        selectPreviousSheet();
      } else if (
        event.key === "ArrowRight" &&
        selectedSheetIndex >= 0 &&
        selectedSheetIndex < sheets.length - 1
      ) {
        event.preventDefault();
        selectNextSheet();
      } else if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "a"
      ) {
        event.preventDefault();
        openQuickAdd();
      }
    }

    window.addEventListener("keydown", handleWorkspaceKeyDown);
    return () => window.removeEventListener("keydown", handleWorkspaceKeyDown);
  }, [isControlOpen, isSlotEditorOpen, selectedSheetIndex, sheets.length]);

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
      selectSheet(sheets[selectedSheetIndex - 1].id);
    }
  }

  function selectNextSheet() {
    if (selectedSheetIndex >= 0 && selectedSheetIndex < sheets.length - 1) {
      selectSheet(sheets[selectedSheetIndex + 1].id);
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
      setIsControlOpen(false);
      setNotice(`Sheet "${created.name}" created and selected.`);
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

  function requestDeleteSheet() {
    if (!sheetDetail) {
      return;
    }

    if (sheets.length <= 1) {
      setError("Cannot delete the last sheet. Create another sheet first.");
      return;
    }

    setPendingConfirmation({
      title: "Delete sheet?",
      message: `This will permanently delete "${sheetDetail.name}" and its slot layout. The widgets' source data, like tasks and notes, will not be deleted.`,
      confirmLabel: "Delete sheet",
      onConfirm: handleDeleteSheet,
    });
  }

  async function handleDeleteSheet() {
    if (!sheetDetail) {
      return;
    }

    await runAction(async () => {
      const nextIndex = selectedSheetIndex > 0 ? selectedSheetIndex - 1 : 0;
      await deleteSheet(sheetDetail.id);
      const loadedSheets = await listSheets();
      setSheets(loadedSheets);
      const nextSheetId = loadedSheets[nextIndex]?.id ?? loadedSheets[0]?.id ?? null;
      selectSheet(nextSheetId);
      if (nextSheetId !== null) {
        await loadSheetDetail(nextSheetId);
      } else {
        setSheetDetail(null);
        setDraftSlots(emptyDraftSlots());
      }
      setIsSlotEditorOpen(false);
      setIsControlOpen(false);
      setNotice("Sheet deleted.");
    });
  }

  function requestResetSheets() {
    setPendingConfirmation({
      title: "Reset sheets?",
      message:
        "This will delete all current sheets and restore the default Today, Planning, and Health sheets. Sheet slot layouts will be replaced.",
      confirmLabel: "Reset sheets",
      onConfirm: handleResetSheets,
    });
  }

  async function handleResetSheets() {
    await runAction(async () => {
      const resetSheets = await resetDefaultSheets();
      setSheets(resetSheets);
      const nextSheetId = resetSheets[0]?.id ?? null;
      selectSheet(nextSheetId);
      if (nextSheetId !== null) {
        await loadSheetDetail(nextSheetId);
      }
      setEditingSlotIndex(0);
      setIsSlotEditorOpen(false);
      setIsControlOpen(false);
      setNotice("Default sheets restored.");
    });
  }

  function requestResetCurrentSheetFromDashboard() {
    if (!sheetDetail) {
      return;
    }

    setPendingConfirmation({
      title: "Use dashboard layout?",
      message: `This will replace every slot on "${sheetDetail.name}" with the current dashboard widget layout.`,
      confirmLabel: "Use dashboard layout",
      onConfirm: handleResetCurrentSheetFromDashboard,
    });
  }

  async function handleResetCurrentSheetFromDashboard() {
    if (!sheetDetail) {
      return;
    }

    await runAction(async () => {
      const layout = await getDashboardWidgetLayout();
      const visibleWidgetKeys = layout.widgets
        .filter((widget) => widget.is_visible)
        .map((widget) => widget.widget_key)
        .filter((widgetKey): widgetKey is DashboardWidgetId =>
          Boolean(getDashboardWidgetDefinition(widgetKey)),
        )
        .slice(0, SLOT_COUNT);
      const nextSlots = Array.from({ length: SLOT_COUNT }, (_, slotIndex) => ({
        slot_index: slotIndex,
        widget_key: visibleWidgetKeys[slotIndex] ?? null,
        config_json: {},
      }));

      const updated = await updateSheetSlots(sheetDetail.id, {
        slots: nextSlots,
      });
      setSheetDetail(updated);
      setDraftSlots(createDraftSlots(updated));
      setEditingSlotIndex(0);
      setIsSlotEditorOpen(false);
      setIsControlOpen(false);
      setNotice("Current sheet reset to dashboard-style layout.");
    });
  }

  async function handleMoveSheetLeft() {
    if (!sheetDetail || selectedSheetIndex <= 0) {
      return;
    }

    await runAction(async () => {
      const movedSheets = await moveSheetLeft(sheetDetail.id);
      setSheets(movedSheets);
      selectSheet(sheetDetail.id);
      setNotice("Sheet moved left.");
    });
  }

  async function handleMoveSheetRight() {
    if (!sheetDetail || selectedSheetIndex < 0 || selectedSheetIndex >= sheets.length - 1) {
      return;
    }

    await runAction(async () => {
      const movedSheets = await moveSheetRight(sheetDetail.id);
      setSheets(movedSheets);
      selectSheet(sheetDetail.id);
      setNotice("Sheet moved right.");
    });
  }

  async function confirmPendingAction() {
    if (!pendingConfirmation) {
      return;
    }
    const action = pendingConfirmation.onConfirm;
    setPendingConfirmation(null);
    await action();
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
      setEditingSlotIndex((current) => Math.min(current, SLOT_COUNT - 1));
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
    setNotice(null);
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
    setNotice(null);
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
    setNotice(null);
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
    <main className="sheet-canvas relative h-[calc(100vh-73px)] min-h-[680px] overflow-hidden text-[#2c2925]">
      <TopCenterControls
        currentSheetName={currentSheetName}
        isControlOpen={isControlOpen}
        isSaving={isSaving}
        newSheetName={newSheetName}
        onCreateSheet={handleCreateSheet}
        onMoveSheetLeft={handleMoveSheetLeft}
        onMoveSheetRight={handleMoveSheetRight}
        onNextSheet={selectNextSheet}
        onOpenQuickAdd={openQuickAdd}
        onOpenSlotEditor={() => openSlotEditor()}
        onPreviousSheet={selectPreviousSheet}
        onRenameSheet={handleRenameSheet}
        onRequestDeleteSheet={requestDeleteSheet}
        onResetCurrentSheetFromDashboard={requestResetCurrentSheetFromDashboard}
        onResetSheets={requestResetSheets}
        onSelectedSheetChange={selectSheet}
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
          <AppButton
            className="bg-[#fffdf8]/80"
            disabled={isSaving || selectedSheetIndex <= 0}
            onClick={selectPreviousSheet}
            type="button"
          >
            Previous
          </AppButton>
          <div className="min-w-0 text-center">
            <p className="app-eyebrow">
              Sheet Workspace
            </p>
            <h1 className="truncate text-2xl font-semibold text-[#2c2925]">
              {currentSheetName}
            </h1>
          </div>
          <AppButton
            className="bg-[#fffdf8]/80"
            disabled={
              isSaving ||
              selectedSheetIndex < 0 ||
              selectedSheetIndex >= sheets.length - 1
            }
            onClick={selectNextSheet}
            type="button"
          >
            Next
          </AppButton>
        </div>

        <div className="mb-3 min-h-10">
          {error ? <ErrorState message={error} /> : null}
          {!error && notice ? <NoticeState message={notice} /> : null}
        </div>

        {isLoading ? (
          <div className="app-card flex min-h-0 flex-1 items-center justify-center">
            <LoadingState message="Loading sheet workspace..." />
          </div>
        ) : (
          <SheetGrid
            draftSlots={draftSlots}
            isSummaryReady={summary !== null}
            onEditSlot={openSlotEditor}
            onPreviewNote={setPreviewNote}
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
          hasUnsavedChanges={hasUnsavedSlotChanges}
          sheetName={currentSheetName}
        />
      ) : null}
      {previewNote ? (
        <NotePreviewModal
          note={previewNote}
          onClose={() => setPreviewNote(null)}
        />
      ) : null}
      {pendingConfirmation ? (
        <ConfirmModal
          confirmLabel={pendingConfirmation.confirmLabel}
          isSaving={isSaving}
          message={pendingConfirmation.message}
          onCancel={() => setPendingConfirmation(null)}
          onConfirm={confirmPendingAction}
          title={pendingConfirmation.title}
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
  onMoveSheetLeft,
  onMoveSheetRight,
  onNextSheet,
  onOpenQuickAdd,
  onOpenSlotEditor,
  onPreviousSheet,
  onRenameSheet,
  onRequestDeleteSheet,
  onResetCurrentSheetFromDashboard,
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
  onMoveSheetLeft: () => Promise<void>;
  onMoveSheetRight: () => Promise<void>;
  onNextSheet: () => void;
  onOpenQuickAdd: () => void;
  onOpenSlotEditor: () => void;
  onPreviousSheet: () => void;
  onRenameSheet: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onRequestDeleteSheet: () => void;
  onResetCurrentSheetFromDashboard: () => void;
  onResetSheets: () => void;
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
          className="rounded-full border border-[#d8d0c3] bg-[#fffdf8]/90 px-4 py-2 text-sm font-semibold text-[#2c2925] shadow-[0_8px_22px_rgb(82_70_55_/_0.10)] backdrop-blur hover:bg-white"
          onClick={() => onSetControlOpen(!isControlOpen)}
          type="button"
        >
          {currentSheetName} - Workspace
        </button>
      </div>

      {isControlOpen ? (
        <div className="sheet-floating-panel mt-2 p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.25fr]">
            <section>
              <p className="app-eyebrow">
                App Areas
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {workspaceLinks.map(([label, href]) => (
                  <Link
                    className="app-button-secondary min-h-9 px-3 py-2 text-center"
                    href={href}
                    key={href}
                  >
                    {label}
                  </Link>
                ))}
              </div>
              <button
                className="app-button-primary mt-3 w-full"
                onClick={onOpenQuickAdd}
                type="button"
              >
                Quick Add
              </button>
              <div className="mt-3 rounded-xl border border-[#ded6ca] bg-[#fbf8f2] px-3 py-2 text-xs leading-5 text-[#766f66]">
                Shortcuts: Left/Right changes sheets, Esc closes panels,
                Ctrl+Shift+A opens Quick Add.
              </div>
              <DateNavigator
                className="mt-3"
                label={`Widget date (${selectedDateLabel})`}
                onChange={setSelectedDate}
                value={selectedDate}
              />
            </section>

            <section className="border-t border-[#ded6ca] pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
              <p className="app-eyebrow">
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
                  className={inputClassName}
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
                  className={inputClassName}
                  onChange={(event) => setNewSheetName(event.target.value)}
                  placeholder="New sheet name"
                  required
                  type="text"
                  value={newSheetName}
                />
                <button
                  className="app-button-primary"
                  disabled={isSaving}
                  type="submit"
                >
                  Create
                </button>
              </form>

              <form className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_auto]" onSubmit={onRenameSheet}>
                <input
                  className={inputClassName}
                  disabled={isSaving || selectedSheetId === null}
                  onChange={(event) => setRenameValue(event.target.value)}
                  required
                  type="text"
                  value={renameValue}
                />
                <button
                  className="app-button-secondary"
                  disabled={isSaving || selectedSheetId === null}
                  type="submit"
                >
                  Rename
                </button>
              </form>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="app-button-primary"
                  disabled={isSaving || selectedSheetId === null}
                  onClick={onOpenSlotEditor}
                  type="button"
                >
                  Customize slots
                </button>
                <button
                  className="app-button-secondary"
                  disabled={isSaving || selectedSheetIndex <= 0}
                  onClick={onMoveSheetLeft}
                  type="button"
                >
                  Move left
                </button>
                <button
                  className="app-button-secondary"
                  disabled={
                    isSaving ||
                    selectedSheetIndex < 0 ||
                    selectedSheetIndex >= sheets.length - 1
                  }
                  onClick={onMoveSheetRight}
                  type="button"
                >
                  Move right
                </button>
                <button
                  className="app-button-secondary ml-auto"
                  onClick={() => onSetControlOpen(false)}
                  type="button"
                >
                  Close
                </button>
              </div>

              <details className="mt-3 rounded-xl border border-[#ded6ca] bg-[#fbf8f2] p-3">
                <summary className="cursor-pointer text-sm font-semibold text-[#3b3732]">
                  Advanced
                </summary>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="app-button-danger"
                    disabled={isSaving || selectedSheetId === null || sheets.length <= 1}
                    onClick={onRequestDeleteSheet}
                    type="button"
                    title={
                      sheets.length <= 1
                        ? "Create another sheet before deleting this one."
                        : "Delete current sheet"
                    }
                  >
                    Delete sheet
                  </button>
                <button
                  className="app-button-danger"
                  disabled={isSaving}
                  onClick={onResetSheets}
                  type="button"
                >
                  Reset sheets
                </button>
                <button
                  className="app-button-danger"
                  disabled={isSaving || selectedSheetId === null}
                  onClick={onResetCurrentSheetFromDashboard}
                  type="button"
                >
                  Use dashboard layout
                </button>
                </div>
              </details>
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
  onPreviewNote,
  taskCategories,
  widgetProps,
}: {
  draftSlots: DraftSlot[];
  isSummaryReady: boolean;
  onEditSlot: (slotIndex: number) => void;
  onPreviewNote: (note: Note) => void;
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
            className="sheet-tile"
            key={slot.slot_index}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-[#ded6ca] bg-[#fffdf8]/86 px-3">
                <p className="text-xs font-semibold uppercase tracking-normal text-[#8b8176]">
                  Slot {slot.slot_index + 1}
                </p>
                <button
                  className="min-w-0 truncate rounded-full px-2 py-1 text-right text-xs font-semibold text-[#625c55] hover:bg-[#f0f4ec]"
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
                      onPreviewNote,
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

function ConfirmModal({
  confirmLabel,
  isSaving,
  message,
  onCancel,
  onConfirm,
  title,
}: {
  confirmLabel: string;
  isSaving: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  title: string;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#2c2925]/40 px-6 backdrop-blur-sm">
      <section className="sheet-floating-panel w-full max-w-md p-5">
        <h2 className="text-lg font-semibold text-[#2c2925]">{title}</h2>
        <p className="app-muted mt-3 text-sm leading-6">{message}</p>
        <div className="mt-5 flex justify-end gap-3 border-t border-[#ded6ca] pt-4">
          <button
            className="app-button-secondary"
            disabled={isSaving}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="app-button-danger bg-[#b46b73] text-white hover:bg-[#9d515b]"
            disabled={isSaving}
            onClick={onConfirm}
            type="button"
          >
            {isSaving ? "Working..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function NotePreviewModal({
  note,
  onClose,
}: {
  note: Note;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#2c2925]/40 px-6 backdrop-blur-sm">
      <section className="sheet-floating-panel flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-[#ded6ca] px-5 py-4">
          <div className="min-w-0">
            <p className="app-eyebrow">
              Note Preview
            </p>
            <h2 className="mt-1 truncate text-xl font-semibold text-[#2c2925]">
              {note.title}
            </h2>
            <p className="app-muted mt-1 text-xs">
              Folder: {note.folder_id === null ? "None" : `#${note.folder_id}`}
            </p>
          </div>
          <button
            className="app-button-secondary min-h-8 px-3 py-1.5 text-xs"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          <p className="whitespace-pre-wrap text-sm leading-6 text-[#3b3732]">
            {note.content.trim() || "No note body yet."}
          </p>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#ded6ca] px-5 py-4">
          <button
            className="app-button-secondary"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
          <Link
            className="app-button-primary"
            href="/notes"
          >
            Open in Notes
          </Link>
        </div>
      </section>
    </div>
  );
}

function SlotEditorPanel({
  activeSlot,
  categories,
  draftSlots,
  hasUnsavedChanges,
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
  hasUnsavedChanges: boolean;
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
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#2c2925]/35 px-6 py-6 backdrop-blur-sm">
      <section className="sheet-floating-panel flex max-h-full w-full max-w-4xl flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-[#ded6ca] px-5 py-4">
          <div className="min-w-0">
            <p className="app-eyebrow">
              Slot Editor
            </p>
            <h2 className="truncate text-xl font-semibold text-[#2c2925]">
              {sheetName} - Slot {activeSlot.slot_index + 1}
            </h2>
            <p className="app-muted mt-1 text-sm">
              {hasUnsavedChanges
                ? "Unsaved slot changes"
                : "All slot changes are saved"}
            </p>
          </div>
          <button
            className="app-button-secondary min-h-8 px-3 py-1.5 text-xs"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 overflow-auto p-5 lg:grid-cols-[220px_1fr]">
          <div>
            <p className="text-sm font-semibold text-[#2c2925]">Choose slot</p>
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
                        ? "border-[#5f8f83] bg-[#eef7f1] text-[#3f7168]"
                        : "border-[#ded6ca] text-[#3b3732] hover:bg-[#f0f4ec]"
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
            <label className="block text-sm font-semibold text-[#2c2925]">
              Widget type for slot {activeSlot.slot_index + 1}
              <select
                className={inputClassName}
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

            <div className="mt-4 rounded-xl border border-[#ded6ca] bg-[#fbf8f2] p-4">
              <p className="text-sm font-semibold text-[#2c2925]">
                {activeDefinition?.displayName ?? "Empty slot"}
              </p>
              <p className="app-muted mt-1 text-sm leading-6">
                {activeDefinition?.description ??
                  "This slot will stay empty until you choose a widget type."}
              </p>
              <dl className="mt-3 grid gap-2 text-xs text-[#625c55] sm:grid-cols-3">
                <div>
                  <dt className="font-semibold uppercase text-[#8b8176]">
                    Widget
                  </dt>
                  <dd className="truncate">
                    {activeDefinition?.displayName ?? "Empty"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase text-[#8b8176]">
                    Category
                  </dt>
                  <dd className="truncate">
                    {activeSlot.config_json.category_id
                      ? categories.find(
                          (category) =>
                            category.id === activeSlot.config_json.category_id,
                        )?.name ?? "Unknown"
                      : "All"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase text-[#8b8176]">
                    Title
                  </dt>
                  <dd className="truncate">
                    {activeSlot.config_json.title_override?.trim() || "Default"}
                  </dd>
                </div>
              </dl>
            </div>

            {supportsTaskCategory ? (
              <label className="mt-4 block text-sm font-semibold text-[#2c2925]">
                Category filter
                <select
                  className={inputClassName}
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
              <label className="mt-4 block text-sm font-semibold text-[#2c2925]">
                Title override
                <span className="app-muted mt-1 block text-xs font-normal leading-5">
                  Optional label for this widget instance only.
                </span>
                <input
                  className={inputClassName}
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

            <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-[#ded6ca] pt-4">
              <button
                className="app-button-secondary"
                disabled={isSaving}
                onClick={() => onClearSlot(activeSlot.slot_index)}
                type="button"
              >
                Clear selected slot
              </button>
              <div className="flex flex-wrap gap-3">
                <button
                  className="app-button-secondary"
                  onClick={onClose}
                  type="button"
                >
                  Done
                </button>
                <button
                  className="app-button-primary"
                  disabled={isSaving}
                  onClick={onSaveSlots}
                  type="button"
                >
                  {isSaving
                    ? "Saving..."
                    : hasUnsavedChanges
                      ? "Save changes"
                      : "Saved"}
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
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#cbbfb0] bg-[#fbf8f2] px-3 py-4 text-center">
      <p className="text-sm text-[#8b8176]">Empty slot</p>
    </div>
  );
}

function CompactState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl bg-[#fbf8f2] px-3 py-4 text-center">
      <p className="text-sm text-[#766f66]">{message}</p>
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

function normalizedDraftSlotForCompare(slot: DraftSlot) {
  return {
    slot_index: slot.slot_index,
    widget_key: slot.widget_key,
    config_json: slot.widget_key ? normalizedSlotConfig(slot) : {},
  };
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
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
