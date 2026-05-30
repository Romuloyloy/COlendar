"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useState } from "react";

import {
  createActivityEntry,
  createCalorieEntry,
  createWaterEntry,
} from "@/features/tracker/api";
import { createCalendarEvent } from "@/features/calendar/api";
import {
  createDailyTask,
  createWeeklyTask,
  getTaskCategories,
} from "@/features/tasks/api";
import type { TaskCategory } from "@/features/tasks/types";
import { createNote, getFolders } from "@/features/notes/api";
import type { Folder } from "@/features/notes/types";
import {
  AppButton,
  DateSelector,
  ErrorState,
  NoticeState,
  inputClassName,
} from "@/components/ui";
import { todayIsoDate } from "@/lib/date";
import {
  applyPalette,
  PALETTE_CHANGED_EVENT,
  palettes,
  savedPalette,
  type PaletteValue,
} from "@/lib/palette";

const navItems = [
  ["Sheets", "/sheets"],
  ["Search", "/search"],
  ["Review", "/review"],
  ["Categories", "/categories"],
  ["Notes", "/notes"],
  ["Tasks", "/tasks"],
  ["Calendar", "/calendar"],
  ["Tracker", "/tracker"],
];

const quickAddTypes = [
  { value: "daily-task", label: "One-time Task" },
  { value: "weekly-task", label: "Recurring Task" },
  { value: "note", label: "Note" },
  { value: "calendar-event", label: "Calendar Event" },
  { value: "water-entry", label: "Water Entry" },
  { value: "activity-entry", label: "Activity Entry" },
  { value: "calorie-entry", label: "Calorie Entry" },
] as const;

type QuickAddType = (typeof quickAddTypes)[number]["value"];

type QuickAddForm = {
  title: string;
  description: string;
  content: string;
  date: string;
  plannedTime: string;
  dueDate: string;
  dueTime: string;
  startTime: string;
  endTime: string;
  location: string;
  amountMl: string;
  activityType: string;
  durationMinutes: string;
  quantity: string;
  amountKcal: string;
  label: string;
  note: string;
  weekdays: number[];
  recurrenceType: "weekly" | "biweekly" | "monthly_day";
  eventRecurrenceType: "none" | "weekly" | "biweekly" | "monthly_day";
  anchorDate: string;
  dayOfMonth: string;
  endDate: string;
  categoryId: string;
  folderId: string;
};

const WEEKDAYS = [
  { value: 0, label: "Mon" },
  { value: 1, label: "Tue" },
  { value: 2, label: "Wed" },
  { value: 3, label: "Thu" },
  { value: 4, label: "Fri" },
  { value: 5, label: "Sat" },
  { value: 6, label: "Sun" },
];

function emptyForm(date = todayIsoDate()): QuickAddForm {
  return {
    title: "",
    description: "",
    content: "",
    date,
    plannedTime: "",
    dueDate: "",
    dueTime: "",
    startTime: "",
    endTime: "",
    location: "",
    amountMl: "",
    activityType: "",
    durationMinutes: "",
    quantity: "",
    amountKcal: "",
    label: "",
    note: "",
    weekdays: [],
    recurrenceType: "weekly",
    eventRecurrenceType: "none",
    anchorDate: date,
    dayOfMonth: `${new Date(`${date}T00:00:00`).getDate()}`,
    endDate: "",
    categoryId: "",
    folderId: "",
  };
}

function emptyToNull(value: string) {
  return value.trim() ? value : null;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-[#3b3732]">
      {label}
      {children}
    </label>
  );
}

const inputClass = inputClassName;

