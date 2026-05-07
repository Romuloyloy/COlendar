"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useState } from "react";

import {
  createActivityEntry,
  createCalorieEntry,
  createWaterEntry,
} from "@/features/tracker/api";
import { createCalendarEvent } from "@/features/calendar/api";
import { createDailyTask } from "@/features/tasks/api";
import { createNote } from "@/features/notes/api";
import { DateSelector, ErrorState, NoticeState } from "@/components/ui";
import { todayIsoDate } from "@/lib/date";

const navItems = [
  ["Home", "/"],
  ["Notes", "/notes"],
  ["Tasks", "/tasks"],
  ["Calendar", "/calendar"],
  ["Planning", "/planning"],
  ["Tracker", "/tracker"],
];

const quickAddTypes = [
  { value: "daily-task", label: "Daily Task" },
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
};

function emptyForm(date = todayIsoDate()): QuickAddForm {
  return {
    title: "",
    description: "",
    content: "",
    date,
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
    <label className="block text-sm font-medium text-neutral-800">
      {label}
      {children}
    </label>
  );
}

const inputClass =
  "mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm";

export function AppShell({ children }: { children: ReactNode }) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsQuickAddOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="border-b border-neutral-300 bg-white/95">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link className="text-lg font-semibold text-neutral-950" href="/">
            COlendar
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {navItems.map(([label, href]) => (
              <Link
                className="rounded-md px-3 py-1.5 text-neutral-700 hover:bg-neutral-100 hover:text-teal-700"
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
            <button
              className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-800"
              onClick={() => setIsQuickAddOpen(true)}
              type="button"
            >
              Quick Add
            </button>
          </div>
        </nav>
      </header>
      {children}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
    </>
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
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  function update<K extends keyof QuickAddForm>(key: K, value: QuickAddForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForNextCreate() {
    setForm(emptyForm(form.date));
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
        });
      } else if (type === "note") {
        await createNote({
          title: form.title,
          content: form.content,
          folder_id: null,
        });
      } else if (type === "calendar-event") {
        await createCalendarEvent({
          title: form.title,
          description: form.description,
          event_date: form.date,
          start_time: emptyToNull(form.startTime),
          end_time: emptyToNull(form.endTime),
          location: form.location,
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-neutral-950/30 px-6 py-20">
      <div className="w-full max-w-2xl rounded-md border border-neutral-300 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-teal-700">
              Global Quick Add
            </p>
            <h2 className="mt-1 text-xl font-semibold text-neutral-950">
              Create from anywhere
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
            <DateSelector label="Date" onChange={(value) => update("date", value)} value={form.date} />
          </div>

          {type === "daily-task" ? (
            <DailyTaskFields form={form} update={update} />
          ) : null}
          {type === "note" ? <NoteFields form={form} update={update} /> : null}
          {type === "calendar-event" ? (
            <CalendarEventFields form={form} update={update} />
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

          <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-200 pt-4">
            <button
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
              onClick={onClose}
              type="button"
            >
              Done
            </button>
            <button
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Creating..." : "Create"}
            </button>
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

function DailyTaskFields({ form, update }: FieldProps) {
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
    </>
  );
}

function NoteFields({ form, update }: FieldProps) {
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
    </>
  );
}

function CalendarEventFields({ form, update }: FieldProps) {
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
