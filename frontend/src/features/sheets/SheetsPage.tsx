"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  createSheet,
  deleteSheet,
  getSheet,
  listSheets,
  moveSheetLeft,
  moveSheetRight,
  resetDefaultSheets,
  updateSheet,
  updateSheetSlots,
} from "./api";
import type { Sheet, SheetDetail, SheetWidgetCategoryMode } from "./types";
import {
  getDashboardSummary,
  getDashboardWidgetLayout,
} from "@/features/dashboard/api";
import {
  DASHBOARD_WIDGET_REGISTRY,
  DEFAULT_DASHBOARD_WIDGET_DEFINITIONS,
  getDashboardWidgetDefinition,
} from "@/features/dashboard/dashboard-widget-registry";
import { WidgetRenderer } from "@/features/dashboard/WidgetRenderer";
import type {
  DashboardSummary,
  DashboardWeeklyTask,
} from "@/features/dashboard/types";
import type { CalendarEvent } from "@/features/calendar/types";
import type {
  DashboardWidgetDefinition,
  DashboardWidgetId,
  DashboardWidgetLibraryGroup,
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
import { formatDisplayDate, formatTime, todayIsoDate } from "@/lib/date";

const SLOT_COUNT = 8;
const GRID_COLUMNS = 4;
const LAST_ACTIVE_SHEET_STORAGE_KEY = "calendar:last-active-sheet-id";
const SHEETS_STARK_MODE_STORAGE_KEY = "calendar:sheets-stark-mode";

const workspaceLinks = [
  ["Sheets", "/sheets"],
  ["Review", "/review"],
  ["Notes", "/notes"],
  ["Tasks", "/tasks"],
  ["Calendar", "/calendar"],
  ["Tracker", "/tracker"],
  ["Categories", "/categories"],
  ["Search", "/search"],
] as const;

const WIDGET_LIBRARY_GROUPS: DashboardWidgetLibraryGroup[] = [
  "Overview / Utility",
  "Tasks",
  "Notes",
  "Calendar",
  "Tracker",
];

const SHEET_WIDGET_DEFINITIONS = [...DASHBOARD_WIDGET_REGISTRY].sort(
  (left, right) => left.defaultOrder - right.defaultOrder,
);

const SLOT_SIZE_OPTIONS = [
  { label: "Normal", description: "1 cell", colSpan: 1, rowSpan: 1 },
  { label: "Wide", description: "2 columns", colSpan: 2, rowSpan: 1 },
  { label: "Tall", description: "2 rows", colSpan: 1, rowSpan: 2 },
  { label: "Large", description: "2 by 2", colSpan: 2, rowSpan: 2 },
] as const;

type DraftSlot = {
  slot_index: number;
  widget_key: DashboardWidgetId | null;
  col_span: number;
  row_span: number;
  config_json: {
    category_mode?: SheetWidgetCategoryMode;
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
  const [newSheetContextCategoryId, setNewSheetContextCategoryId] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [sheetContextCategoryId, setSheetContextCategoryId] = useState("");
  const [isControlOpen, setIsControlOpen] = useState(false);
  const [isStarkMode, setIsStarkMode] = useState(false);
  const [isSlotEditorOpen, setIsSlotEditorOpen] = useState(false);
  const [focusedSlotIndex, setFocusedSlotIndex] = useState<number | null>(null);
  const [editingSlotIndex, setEditingSlotIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmation>(null);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);
  const [previewDailyTask, setPreviewDailyTask] = useState<DailyTask | null>(null);
  const [previewWeeklyTask, setPreviewWeeklyTask] =
    useState<DashboardWeeklyTask | null>(null);
  const [previewEvent, setPreviewEvent] = useState<CalendarEvent | null>(null);

  const selectedSheetIndex = useMemo(
    () => sheets.findIndex((sheet) => sheet.id === selectedSheetId),
    [selectedSheetId, sheets],
  );
  const selectedDateLabel = useMemo(
    () => formatDisplayDate(selectedDate),
    [selectedDate],
  );
  const currentSheetName = sheetDetail?.name ?? "Loading sheet";
  const currentSheetContextCategoryId = sheetDetail?.context_category_id ?? null;
  const currentSheetContextCategory = useMemo(
    () =>
      categories.find(
        (category) => category.id === currentSheetContextCategoryId,
      ) ?? null,
    [categories, currentSheetContextCategoryId],
  );
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
    setSheetContextCategoryId(detail.context_category_id?.toString() ?? "");
    setDraftSlots(createDraftSlots(detail));
  }

  function updateStarkMode(nextValue: boolean) {
    setIsStarkMode(nextValue);
    window.localStorage.setItem(
      SHEETS_STARK_MODE_STORAGE_KEY,
      nextValue ? "true" : "false",
    );
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
    setIsStarkMode(
      window.localStorage.getItem(SHEETS_STARK_MODE_STORAGE_KEY) === "true",
    );

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
        if (focusedSlotIndex !== null) {
          event.preventDefault();
          setFocusedSlotIndex(null);
          return;
        }
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

      if (focusedSlotIndex !== null || isSlotEditorOpen || isControlOpen) {
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
  }, [
    focusedSlotIndex,
    isControlOpen,
    isSlotEditorOpen,
    selectedSheetIndex,
    sheets.length,
  ]);

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
    setFocusedSlotIndex(null);
    setIsSlotEditorOpen(true);
    setIsControlOpen(false);
  }

  async function handleCreateSheet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const created = await createSheet(
        newSheetName,
        newSheetContextCategoryId ? Number(newSheetContextCategoryId) : null,
      );
      setNewSheetName("");
      setNewSheetContextCategoryId("");
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
      const renamed = await updateSheet(sheetDetail.id, {
        name: renameValue,
        context_category_id: sheetContextCategoryId
          ? Number(sheetContextCategoryId)
          : null,
      });
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
      setFocusedSlotIndex(null);
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
      setFocusedSlotIndex(null);
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
        col_span: 1,
        row_span: 1,
      }));

      const updated = await updateSheetSlots(sheetDetail.id, {
        slots: nextSlots,
      });
      setSheetDetail(updated);
      setDraftSlots(createDraftSlots(updated));
      setEditingSlotIndex(0);
      setIsSlotEditorOpen(false);
      setFocusedSlotIndex(null);
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
          col_span: slot.widget_key ? slot.col_span : 1,
          row_span: slot.widget_key ? slot.row_span : 1,
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
              col_span: widgetKey ? slot.col_span : 1,
              row_span: widgetKey ? slot.row_span : 1,
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
          ? {
              ...slot,
              widget_key: null,
              config_json: {},
              col_span: 1,
              row_span: 1,
            }
          : slot,
      ),
    );
  }

  function updateDraftSlotSize(
    slotIndex: number,
    colSpan: number,
    rowSpan: number,
  ) {
    setNotice(null);
    setDraftSlots((current) =>
      current.map((slot) =>
        slot.slot_index === slotIndex
          ? { ...slot, col_span: colSpan, row_span: rowSpan }
          : slot,
      ),
    );
  }

  function updateDraftSlotConfig(
    slotIndex: number,
    key: "category_id" | "category_mode" | "title_override",
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
                : key === "category_mode"
                  ? (value as SheetWidgetCategoryMode)
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
          onPreviewDailyTask: setPreviewDailyTask,
          onPreviewEvent: setPreviewEvent,
          onToggleDailyTask: toggleDailyTask,
          onToggleWeeklyTask: toggleWeeklyTask,
          onPreviewWeeklyTask: setPreviewWeeklyTask,
          selectedDate,
          sheetContextCategoryId: currentSheetContextCategoryId,
          summary,
        } satisfies DashboardWidgetProps)
      : null;

  return (
    <main
      className={`sheet-canvas relative h-[calc(100vh-73px)] min-h-[680px] overflow-hidden text-[#2c2925] ${
        isStarkMode ? "sheet-stark" : ""
      }`}
    >
      <TopCenterControls
        currentSheetName={currentSheetName}
        currentSheetContextCategory={currentSheetContextCategory}
        isControlOpen={isControlOpen}
        isSaving={isSaving}
        isStarkMode={isStarkMode}
        categories={categories}
        newSheetName={newSheetName}
        newSheetContextCategoryId={newSheetContextCategoryId}
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
        onSetStarkMode={updateStarkMode}
        renameValue={renameValue}
        sheetContextCategoryId={sheetContextCategoryId}
        selectedDate={selectedDate}
        selectedDateLabel={selectedDateLabel}
        selectedSheetId={selectedSheetId}
        selectedSheetIndex={selectedSheetIndex}
        setNewSheetContextCategoryId={setNewSheetContextCategoryId}
        setNewSheetName={setNewSheetName}
        setSheetContextCategoryId={setSheetContextCategoryId}
        setRenameValue={setRenameValue}
        setSelectedDate={setSelectedDate}
        sheets={sheets}
      />

      <section className="flex h-full flex-col px-6 pb-6 pt-16">
        <div className="mb-3 grid min-h-12 grid-cols-[minmax(120px,1fr)_minmax(0,2fr)_minmax(120px,1fr)] items-center gap-4">
          <AppButton
            className="justify-self-start shadow-sm"
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
            <p className="mt-1 text-xs font-medium text-[#766f66]">
              {selectedSheetIndex >= 0
                ? `${selectedSheetIndex + 1} of ${sheets.length} sheets`
                : "Preparing workspace"}
              {currentSheetContextCategory
                ? ` / Sheet context: ${currentSheetContextCategory.name}`
                : " / No sheet context"}
            </p>
          </div>
          <AppButton
            className="justify-self-end shadow-sm"
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
          <div className="sheet-surface flex min-h-0 flex-1 items-center justify-center">
            <LoadingState message="Loading sheet workspace..." />
          </div>
        ) : (
          <div className="sheet-surface min-h-0 flex-1">
            <SheetGrid
              draftSlots={draftSlots}
              isSummaryReady={summary !== null}
              onEditSlot={openSlotEditor}
              onFocusSlot={setFocusedSlotIndex}
              onPreviewNote={setPreviewNote}
              taskCategories={categories}
              widgetProps={widgetProps}
            />
          </div>
        )}
      </section>

      {isSlotEditorOpen ? (
        <SlotEditorPanel
          activeSlot={activeDraftSlot}
          categories={categories}
          draftSlots={draftSlots}
          isSaving={isSaving}
          sheetContextCategory={currentSheetContextCategory}
          onClearSlot={clearDraftSlot}
          onClose={() => setIsSlotEditorOpen(false)}
          onSaveSlots={handleSaveSlots}
          onSelectSlot={setEditingSlotIndex}
          onUpdateSlot={updateDraftSlot}
          onUpdateSlotConfig={updateDraftSlotConfig}
          onUpdateSlotSize={updateDraftSlotSize}
          hasUnsavedChanges={hasUnsavedSlotChanges}
          sheetName={currentSheetName}
        />
      ) : null}
      {focusedSlotIndex !== null ? (
        <FocusOverlay
          draftSlots={draftSlots}
          focusedSlotIndex={focusedSlotIndex}
          onClose={() => setFocusedSlotIndex(null)}
          onPreviewNote={setPreviewNote}
          taskCategories={categories}
          widgetProps={widgetProps}
        />
      ) : null}
      {previewNote ? (
        <NotePreviewModal
          note={previewNote}
          onClose={() => setPreviewNote(null)}
        />
      ) : null}
      {previewDailyTask ? (
        <DailyTaskPreviewModal
          task={previewDailyTask}
          onClose={() => setPreviewDailyTask(null)}
        />
      ) : null}
      {previewWeeklyTask ? (
        <WeeklyTaskPreviewModal
          selectedDate={selectedDate}
          task={previewWeeklyTask}
          onClose={() => setPreviewWeeklyTask(null)}
        />
      ) : null}
      {previewEvent ? (
        <EventPreviewModal
          event={previewEvent}
          onClose={() => setPreviewEvent(null)}
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
  categories,
  currentSheetName,
  currentSheetContextCategory,
  isControlOpen,
  isSaving,
  isStarkMode,
  newSheetName,
  newSheetContextCategoryId,
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
  onSetStarkMode,
  renameValue,
  selectedDate,
  selectedDateLabel,
  selectedSheetId,
  selectedSheetIndex,
  setNewSheetContextCategoryId,
  setNewSheetName,
  setRenameValue,
  setSheetContextCategoryId,
  setSelectedDate,
  sheetContextCategoryId,
  sheets,
}: {
  categories: TaskCategory[];
  currentSheetName: string;
  currentSheetContextCategory: TaskCategory | null;
  isControlOpen: boolean;
  isSaving: boolean;
  isStarkMode: boolean;
  newSheetName: string;
  newSheetContextCategoryId: string;
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
  onSetStarkMode: (isStarkMode: boolean) => void;
  renameValue: string;
  selectedDate: string;
  selectedDateLabel: string;
  selectedSheetId: number | null;
  selectedSheetIndex: number;
  setNewSheetContextCategoryId: (value: string) => void;
  setNewSheetName: (value: string) => void;
  setRenameValue: (value: string) => void;
  setSheetContextCategoryId: (value: string) => void;
  setSelectedDate: (value: string) => void;
  sheetContextCategoryId: string;
  sheets: Sheet[];
}) {
  return (
    <div className="absolute left-1/2 top-3 z-30 w-[min(92vw,780px)] -translate-x-1/2">
      <div className="flex justify-center">
        <button
          aria-expanded={isControlOpen}
          className="sheet-control-chip"
          onClick={() => onSetControlOpen(!isControlOpen)}
          type="button"
        >
          <span className="text-[var(--color-primary)]">Workspace</span>
          <span className="mx-2 text-[#cbbfb0]">/</span>
          {currentSheetName}
          {currentSheetContextCategory ? (
            <span className="ml-2 text-xs text-[#766f66]">
              {currentSheetContextCategory.name}
            </span>
          ) : null}
        </button>
      </div>

      {isControlOpen ? (
        <div className="sheet-floating-panel mt-3 animate-[sheetPanelIn_160ms_ease-out] p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.25fr]">
            <section>
              <p className="app-eyebrow">
                App Areas
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {workspaceLinks.map(([label, href]) => (
                  <Link
                    className="app-button-secondary min-h-9 px-3 py-2 text-center text-xs"
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
              <div className="app-soft-box mt-3 px-3 py-2 text-xs leading-5 text-[#766f66]">
                Shortcuts: Left/Right changes sheets, Esc closes panels,
                Ctrl+Shift+A opens Quick Add.
              </div>
              <DateNavigator
                className="mt-3"
                label={`Widget date (${selectedDateLabel})`}
                onChange={setSelectedDate}
                value={selectedDate}
              />
              <label className="sheet-stark-toggle mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#ded6ca] px-3 py-2 text-sm font-semibold text-[#3b3732]">
                <span>
                  Stark Mode
                  <span className="app-muted mt-0.5 block text-xs font-medium">
                    Sheets only
                  </span>
                </span>
                <input
                  checked={isStarkMode}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                  onChange={(event) => onSetStarkMode(event.target.checked)}
                  type="checkbox"
                />
              </label>
            </section>

            <section className="border-t border-[#ded6ca] pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
              <p className="app-eyebrow">
                Sheet Controls
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-[auto_1fr_auto]">
                <button
                  className="app-button-secondary min-h-10 px-3"
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
                  className="app-button-secondary min-h-10 px-3"
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

              <form className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={onCreateSheet}>
                <input
                  className={inputClassName}
                  onChange={(event) => setNewSheetName(event.target.value)}
                  placeholder="New sheet name"
                  required
                  type="text"
                  value={newSheetName}
                />
                <select
                  className={inputClassName}
                  disabled={isSaving}
                  onChange={(event) => setNewSheetContextCategoryId(event.target.value)}
                  value={newSheetContextCategoryId}
                >
                  <option value="">No sheet context</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  className="app-button-primary"
                  disabled={isSaving}
                  type="submit"
                >
                  Create
                </button>
              </form>

              <form className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={onRenameSheet}>
                <input
                  className={inputClassName}
                  disabled={isSaving || selectedSheetId === null}
                  onChange={(event) => setRenameValue(event.target.value)}
                  required
                  type="text"
                  value={renameValue}
                />
                <select
                  className={inputClassName}
                  disabled={isSaving || selectedSheetId === null}
                  onChange={(event) => setSheetContextCategoryId(event.target.value)}
                  value={sheetContextCategoryId}
                >
                  <option value="">No sheet context</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  className="app-button-secondary"
                  disabled={isSaving || selectedSheetId === null}
                  type="submit"
                >
                  Save sheet
                </button>
              </form>
              <p className="app-muted mt-2 text-xs">
                Sheet context lets category-aware widgets inherit a category.
              </p>

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

              <details className="mt-3 rounded-xl border border-[#e7c5c9]/80 bg-[#fff4f3]/60 p-3">
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
  onFocusSlot,
  onPreviewNote,
  taskCategories,
  widgetProps,
}: {
  draftSlots: DraftSlot[];
  isSummaryReady: boolean;
  onEditSlot: (slotIndex: number) => void;
  onFocusSlot: (slotIndex: number) => void;
  onPreviewNote: (note: Note) => void;
  taskCategories: TaskCategory[];
  widgetProps: DashboardWidgetProps | null;
}) {
  const coveredSlots = coveredSlotAnchors(draftSlots);

  return (
    <section className="grid h-full min-h-0 grid-cols-4 grid-rows-2 gap-3">
      {draftSlots.map((slot) => {
        if (coveredSlots.has(slot.slot_index)) {
          return null;
        }
        const definition = slot.widget_key
          ? getDashboardWidgetDefinition(slot.widget_key)
          : undefined;
        return (
          <div
            className="sheet-tile"
            key={slot.slot_index}
            style={{
              gridColumn: `${(slot.slot_index % GRID_COLUMNS) + 1} / span ${slot.col_span}`,
              gridRow: `${Math.floor(slot.slot_index / GRID_COLUMNS) + 1} / span ${slot.row_span}`,
            }}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="sheet-slot-header">
                <p className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-normal text-[#8b8176]">
                  Slot {slot.slot_index + 1} / {definition?.displayName ?? "Empty"} / {slot.col_span}x{slot.row_span}
                </p>
                <div className="flex min-w-0 items-center gap-1.5">
                  {definition ? (
                    <Link
                      className="sheet-widget-action"
                      href={widgetOpenHref(definition.id)}
                      title={`Open ${definition.displayName} page`}
                    >
                      Open
                    </Link>
                  ) : null}
                  {definition && widgetProps ? (
                    <button
                      className="sheet-widget-action sheet-widget-action-primary"
                      onClick={() => onFocusSlot(slot.slot_index)}
                      title={`Focus ${definition.displayName}`}
                      type="button"
                    >
                      Focus
                    </button>
                  ) : null}
                  <button
                    className="sheet-widget-action"
                    onClick={() => onEditSlot(slot.slot_index)}
                    title="Configure slot"
                    type="button"
                  >
                    Configure
                  </button>
                </div>
              </div>
              <div className="sheet-scroll min-h-0 flex-1 overflow-auto p-2.5 [&>section]:h-full [&>section]:overflow-auto [&>section]:shadow-none">
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
                  <EmptySlot
                    onConfigure={() => onEditSlot(slot.slot_index)}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function FocusOverlay({
  draftSlots,
  focusedSlotIndex,
  onClose,
  onPreviewNote,
  taskCategories,
  widgetProps,
}: {
  draftSlots: DraftSlot[];
  focusedSlotIndex: number;
  onClose: () => void;
  onPreviewNote: (note: Note) => void;
  taskCategories: TaskCategory[];
  widgetProps: DashboardWidgetProps | null;
}) {
  const slot = draftSlots.find(
    (draftSlot) => draftSlot.slot_index === focusedSlotIndex,
  );
  const definition = slot?.widget_key
    ? getDashboardWidgetDefinition(slot.widget_key)
    : undefined;

  if (!slot || !definition || !widgetProps) {
    return null;
  }

  return (
    <div
      aria-label={`${definition.displayName} focus mode`}
      aria-modal="true"
      className="sheet-focus-backdrop"
      role="dialog"
    >
      <section className="sheet-focus-panel">
        <div className="sheet-focus-header">
          <div className="min-w-0">
            <p className="app-eyebrow">Focus Mode</p>
            <h2 className="mt-1 truncate text-xl font-semibold text-[#2c2925]">
              {definition.displayName}
            </h2>
            <p className="app-muted mt-1 text-xs">
              Slot {slot.slot_index + 1} / {slot.col_span}x{slot.row_span}
            </p>
          </div>
          <button
            autoFocus
            className="app-button-secondary min-h-8 px-3 py-1.5 text-xs"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
        <div className="sheet-focus-content">
          <WidgetRenderer
            definition={definition}
            props={{
              ...widgetProps,
              onPreviewNote,
              renderMode: "focus",
              taskCategories,
              widgetConfig: slot.config_json,
            }}
          />
        </div>
      </section>
    </div>
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

function DailyTaskPreviewModal({
  task,
  onClose,
}: {
  task: DailyTask;
  onClose: () => void;
}) {
  const metadata = dailyTaskPreviewMetadata(task);
  return (
    <PreviewModalShell
      eyebrow="Task Preview"
      title={task.title}
      onClose={onClose}
      actionHref="/tasks"
      actionLabel="Open in Tasks"
    >
      {metadata.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {metadata.map((item) => (
            <span className="app-pill border-[#ded6ca] px-2 py-1 text-xs" key={item}>
              {item}
            </span>
          ))}
        </div>
      ) : null}
      <p className="whitespace-pre-wrap text-sm leading-6 text-[#3b3732]">
        {task.description.trim() || "No task notes yet."}
      </p>
    </PreviewModalShell>
  );
}

function WeeklyTaskPreviewModal({
  selectedDate,
  task,
  onClose,
}: {
  selectedDate: string;
  task: DashboardWeeklyTask;
  onClose: () => void;
}) {
  return (
    <PreviewModalShell
      eyebrow="Recurring Task Preview"
      title={task.title}
      onClose={onClose}
      actionHref="/tasks"
      actionLabel="Open in Tasks"
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="app-pill border-[#ded6ca] px-2 py-1 text-xs">
          {task.is_completed ? "Completed occurrence" : "Open occurrence"}
        </span>
        <span className="app-pill border-[#ded6ca] px-2 py-1 text-xs">
          {formatDisplayDate(selectedDate)}
        </span>
        <span className="app-pill border-[#ded6ca] px-2 py-1 text-xs">
          {recurringTaskPreviewMetadata(task)}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6 text-[#3b3732]">
        {task.description.trim() || "No recurring task notes yet."}
      </p>
    </PreviewModalShell>
  );
}

function EventPreviewModal({
  event,
  onClose,
}: {
  event: CalendarEvent;
  onClose: () => void;
}) {
  return (
    <PreviewModalShell
      eyebrow="Event Preview"
      title={event.title}
      onClose={onClose}
      actionHref="/calendar"
      actionLabel="Open in Calendar"
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="app-pill border-[#ded6ca] px-2 py-1 text-xs">
          {formatDisplayDate(event.event_date)}
        </span>
        <span className="app-pill border-[#ded6ca] px-2 py-1 text-xs">
          {eventTimePreview(event)}
        </span>
        <span className="app-pill border-[#ded6ca] px-2 py-1 text-xs">
          {eventRecurrencePreview(event)}
        </span>
        {event.location ? (
          <span className="app-pill border-[#ded6ca] px-2 py-1 text-xs">
            {event.location}
          </span>
        ) : null}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6 text-[#3b3732]">
        {event.description.trim() || "No event description yet."}
      </p>
    </PreviewModalShell>
  );
}

function PreviewModalShell({
  actionHref,
  actionLabel,
  children,
  eyebrow,
  onClose,
  title,
}: {
  actionHref: string;
  actionLabel: string;
  children: ReactNode;
  eyebrow: string;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#2c2925]/40 px-6 backdrop-blur-sm">
      <section className="sheet-floating-panel flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-[#ded6ca] px-5 py-4">
          <div className="min-w-0">
            <p className="app-eyebrow">{eyebrow}</p>
            <h2 className="mt-1 truncate text-xl font-semibold text-[#2c2925]">
              {title}
            </h2>
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
          {children}
        </div>
        <div className="flex justify-end gap-3 border-t border-[#ded6ca] px-5 py-4">
          <button
            className="app-button-secondary"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
          <Link className="app-button-primary" href={actionHref}>
            {actionLabel}
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
  sheetContextCategory,
  onClearSlot,
  onClose,
  onSaveSlots,
  onSelectSlot,
  onUpdateSlot,
  onUpdateSlotConfig,
  onUpdateSlotSize,
  sheetName,
}: {
  activeSlot: DraftSlot;
  categories: TaskCategory[];
  draftSlots: DraftSlot[];
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  sheetContextCategory: TaskCategory | null;
  onClearSlot: (slotIndex: number) => void;
  onClose: () => void;
  onSaveSlots: () => Promise<void>;
  onSelectSlot: (slotIndex: number) => void;
  onUpdateSlot: (slotIndex: number, widgetKey: string) => void;
  onUpdateSlotConfig: (
    slotIndex: number,
    key: "category_id" | "category_mode" | "title_override",
    value: string,
  ) => void;
  onUpdateSlotSize: (
    slotIndex: number,
    colSpan: number,
    rowSpan: number,
  ) => void;
  sheetName: string;
}) {
  const activeDefinition = activeSlot.widget_key
    ? getDashboardWidgetDefinition(activeSlot.widget_key)
    : undefined;
  const supportsCategoryFilter = Boolean(activeDefinition?.supportsCategoryFilter);
  const supportsTitleOverride = Boolean(activeDefinition?.supportsTitleOverride);
  const selectedSlotLocation = sheetSlotLocation(activeSlot.slot_index);
  const selectedCategoryName = selectedCategoryLabel(
    activeSlot.config_json,
    categories,
    sheetContextCategory,
  );
  const coveredSlots = coveredSlotAnchors(draftSlots);
  const activeCoveredBy = coveredSlots.get(activeSlot.slot_index);

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

        <div className="grid min-h-0 flex-1 gap-5 overflow-auto p-5 lg:grid-cols-[230px_1fr]">
          <div>
            <p className="text-sm font-semibold text-[#2c2925]">Choose slot</p>
            <p className="app-muted mt-1 text-xs leading-5">
              Empty slots open widget configuration here. In normal sheet mode,
              empty slots open this slot editor.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
              {draftSlots.map((slot) => {
                const definition = slot.widget_key
                  ? getDashboardWidgetDefinition(slot.widget_key)
                  : undefined;
                const isActive = slot.slot_index === activeSlot.slot_index;
                const coveredBy = coveredSlots.get(slot.slot_index);
                const coveredAnchor =
                  coveredBy !== undefined
                    ? draftSlots.find((draftSlot) => draftSlot.slot_index === coveredBy)
                    : undefined;
                return (
                  <button
                    className={`sheet-slot-choice ${
                      isActive
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)] shadow-sm"
                        : "sheet-slot-choice-idle"
                    }`}
                    key={slot.slot_index}
                    onClick={() => onSelectSlot(coveredBy ?? slot.slot_index)}
                    type="button"
                  >
                    <span className="block font-semibold">
                      Slot {slot.slot_index + 1}
                    </span>
                    <span className="mt-0.5 block truncate text-xs">
                      {coveredAnchor
                        ? `Covered by slot ${coveredAnchor.slot_index + 1}`
                        : definition?.displayName ?? "Add widget"}
                    </span>
                    <span className="app-muted mt-1 block text-[11px]">
                      {coveredAnchor
                        ? `${coveredAnchor.col_span}x${coveredAnchor.row_span} widget`
                        : `${sheetSlotLocation(slot.slot_index)} / ${slot.col_span}x${slot.row_span}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <div className="sheet-config-summary">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="app-eyebrow">Selected Slot</p>
                  <h3 className="mt-1 text-lg font-semibold text-[#2c2925]">
                    Slot {activeSlot.slot_index + 1} - {selectedSlotLocation}
                  </h3>
                  <p className="app-muted mt-1 text-sm leading-6">
                    {activeDefinition
                      ? activeDefinition.description
                      : "Choose a widget from the library below. This slot is empty until you save changes."}
                  </p>
                </div>
                <span
                  className={`app-pill ${
                    hasUnsavedChanges ? "border-[var(--color-primary-ring)]" : ""
                  }`}
                >
                  {hasUnsavedChanges ? "Unsaved" : "Saved"}
                </span>
              </div>
              <dl className="mt-4 grid gap-2 text-xs text-[#625c55] sm:grid-cols-4">
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
                    Type
                  </dt>
                  <dd className="truncate">
                    {activeDefinition?.libraryGroup ?? "None"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase text-[#8b8176]">
                    Category
                  </dt>
                  <dd className="truncate">
                    {supportsCategoryFilter ? selectedCategoryName : "Not used"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase text-[#8b8176]">
                    Title
                  </dt>
                  <dd className="truncate">
                    {supportsTitleOverride
                      ? activeSlot.config_json.title_override?.trim() || "Default"
                      : "Default"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase text-[#8b8176]">
                    Size
                  </dt>
                  <dd className="truncate">
                    {activeSlot.col_span}x{activeSlot.row_span}
                  </dd>
                </div>
              </dl>
            </div>

            <section>
              <p className="text-sm font-semibold text-[#2c2925]">Widget size</p>
              <p className="app-muted mt-1 text-xs leading-5">
                Larger widgets occupy neighboring cells in the fixed grid.
              </p>
              {activeCoveredBy !== undefined ? (
                <div className="app-soft-box mt-3 px-3 py-2 text-xs leading-5 text-[#766f66]">
                  Slot {activeSlot.slot_index + 1} is covered by slot{" "}
                  {activeCoveredBy + 1}. Select the anchor slot to edit or clear
                  the widget.
                </div>
              ) : null}
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                {SLOT_SIZE_OPTIONS.map((option) => {
                  const unavailableReason = slotSizeUnavailableReason(
                    activeSlot.slot_index,
                    option.colSpan,
                    option.rowSpan,
                    draftSlots,
                  );
                  const isActiveSize =
                    activeSlot.col_span === option.colSpan &&
                    activeSlot.row_span === option.rowSpan;
                  return (
                    <button
                      className={`sheet-size-option ${
                        isActiveSize ? "sheet-size-option-active" : ""
                      }`}
                      disabled={
                        isSaving ||
                        activeSlot.widget_key === null ||
                        activeCoveredBy !== undefined ||
                        unavailableReason !== null
                      }
                      key={`${option.colSpan}x${option.rowSpan}`}
                      onClick={() =>
                        onUpdateSlotSize(
                          activeSlot.slot_index,
                          option.colSpan,
                          option.rowSpan,
                        )
                      }
                      title={
                        activeSlot.widget_key === null
                          ? "Choose a widget before selecting a larger size."
                          : unavailableReason ?? undefined
                      }
                      type="button"
                    >
                      <span className="block text-sm font-semibold">
                        {option.label}
                      </span>
                      <span className="app-muted mt-0.5 block text-[11px]">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#2c2925]">
                    Widget library
                  </p>
                  <p className="app-muted mt-1 text-xs leading-5">
                    Select a widget for this slot. Duplicate widget types are
                    allowed on different slots.
                  </p>
                </div>
                <button
                  className="app-button-secondary min-h-8 px-3 py-1.5 text-xs"
                  disabled={isSaving || activeSlot.widget_key === null}
                  onClick={() => onUpdateSlot(activeSlot.slot_index, "")}
                  type="button"
                >
                  Set empty
                </button>
              </div>

              <div className="mt-3 space-y-4">
                {WIDGET_LIBRARY_GROUPS.map((group) => {
                  const definitions = SHEET_WIDGET_DEFINITIONS.filter(
                    (definition) => definition.libraryGroup === group,
                  );
                  if (definitions.length === 0) {
                    return null;
                  }

                  return (
                    <div key={group}>
                      <p className="text-xs font-semibold uppercase tracking-normal text-[#8b8176]">
                        {group}
                      </p>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        {definitions.map((definition) => (
                          <WidgetLibraryCard
                            definition={definition}
                            isActive={activeSlot.widget_key === definition.id}
                            isSaving={isSaving}
                            key={definition.id}
                            onSelect={() =>
                              onUpdateSlot(activeSlot.slot_index, definition.id)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {supportsCategoryFilter ? (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#2c2925]">
                  Widget filter
                  <select
                    className={inputClassName}
                    disabled={isSaving}
                    onChange={(event) =>
                      onUpdateSlotConfig(
                        activeSlot.slot_index,
                        "category_mode",
                        event.target.value,
                      )
                    }
                    value={categoryModeForConfig(activeSlot.config_json)}
                  >
                    <option value="none">No filter</option>
                    {sheetContextCategory ? (
                      <option value="sheet_context">
                        Use sheet context ({sheetContextCategory.name})
                      </option>
                    ) : null}
                    <option value="specific">Specific category</option>
                  </select>
                </label>
                {categoryModeForConfig(activeSlot.config_json) === "specific" ? (
                  <label className="block text-sm font-semibold text-[#2c2925]">
                    Specific category
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
                      <option value="">Choose category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <p className="app-muted text-xs leading-5">
                  Use sheet context inherits the current sheet category. Specific
                  category keeps this widget independent.
                </p>
              </div>
            ) : null}

            {supportsTitleOverride ? (
              <label className="block text-sm font-semibold text-[#2c2925]">
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

function WidgetLibraryCard({
  definition,
  isActive,
  isSaving,
  onSelect,
}: {
  definition: DashboardWidgetDefinition;
  isActive: boolean;
  isSaving: boolean;
  onSelect: () => void;
}) {
  const configBadges = [
    definition.supportsCategoryFilter ? "Category filter" : null,
    definition.supportsTitleOverride ? "Title override" : null,
  ].filter((badge): badge is string => Boolean(badge));

  return (
    <button
      className={`sheet-widget-library-card ${
        isActive ? "sheet-widget-library-card-active" : ""
      }`}
      disabled={isSaving}
      onClick={onSelect}
      type="button"
    >
      <span className="flex items-start gap-3">
        <span className="sheet-widget-library-icon">
          {widgetLibraryInitial(definition)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold">
              {definition.displayName}
            </span>
            {isActive ? (
              <span className="rounded-full bg-white/55 px-2 py-0.5 text-[11px] font-semibold">
                Active
              </span>
            ) : null}
          </span>
          <span className="app-muted mt-1 block text-xs leading-5">
            {definition.compactPreviewLabel}
          </span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            <span className="app-pill border-[#ded6ca]/70 px-2 py-0.5 text-[11px]">
              {definition.libraryGroup}
            </span>
            {configBadges.length > 0 ? (
              configBadges.map((badge) => (
                <span
                  className="app-pill border-[#ded6ca]/70 px-2 py-0.5 text-[11px]"
                  key={badge}
                >
                  {badge}
                </span>
              ))
            ) : (
              <span className="app-muted text-[11px] font-medium">
                No extra config
              </span>
            )}
          </span>
        </span>
      </span>
    </button>
  );
}

function EmptySlot({
  onConfigure,
}: {
  onConfigure: () => void;
}) {
  return (
    <div className="sheet-add-slot group">
      <button
        className="flex flex-col items-center gap-2"
        onClick={onConfigure}
        title="Configure widget"
        type="button"
      >
        <span className="sheet-add-icon flex size-9 items-center justify-center rounded-full border border-current text-xl leading-none transition group-hover:scale-105">
          +
        </span>
        <span className="text-sm font-semibold">Add widget</span>
        <span className="text-xs font-medium text-[#766f66]">
          Opens slot editor
        </span>
      </button>
    </div>
  );
}

function widgetLibraryInitial(definition: DashboardWidgetDefinition) {
  return definition.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

function widgetOpenHref(widgetKey: DashboardWidgetId) {
  if (widgetKey === "daily-tasks" || widgetKey === "weekly-tasks") {
    return "/tasks";
  }
  if (widgetKey === "recent-notes") {
    return "/notes";
  }
  if (widgetKey === "upcoming-events") {
    return "/calendar";
  }
  if (widgetKey === "tracker-summary") {
    return "/tracker";
  }
  if (widgetKey === "category-overview") {
    return "/categories";
  }
  if (widgetKey === "review-summary") {
    return "/review";
  }
  return "/";
}

function dailyTaskPreviewMetadata(task: DailyTask) {
  const metadata = [task.is_completed ? "Completed" : "Open"];
  const plannedTime = formatTime(task.planned_time);
  const dueTime = formatTime(task.due_time);
  if (task.task_date) {
    metadata.push(`Planned for ${formatDisplayDate(task.task_date)}`);
  }
  if (plannedTime) {
    metadata.push(`At ${plannedTime}`);
  }
  if (task.due_date) {
    metadata.push(
      dueTime
        ? `Due ${formatDisplayDate(task.due_date)} ${dueTime}`
        : `Due ${formatDisplayDate(task.due_date)}`,
    );
  }
  return metadata;
}

function recurringTaskPreviewMetadata(task: DashboardWeeklyTask) {
  if (task.recurrence_type === "monthly_day") {
    return `Monthly on day ${task.day_of_month}`;
  }
  if (task.recurrence_type === "biweekly") {
    return "Every 2 weeks";
  }
  return "Weekly";
}

function eventTimePreview(event: CalendarEvent) {
  if (!event.start_time && !event.end_time) {
    return "All day";
  }
  if (event.start_time && event.end_time) {
    return `${event.start_time.slice(0, 5)}-${event.end_time.slice(0, 5)}`;
  }
  if (event.start_time) {
    return event.start_time.slice(0, 5);
  }
  return `Until ${event.end_time?.slice(0, 5)}`;
}

function eventRecurrencePreview(event: CalendarEvent) {
  if (event.recurrence_type === "monthly_day") {
    return `Monthly on day ${event.day_of_month}`;
  }
  if (event.recurrence_type === "biweekly") {
    return "Bi-weekly";
  }
  if (event.recurrence_type === "weekly") {
    return "Weekly";
  }
  return "One-time";
}

function sheetSlotLocation(slotIndex: number) {
  const row = slotIndex < 4 ? "Top row" : "Bottom row";
  const column = (slotIndex % 4) + 1;
  return `${row}, column ${column}`;
}

function CompactState({ message }: { message: string }) {
  return (
    <div className="app-soft-box flex h-full items-center justify-center px-3 py-4 text-center">
      <p className="text-sm text-[#766f66]">{message}</p>
    </div>
  );
}

function emptyDraftSlots(): DraftSlot[] {
  return Array.from({ length: SLOT_COUNT }, (_, slotIndex) => ({
    slot_index: slotIndex,
    widget_key: null,
    col_span: 1,
    row_span: 1,
    config_json: {},
  }));
}

function normalizedSlotConfig(slot: DraftSlot) {
  if (
    slot.widget_key !== "daily-tasks" &&
    slot.widget_key !== "weekly-tasks" &&
    slot.widget_key !== "recent-notes" &&
    slot.widget_key !== "upcoming-events" &&
    slot.widget_key !== "category-overview"
  ) {
    return {};
  }

  const categoryConfig = {
    category_mode: categoryModeForConfig(slot.config_json),
    category_id:
      categoryModeForConfig(slot.config_json) === "specific"
        ? slot.config_json.category_id ?? null
        : null,
  };

  if (
    slot.widget_key === "daily-tasks" ||
    slot.widget_key === "weekly-tasks" ||
    slot.widget_key === "category-overview"
  ) {
    return {
      ...categoryConfig,
      title_override: slot.config_json.title_override ?? "",
    };
  }

  return categoryConfig;
}

function categoryModeForConfig(config: DraftSlot["config_json"]): SheetWidgetCategoryMode {
  if (
    config.category_mode === "sheet_context" ||
    config.category_mode === "specific" ||
    config.category_mode === "none"
  ) {
    return config.category_mode;
  }
  return typeof config.category_id === "number" ? "specific" : "none";
}

function normalizeDraftSlotConfig(
  widgetKey: DashboardWidgetId | null,
  config: DraftSlot["config_json"],
): DraftSlot["config_json"] {
  if (!widgetKey) {
    return {};
  }
  const mode = categoryModeForConfig(config);
  return {
    ...config,
    category_mode: mode,
    category_id: mode === "specific" ? config.category_id ?? null : null,
  };
}

function selectedCategoryLabel(
  config: DraftSlot["config_json"],
  categories: TaskCategory[],
  sheetContextCategory: TaskCategory | null,
) {
  const mode = categoryModeForConfig(config);
  if (mode === "sheet_context") {
    return sheetContextCategory
      ? `Sheet context: ${sheetContextCategory.name}`
      : "Sheet context not set";
  }
  if (mode === "specific") {
    return config.category_id
      ? categories.find((category) => category.id === config.category_id)?.name ??
          "Unknown"
      : "Specific category not set";
  }
  return "No filter";
}

function normalizedDraftSlotForCompare(slot: DraftSlot) {
  return {
    slot_index: slot.slot_index,
    widget_key: slot.widget_key,
    config_json: slot.widget_key ? normalizedSlotConfig(slot) : {},
    col_span: slot.widget_key ? slot.col_span : 1,
    row_span: slot.widget_key ? slot.row_span : 1,
  };
}

function coveredSlotAnchors(slots: DraftSlot[]) {
  const covered = new Map<number, number>();
  slots.forEach((slot) => {
    if (!slot.widget_key) {
      return;
    }

    coveredSlotIndexes(slot).forEach((coveredIndex) => {
      if (coveredIndex !== slot.slot_index) {
        covered.set(coveredIndex, slot.slot_index);
      }
    });
  });
  return covered;
}

function coveredSlotIndexes(slot: DraftSlot) {
  const indexes: number[] = [];
  const startColumn = slot.slot_index % GRID_COLUMNS;
  const startRow = Math.floor(slot.slot_index / GRID_COLUMNS);

  for (let rowOffset = 0; rowOffset < slot.row_span; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < slot.col_span; columnOffset += 1) {
      const coveredIndex =
        (startRow + rowOffset) * GRID_COLUMNS + startColumn + columnOffset;
      if (coveredIndex >= 0 && coveredIndex < SLOT_COUNT) {
        indexes.push(coveredIndex);
      }
    }
  }

  return indexes;
}

function slotSizeUnavailableReason(
  slotIndex: number,
  colSpan: number,
  rowSpan: number,
  slots: DraftSlot[],
) {
  const startColumn = slotIndex % GRID_COLUMNS;
  const startRow = Math.floor(slotIndex / GRID_COLUMNS);
  if (startColumn + colSpan > GRID_COLUMNS || startRow + rowSpan > 2) {
    return "This size would cross the sheet edge.";
  }

  const activeSlot = slots.find((slot) => slot.slot_index === slotIndex);
  const occupiedByOther = occupiedSlotAnchors(
    slots.filter((slot) => slot.slot_index !== slotIndex),
  );
  const proposedSlot = {
    ...(activeSlot ?? {
      slot_index: slotIndex,
      widget_key: null,
      config_json: {},
    }),
    col_span: colSpan,
    row_span: rowSpan,
  } as DraftSlot;

  const overlaps = coveredSlotIndexes(proposedSlot).some((coveredIndex) =>
    occupiedByOther.has(coveredIndex),
  );
  return overlaps ? "This size would overlap another widget." : null;
}

function occupiedSlotAnchors(slots: DraftSlot[]) {
  const occupied = new Map<number, number>();
  slots.forEach((slot) => {
    if (!slot.widget_key) {
      return;
    }

    coveredSlotIndexes(slot).forEach((coveredIndex) => {
      occupied.set(coveredIndex, slot.slot_index);
    });
  });
  return occupied;
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
      col_span: definition ? slot?.col_span ?? 1 : 1,
      row_span: definition ? slot?.row_span ?? 1 : 1,
      config_json: normalizeDraftSlotConfig(
        definition ? definition.id : null,
        definition ? slot?.config_json ?? {} : {},
      ),
    };
  });
}