export function AppShell({ children }: { children: ReactNode }) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [palette, setPalette] = useState<PaletteValue>("robot-vanilla");
  const pathname = usePathname();
  const isSheetsRoute = pathname === "/sheets" || pathname.startsWith("/sheets/");

  useEffect(() => {
    const nextPalette = savedPalette();
    setPalette(nextPalette);
    document.documentElement.dataset.palette = nextPalette;

    function handlePaletteChange(event: Event) {
      setPalette((event as CustomEvent<PaletteValue>).detail);
    }

    window.addEventListener(PALETTE_CHANGED_EVENT, handlePaletteChange);
    return () =>
      window.removeEventListener(PALETTE_CHANGED_EVENT, handlePaletteChange);
  }, []);

  function updatePalette(nextPalette: PaletteValue) {
    setPalette(nextPalette);
    applyPalette(nextPalette);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsQuickAddOpen(true);
      }
    }
    function handleQuickAddOpen() {
      setIsQuickAddOpen(true);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("quick-add:open", handleQuickAddOpen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("quick-add:open", handleQuickAddOpen);
    };
  }, []);

  return (
    <>
      {!isSheetsRoute ? (
        <header className="app-shell-header">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
            <Link className="text-lg font-semibold text-[#2c2925]" href="/sheets">
              COlendar
            </Link>
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
              {navItems.map(([label, href]) => (
                <Link
                  className={`app-nav-link ${
                    isActiveNavItem(pathname, href) ? "app-nav-link-active" : ""
                  }`}
                  href={href}
                  key={href}
                >
                  {label}
                </Link>
              ))}
              <label className="sr-only" htmlFor="app-palette">
                Palette
              </label>
              <select
                className="app-palette-select"
                id="app-palette"
                onChange={(event) =>
                  updatePalette(event.target.value as PaletteValue)
                }
                title="Palette"
                value={palette}
              >
                {palettes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <AppButton
                className="min-h-9 px-3 py-1.5"
                variant="primary"
                onClick={() => setIsQuickAddOpen(true)}
                type="button"
              >
                Quick Add
              </AppButton>
            </div>
          </nav>
        </header>
      ) : null}
      {children}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
    </>
  );
}

function isActiveNavItem(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
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

function QuickAddModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [type, setType] = useState<QuickAddType>("daily-task");
  const [form, setForm] = useState<QuickAddForm>(() => emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    void getTaskCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    void getFolders()
      .then(setFolders)
      .catch(() => setFolders([]));
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  function update<K extends keyof QuickAddForm>(key: K, value: QuickAddForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForNextCreate() {
    setForm(emptyForm(form.date));
  }

  function toggleWeekday(weekday: number) {
    setForm((current) => ({
      ...current,
      weekdays: current.weekdays.includes(weekday)
        ? current.weekdays.filter((item) => item !== weekday)
        : [...current.weekdays, weekday].sort(),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      if (type === "daily-task") {
        await createDailyTask({
          title: form.title,
          description: form.description,
          task_date: form.date,
          planned_time: emptyToNull(form.plannedTime),
          due_date: emptyToNull(form.dueDate),
          due_time: emptyToNull(form.dueTime),
          category_id: form.categoryId ? Number(form.categoryId) : null,
        });
      } else if (type === "weekly-task") {
        if (form.recurrenceType !== "monthly_day" && form.weekdays.length === 0) {
          throw new Error("Choose at least one weekday.");
        }
        await createWeeklyTask({
          title: form.title,
          description: form.description,
          recurrence_type: form.recurrenceType,
          weekdays: form.weekdays,
          anchor_date:
            form.recurrenceType === "biweekly" ? emptyToNull(form.anchorDate) : null,
          day_of_month:
            form.recurrenceType === "monthly_day"
              ? Number(form.dayOfMonth)
              : null,
          end_date: emptyToNull(form.endDate),
          category_id: form.categoryId ? Number(form.categoryId) : null,
        });
      } else if (type === "note") {
        await createNote({
          title: form.title,
          content: form.content,
          folder_id: form.folderId ? Number(form.folderId) : null,
          category_id: form.categoryId ? Number(form.categoryId) : null,
        });
      } else if (type === "calendar-event") {
        if (
          form.eventRecurrenceType !== "none" &&
          form.eventRecurrenceType !== "monthly_day" &&
          form.weekdays.length === 0
        ) {
          throw new Error("Choose at least one weekday.");
        }
        await createCalendarEvent({
          title: form.title,
          description: form.description,
          event_date: form.date,
          start_time: emptyToNull(form.startTime),
          end_time: emptyToNull(form.endTime),
          location: form.location,
          category_id: form.categoryId ? Number(form.categoryId) : null,
          recurrence_type: form.eventRecurrenceType,
          weekdays:
            form.eventRecurrenceType === "weekly" ||
            form.eventRecurrenceType === "biweekly"
              ? form.weekdays
              : [],
          anchor_date:
            form.eventRecurrenceType === "biweekly"
              ? emptyToNull(form.anchorDate)
              : null,
          day_of_month:
            form.eventRecurrenceType === "monthly_day"
              ? Number(form.dayOfMonth)
              : null,
          recurrence_end_date:
            form.eventRecurrenceType === "none" ? null : emptyToNull(form.endDate),
        });
      } else if (type === "water-entry") {
        await createWaterEntry({
          entry_date: form.date,
          amount_ml: Number(form.amountMl),
          note: form.note,
        });
      } else if (type === "activity-entry") {
        await createActivityEntry({
          entry_date: form.date,
          activity_type: form.activityType,
          duration_minutes: form.durationMinutes
            ? Number(form.durationMinutes)
            : null,
          quantity: emptyToNull(form.quantity),
          note: form.note,
        });
      } else {
        await createCalorieEntry({
          entry_date: form.date,
          amount_kcal: Number(form.amountKcal),
          label: form.label,
          note: form.note,
        });
      }

      resetForNextCreate();
      window.dispatchEvent(new Event("quick-add:created"));
      setNotice("Created. The current page will refresh its data automatically.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#2c2925]/35 px-6 py-20 backdrop-blur-sm">
      <div className="sheet-floating-panel w-full max-w-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-[#ded6ca] px-5 py-4">
          <div>
            <p className="app-eyebrow">
              Global Quick Add
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#2c2925]">
              Create from anywhere
            </h2>
          </div>
          <AppButton
            className="min-h-8 px-3 py-1.5 text-xs"
            onClick={onClose}
            type="button"
          >
            Close
          </AppButton>
        </div>

        <form className="space-y-4 px-5 py-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
            <Field label="Item type">
              <select
                className={inputClass}
                onChange={(event) => {
                  setType(event.target.value as QuickAddType);
                  setError(null);
                  setNotice(null);
                }}
                value={type}
              >
                {quickAddTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            {type === "weekly-task" ? (
              <div className="text-sm text-neutral-600">
                Recurring tasks appear on dates that match the simple recurrence below.
              </div>
            ) : type === "calendar-event" ? (
              <DateSelector label="Event date" onChange={(value) => update("date", value)} value={form.date} />
            ) : (
              <DateSelector label="Planned date" onChange={(value) => update("date", value)} value={form.date} />
            )}
          </div>

          {type === "daily-task" ? (
            <DailyTaskFields categories={categories} form={form} update={update} />
          ) : null}
          {type === "weekly-task" ? (
            <WeeklyTaskFields
              categories={categories}
              form={form}
              toggleWeekday={toggleWeekday}
              update={update}
            />
          ) : null}
          {type === "note" ? (
            <NoteFields
              categories={categories}
              folders={folders}
              form={form}
              update={update}
            />
          ) : null}
          {type === "calendar-event" ? (
            <CalendarEventFields
              categories={categories}
              form={form}
              toggleWeekday={toggleWeekday}
              update={update}
            />
          ) : null}
          {type === "water-entry" ? (
            <WaterEntryFields form={form} update={update} />
          ) : null}
          {type === "activity-entry" ? (
            <ActivityEntryFields form={form} update={update} />
          ) : null}
          {type === "calorie-entry" ? (
            <CalorieEntryFields form={form} update={update} />
          ) : null}

          {error ? <ErrorState message={error} /> : null}
          {notice ? <NoticeState message={notice} /> : null}

          <div className="flex flex-wrap justify-end gap-3 border-t border-[#ded6ca] pt-4">
            <AppButton
              onClick={onClose}
              type="button"
            >
              Done
            </AppButton>
            <AppButton
              disabled={isSaving}
              variant="primary"
              type="submit"
            >
              {isSaving ? "Creating..." : "Create"}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}

type FieldProps = {
  form: QuickAddForm;
  update: <K extends keyof QuickAddForm>(key: K, value: QuickAddForm[K]) => void;
};

function DailyTaskFields({
  categories,
  form,
  update,
}: FieldProps & { categories: TaskCategory[] }) {
  return (
    <>
      <Field label="Title">
        <input
          className={inputClass}
          onChange={(event) => update("title", event.target.value)}
          required
          type="text"
          value={form.title}
        />
      </Field>
      <Field label="Description">
        <textarea
          className={`${inputClass} min-h-24`}
          onChange={(event) => update("description", event.target.value)}
          value={form.description}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Planned time">
          <input
            className={inputClass}
            onChange={(event) => update("plannedTime", event.target.value)}
            type="time"
            value={form.plannedTime}
          />
        </Field>
        <Field label="Due date">
          <input
            className={inputClass}
            onChange={(event) => update("dueDate", event.target.value)}
            type="date"
            value={form.dueDate}
          />
        </Field>
        <Field label="Due time">
          <input
            className={inputClass}
            onChange={(event) => update("dueTime", event.target.value)}
            type="time"
            value={form.dueTime}
          />
        </Field>
      </div>
      <Field label="Category">
        <select
          className={inputClass}
          onChange={(event) => update("categoryId", event.target.value)}
          value={form.categoryId}
        >
          <option value="">None</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>
    </>
  );
}

function WeeklyTaskFields({
  categories,
  form,
  toggleWeekday,
  update,
}: FieldProps & {
  categories: TaskCategory[];
  toggleWeekday: (weekday: number) => void;
}) {
  return (
    <>
      <Field label="Title">
        <input
          className={inputClass}
          onChange={(event) => update("title", event.target.value)}
          required
          type="text"
          value={form.title}
        />
      </Field>
      <Field label="Description">
        <textarea
          className={`${inputClass} min-h-24`}
          onChange={(event) => update("description", event.target.value)}
          value={form.description}
        />
      </Field>
      <Field label="Recurrence">
        <select
          className={inputClass}
          onChange={(event) =>
            update(
              "recurrenceType",
              event.target.value as QuickAddForm["recurrenceType"],
            )
          }
          value={form.recurrenceType}
        >
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="monthly_day">Monthly by day</option>
        </select>
      </Field>
      {form.recurrenceType === "monthly_day" ? (
        <Field label="Day of month">
          <input
            className={inputClass}
            max="31"
            min="1"
            onChange={(event) => update("dayOfMonth", event.target.value)}
            required
            type="number"
            value={form.dayOfMonth}
          />
        </Field>
      ) : (
        <fieldset>
          <legend className="text-sm font-medium text-neutral-800">Weekdays</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {WEEKDAYS.map((weekday) => (
              <label
                className={`rounded-md border px-3 py-2 text-sm ${
                  form.weekdays.includes(weekday.value)
                    ? "border-teal-700 bg-teal-50 text-teal-900"
                    : "border-neutral-300 text-neutral-800"
                }`}
                key={weekday.value}
              >
                <input
                  checked={form.weekdays.includes(weekday.value)}
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
      <div className="grid gap-4 sm:grid-cols-2">
        {form.recurrenceType === "biweekly" ? (
          <Field label="Anchor date">
            <input
              className={inputClass}
              onChange={(event) => update("anchorDate", event.target.value)}
              required
              type="date"
              value={form.anchorDate}
            />
          </Field>
        ) : null}
        <Field label="End date">
          <input
            className={inputClass}
            onChange={(event) => update("endDate", event.target.value)}
            type="date"
            value={form.endDate}
          />
        </Field>
      </div>
      <Field label="Category">
        <select
          className={inputClass}
          onChange={(event) => update("categoryId", event.target.value)}
          value={form.categoryId}
        >
          <option value="">None</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>
    </>
  );
}

function NoteFields({
  categories,
  folders,
  form,
  update,
}: FieldProps & { categories: TaskCategory[]; folders: Folder[] }) {
  return (
    <>
      <Field label="Title">
        <input
          className={inputClass}
          onChange={(event) => update("title", event.target.value)}
          required
          type="text"
          value={form.title}
        />
      </Field>
      <Field label="Content">
        <textarea
          className={`${inputClass} min-h-32`}
          onChange={(event) => update("content", event.target.value)}
          value={form.content}
        />
      </Field>
      <Field label="Category">
        <select
          className={inputClass}
          onChange={(event) => update("categoryId", event.target.value)}
          value={form.categoryId}
        >
          <option value="">None</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Folder">
        <select
          className={inputClass}
          onChange={(event) => update("folderId", event.target.value)}
          value={form.folderId}
        >
          <option value="">None</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {noteFolderPath(folder.id, folders) ?? folder.name}
            </option>
          ))}
        </select>
      </Field>
    </>
  );
}

function noteFolderPath(folderId: number, folders: Folder[]) {
  const folderById = new Map(folders.map((folder) => [folder.id, folder]));
  const path: string[] = [];
  let current = folderById.get(folderId);
  const seen = new Set<number>();

  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current.name);
    current =
      current.parent_folder_id === null
        ? undefined
        : folderById.get(current.parent_folder_id);
  }

  return path.length > 0 ? path.join(" / ") : null;
}

function CalendarEventFields({
  categories,
  form,
  toggleWeekday,
  update,
}: FieldProps & {
  categories: TaskCategory[];
  toggleWeekday: (weekday: number) => void;
}) {
  return (
    <>
      <Field label="Title">
        <input
          className={inputClass}
          onChange={(event) => update("title", event.target.value)}
          required
          type="text"
          value={form.title}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start time">
          <input
            className={inputClass}
            onChange={(event) => update("startTime", event.target.value)}
            type="time"
            value={form.startTime}
          />
        </Field>
        <Field label="End time">
          <input
            className={inputClass}
            onChange={(event) => update("endTime", event.target.value)}
            type="time"
            value={form.endTime}
          />
        </Field>
      </div>
      <Field label="Location">
        <input
          className={inputClass}
          onChange={(event) => update("location", event.target.value)}
          type="text"
          value={form.location}
        />
      </Field>
      <Field label="Category">
        <select
          className={inputClass}
          onChange={(event) => update("categoryId", event.target.value)}
          value={form.categoryId}
        >
          <option value="">None</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Recurrence">
        <select
          className={inputClass}
          onChange={(event) =>
            update(
              "eventRecurrenceType",
              event.target.value as QuickAddForm["eventRecurrenceType"],
            )
          }
          value={form.eventRecurrenceType}
        >
          <option value="none">None</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="monthly_day">Monthly by day</option>
        </select>
      </Field>
      {form.eventRecurrenceType === "weekly" ||
      form.eventRecurrenceType === "biweekly" ? (
        <fieldset>
          <legend className="text-sm font-medium text-neutral-800">Weekdays</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {WEEKDAYS.map((weekday) => (
              <label
                className={`rounded-md border px-3 py-2 text-sm ${
                  form.weekdays.includes(weekday.value)
                    ? "border-teal-700 bg-teal-50 text-teal-900"
                    : "border-neutral-300 text-neutral-800"
                }`}
                key={weekday.value}
              >
                <input
                  checked={form.weekdays.includes(weekday.value)}
                  className="mr-2"
                  onChange={() => toggleWeekday(weekday.value)}
                  type="checkbox"
                />
                {weekday.label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {form.eventRecurrenceType === "biweekly" ? (
          <Field label="Anchor date">
            <input
              className={inputClass}
              onChange={(event) => update("anchorDate", event.target.value)}
              required
              type="date"
              value={form.anchorDate}
            />
          </Field>
        ) : null}
        {form.eventRecurrenceType === "monthly_day" ? (
          <Field label="Day of month">
            <input
              className={inputClass}
              max="31"
              min="1"
              onChange={(event) => update("dayOfMonth", event.target.value)}
              required
              type="number"
              value={form.dayOfMonth}
            />
          </Field>
        ) : null}
        {form.eventRecurrenceType !== "none" ? (
          <Field label="End date">
            <input
              className={inputClass}
              onChange={(event) => update("endDate", event.target.value)}
              type="date"
              value={form.endDate}
            />
          </Field>
        ) : null}
      </div>
      <Field label="Description">
        <textarea
          className={`${inputClass} min-h-24`}
          onChange={(event) => update("description", event.target.value)}
          value={form.description}
        />
      </Field>
    </>
  );
}

function WaterEntryFields({ form, update }: FieldProps) {
  return (
    <>
      <Field label="Amount in ml">
        <input
          className={inputClass}
          min="1"
          onChange={(event) => update("amountMl", event.target.value)}
          required
          type="number"
          value={form.amountMl}
        />
      </Field>
      <Field label="Note">
        <input
          className={inputClass}
          onChange={(event) => update("note", event.target.value)}
          type="text"
          value={form.note}
        />
      </Field>
    </>
  );
}

function ActivityEntryFields({ form, update }: FieldProps) {
  return (
    <>
      <Field label="Activity type">
        <input
          className={inputClass}
          onChange={(event) => update("activityType", event.target.value)}
          required
          type="text"
          value={form.activityType}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Duration in minutes">
          <input
            className={inputClass}
            min="0"
            onChange={(event) => update("durationMinutes", event.target.value)}
            type="number"
            value={form.durationMinutes}
          />
        </Field>
        <Field label="Quantity">
          <input
            className={inputClass}
            min="0"
            onChange={(event) => update("quantity", event.target.value)}
            step="0.01"
            type="number"
            value={form.quantity}
          />
        </Field>
      </div>
      <Field label="Note">
        <textarea
          className={`${inputClass} min-h-24`}
          onChange={(event) => update("note", event.target.value)}
          value={form.note}
        />
      </Field>
    </>
  );
}

function CalorieEntryFields({ form, update }: FieldProps) {
  return (
    <>
      <Field label="Amount in kcal">
        <input
          className={inputClass}
          min="1"
          onChange={(event) => update("amountKcal", event.target.value)}
          required
          type="number"
          value={form.amountKcal}
        />
      </Field>
      <Field label="Label">
        <input
          className={inputClass}
          onChange={(event) => update("label", event.target.value)}
          type="text"
          value={form.label}
        />
      </Field>
      <Field label="Note">
        <textarea
          className={`${inputClass} min-h-24`}
          onChange={(event) => update("note", event.target.value)}
          value={form.note}
        />
      </Field>
    </>
  );
}
